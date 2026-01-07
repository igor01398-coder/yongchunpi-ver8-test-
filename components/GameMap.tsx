
import React, { useEffect, useRef, useState } from 'react';
import { Puzzle } from '../types';
import { Navigation, Globe, Map as MapIcon, Layers, Play, Loader2 } from 'lucide-react';

// Declare Leaflet types since we are loading it via script tag
declare global {
  interface Window {
    L: any;
  }
}

interface GameMapProps {
  puzzles: Puzzle[];
  onPuzzleSelect: (puzzle: Puzzle) => void;
  fogEnabled: boolean;
  fogOpacity: number;
  onGpsStatusChange: (status: 'searching' | 'locked' | 'error', accuracy?: number) => void;
  completedPuzzleIds: string[];
  gpsRetryTrigger?: number;
}

// Constant for the Fog of War "Clear Zone" radius (in meters)
const FOG_RADIUS = 80;

// --- Geo Math Helpers ---
function toRad(deg: number) {
    return deg * Math.PI / 180;
}

function toDeg(rad: number) {
    return rad * 180 / Math.PI;
}

function getBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
    const dLon = toRad(lng2 - lng1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
}

function getDestination(lat: number, lng: number, brng: number, distMeters: number) {
    const R = 6371000; // Earth Radius in meters
    const angDist = distMeters / R;
    const lat1 = toRad(lat);
    const lon1 = toRad(lng);
    const brngRad = toRad(brng);

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(angDist) +
                           Math.cos(lat1) * Math.sin(angDist) * Math.cos(brngRad));
    const lon2 = lon1 + Math.atan2(Math.sin(brngRad) * Math.sin(angDist) * Math.cos(lat1),
                                   Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2));

    return { lat: toDeg(lat2), lng: toDeg(lon2) };
}

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371e3; // metres
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2-lat1);
    const Δλ = toRad(lng2-lng1);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// Helper to safely remove layer to avoid _leaflet_pos errors
const safeRemoveLayer = (map: any, layer: any) => {
    if (!map || !layer) return;
    try {
        // Only attempt removal if map is valid and has the layer
        if (map._mapPane && map.hasLayer(layer)) {
            map.removeLayer(layer);
        }
    } catch (e) {
        // Suppress errors during cleanup
    }
};

export const GameMap: React.FC<GameMapProps> = ({ puzzles, onPuzzleSelect, fogEnabled, fogOpacity, onGpsStatusChange, completedPuzzleIds, gpsRetryTrigger = 0 }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  
  // Use state for map instance to ensure dependent effects wait for it
  const [mapInstance, setMapInstance] = useState<any>(null);
  // Ref to track if initialization has started/completed to prevent double-init in Strict Mode
  const isInitializedRef = useRef(false);

  const userMarkerRef = useRef<any>(null);
  const accuracyCircleRef = useRef<any>(null);
  const fogLayerRef = useRef<any>(null);
  // Store markers in an object to track them by ID/Name
  const landmarksRef = useRef<{[key: string]: any}>({});
  const markersRef = useRef<{[key: string]: any}>({}); 
  const arrowsRef = useRef<{[key: string]: any}>({});

  const [isAutoFollow, setIsAutoFollow] = useState<boolean>(true);
  const [userPos, setUserPos] = useState<{lat: number, lng: number} | null>(null);
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<string | null>(null);

  const DEFAULT_LAT = 25.031546843359315;
  const DEFAULT_LNG = 121.57944711977618;

  // Track mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // 1. Initialization Hook
  useEffect(() => {
    if (!mapContainerRef.current || !window.L) return;
    
    // Prevent double initialization check if Leaflet already attached to this element
    if ((mapContainerRef.current as any)._leaflet_id) {
        return; 
    }
    
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    let retryCount = 0;
    const maxRetries = 20;

    // Initialization logic wrapped in a function to allow retries
    const tryInitMap = () => {
        if (!isMountedRef.current) return;
        if (!mapContainerRef.current) return;

        // CRITICAL FIX FOR IOS: Wait for container to have significant height
        // iOS transitions can cause clientHeight to be unstable initially.
        // Wait until height > 0.
        if (mapContainerRef.current.clientHeight <= 0 && retryCount < maxRetries) {
            retryCount++;
            // Retry a bit slower to allow iOS UI to settle
            setTimeout(tryInitMap, 100);
            return;
        }

        try {
            // iOS Fix: Force a browser reflow/repaint to ensure dimensions are real
            const _ = mapContainerRef.current.offsetHeight;

            // Initialize Map
            const map = window.L.map(mapContainerRef.current, {
              center: [DEFAULT_LAT, DEFAULT_LNG],
              zoom: 16,
              zoomControl: false,
              attributionControl: false,
              fadeAnimation: true, 
              zoomAnimation: true,
              markerZoomAnimation: true,
              // iOS Fix: prevent weird touch behaviors
              tap: false 
            });

            map.on('dragstart', () => setIsAutoFollow(false));
            map.on('click', () => setSelectedPuzzleId(null));

            window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
              maxZoom: 19,
              subdomains: 'abcd'
            }).addTo(map);

            if (isMountedRef.current) {
                setMapInstance(map);
            }

            // Force Leaflet to re-calculate size using requestAnimationFrame
            // This is crucial for iOS to ensure update happens in the correct paint frame
            const forceUpdate = () => {
                if(isMountedRef.current && map && map._mapPane) {
                    map.invalidateSize();
                }
            };
            
            // Multiple triggers to catch end of iOS spring animations
            requestAnimationFrame(forceUpdate);
            setTimeout(() => requestAnimationFrame(forceUpdate), 300);
            setTimeout(() => requestAnimationFrame(forceUpdate), 600);
            setTimeout(() => requestAnimationFrame(forceUpdate), 1000);

        } catch (e) {
            console.error("Map initialization failed", e);
        }
    };

    // iOS FIX: Increased initial delay from 100ms to 400ms.
    // Navigating back from a heavy page (like ImageEditor) on iOS often involves a visual slide transition.
    // Initializing the map *during* this transition causes the 0-height bug. 400ms is safe for most transitions.
    const initTimer = setTimeout(tryInitMap, 400);

    return () => {
      clearTimeout(initTimer);
      isInitializedRef.current = false;
    };
  }, []); // Run only once on mount

  // 1.5 Map Instance Management (Resize & Cleanup)
  useEffect(() => {
    if (!mapInstance || !mapContainerRef.current) return;

    const handleResize = () => {
        if (mapInstance && mapInstance._mapPane) {
            requestAnimationFrame(() => {
                try {
                    mapInstance.invalidateSize();
                } catch(e) {}
            });
        }
    };

    const resizeObserver = new ResizeObserver(() => {
        handleResize();
    });
    
    if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
        resizeObserver.disconnect();
        
        // Cleanup map instance on unmount
        if (mapInstance) {
            try {
                mapInstance.off(); // Remove all event listeners
                mapInstance.remove(); // Destroy map
            } catch (e) {
                console.warn("Map removal error:", e);
            }
        }
        if (isMountedRef.current) {
             setMapInstance(null);
        }
    };
  }, [mapInstance]);

  // 2. GPS & User Marker Hook
  useEffect(() => {
    if (!mapInstance || !window.L) return;

    let hasCentered = false;

    const updateUserPosition = (lat: number, lng: number, accuracy?: number) => {
        if (!isMountedRef.current) return;
        setUserPos({ lat, lng });

        // Ensure map hasn't been destroyed
        if (!mapInstance || !mapInstance._mapPane) return;

        try {
            if (!userMarkerRef.current) {
                const icon = window.L.divIcon({
                    className: 'user-marker',
                    html: `
                      <div class="relative flex items-center justify-center w-12 h-12">
                         <div id="user-heading-arrow" class="absolute w-full h-full flex items-center justify-center transition-transform duration-200" style="transform: rotate(0deg);">
                            <div class="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[12px] border-b-blue-500" style="margin-bottom: 24px;"></div>
                         </div>
                         <div class="absolute w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75"></div>
                         <div class="relative w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md z-10"></div>
                      </div>
                    `,
                    iconSize: [48, 48],
                    iconAnchor: [24, 24]
                });
                userMarkerRef.current = window.L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(mapInstance);
            } else {
                if (mapInstance.hasLayer(userMarkerRef.current)) {
                    try { userMarkerRef.current.setLatLng([lat, lng]); } catch(e) {}
                } else {
                    userMarkerRef.current.addTo(mapInstance);
                    try { userMarkerRef.current.setLatLng([lat, lng]); } catch(e) {}
                }
            }

            if (accuracy !== undefined) {
                if (!accuracyCircleRef.current) {
                    accuracyCircleRef.current = window.L.circle([lat, lng], { radius: accuracy, color: '#3b82f6', fillOpacity: 0.15, weight: 1, interactive: false }).addTo(mapInstance);
                } else {
                    if (mapInstance.hasLayer(accuracyCircleRef.current)) {
                        try {
                            accuracyCircleRef.current.setLatLng([lat, lng]);
                            accuracyCircleRef.current.setRadius(accuracy);
                        } catch(e) {}
                    } else {
                        accuracyCircleRef.current.addTo(mapInstance);
                    }
                }
            }

            // Only auto-center on first fix or if auto-follow is active
            if (!hasCentered) {
                mapInstance.setView([lat, lng], 17);
                hasCentered = true;
            } else if (isAutoFollow) {
                mapInstance.panTo([lat, lng]);
            }
        } catch (e) {
            console.warn("Error updating user position:", e);
        }
    };

    if (!navigator.geolocation) {
        if (isMountedRef.current) onGpsStatusChange('error');
        updateUserPosition(DEFAULT_LAT, DEFAULT_LNG);
        return;
    }

    if (isMountedRef.current) onGpsStatusChange('searching');
    
    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            if (isMountedRef.current) onGpsStatusChange('locked', pos.coords.accuracy);
            updateUserPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        () => {
            if (isMountedRef.current) onGpsStatusChange('error');
            updateUserPosition(DEFAULT_LAT, DEFAULT_LNG);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );

    // Orientation Handler
    const handleOrientation = (event: DeviceOrientationEvent) => {
      let heading = 0;
      if ((event as any).webkitCompassHeading) {
        heading = (event as any).webkitCompassHeading;
      } else if (event.alpha !== null) {
        heading = 360 - event.alpha;
      }
      const arrow = document.getElementById('user-heading-arrow');
      if (arrow) {
          arrow.style.transform = `rotate(${heading}deg)`;
      }
    };
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }

    return () => {
        navigator.geolocation.clearWatch(watchId);
        window.removeEventListener('deviceorientation', handleOrientation);
        // Clean up markers safely
        try {
            if (mapInstance && mapInstance._mapPane) {
                safeRemoveLayer(mapInstance, userMarkerRef.current);
                safeRemoveLayer(mapInstance, accuracyCircleRef.current);
            }
        } catch (e) {
            // Ignore errors during unmount
        }
        userMarkerRef.current = null;
        accuracyCircleRef.current = null;
    };
  }, [mapInstance, gpsRetryTrigger, isAutoFollow]);

  // 3. Landmarks & Fog Logic Hook
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    if (!mapInstance._mapPane) return;

    const LANDMARKS = [
      { name: '虎山', height: 142, lat: 25.031571054733273, lng: 121.58361867008533 },
      { name: '豹山', height: 141, lat: 25.029558090580725, lng: 121.582654871389 },
      { name: '獅山', height: 150, lat: 25.026732268016207, lng: 121.58067762839389 },
      { name: '象山', height: 184, lat: 25.02788330197117, lng: 121.5762413424949 }
    ];

    // Manage Landmarks Visibility using a Set to track what should be visible
    const activeLandmarks = new Set<string>();

    LANDMARKS.forEach(lm => {
        let isVisible = true;
        if (fogEnabled && userPos) {
            const dist = getDistance(userPos.lat, userPos.lng, lm.lat, lm.lng);
            if (dist > FOG_RADIUS) isVisible = false;
        }

        if (isVisible) {
            activeLandmarks.add(lm.name);
            
            try {
                // Create if not exists
                if (!landmarksRef.current[lm.name]) {
                    const icon = window.L.divIcon({
                        className: 'landmark-label',
                        html: `<div class="flex flex-col items-center justify-center">
                                <div class="w-2 h-2 bg-slate-600 rounded-full ring-2 ring-white"></div>
                                <span class="mt-1 text-[10px] font-bold text-slate-700 bg-white/80 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap border border-slate-200">${lm.name}</span>
                            </div>`,
                        iconSize: [40, 40],
                        iconAnchor: [20, 5] 
                    });
                    
                    const marker = window.L.marker([lm.lat, lm.lng], { icon, interactive: true, zIndexOffset: 400 });
                    marker.on('click', () => {
                        const isMission1Complete = completedPuzzleIds.includes('1');
                        const heightText = isMission1Complete 
                            ? `<span class="text-teal-600 font-bold">高度: ${lm.height}m</span>` 
                            : `<span class="text-slate-400">高度: ???</span>`;

                        window.L.popup({ offset: [0, -10], closeButton: false })
                            .setLatLng([lm.lat, lm.lng])
                            .setContent(`<div class="text-center text-xs font-mono"><b>${lm.name}</b><br/>${heightText}</div>`)
                            .openOn(mapInstance);
                    });
                    marker.addTo(mapInstance);
                    landmarksRef.current[lm.name] = marker;
                } else if (!mapInstance.hasLayer(landmarksRef.current[lm.name])) {
                    // If marker exists but removed (e.g. toggled back on), re-add
                    landmarksRef.current[lm.name].addTo(mapInstance);
                }
            } catch (e) { console.warn("Landmark error", e); }
        }
    });

    // Remove stale landmarks
    Object.keys(landmarksRef.current).forEach(key => {
        if (!activeLandmarks.has(key)) {
            safeRemoveLayer(mapInstance, landmarksRef.current[key]);
            delete landmarksRef.current[key];
        }
    });

    try {
        // Fog Layer Geometry
        if (fogEnabled && userPos) {
            const worldCoords = [[90, -180], [90, 180], [-90, 180], [-90, -180]];
            const holePoints = [];
            for(let i=0; i<=360; i+=10) {
                const dest = getDestination(userPos.lat, userPos.lng, i, FOG_RADIUS);
                holePoints.push([dest.lat, dest.lng]);
            }

            if (fogLayerRef.current) {
                fogLayerRef.current.setLatLngs([worldCoords, holePoints]);
                fogLayerRef.current.setStyle({ fillOpacity: fogOpacity });
                if (!mapInstance.hasLayer(fogLayerRef.current)) fogLayerRef.current.addTo(mapInstance);
            } else {
                const fogPolygon = window.L.polygon([worldCoords, holePoints], {
                    color: 'transparent',
                    fillColor: '#ffffff',
                    fillOpacity: fogOpacity,
                    className: 'fog-of-war',
                    interactive: false,
                    zIndex: 500
                }).addTo(mapInstance);
                fogLayerRef.current = fogPolygon;
            }
        } else if (fogLayerRef.current) {
            safeRemoveLayer(mapInstance, fogLayerRef.current);
            fogLayerRef.current = null;
        }
    } catch (e) { console.warn("Fog error", e); }
  }, [mapInstance, fogEnabled, userPos, completedPuzzleIds, fogOpacity]);

  // 4. Puzzle Markers Hook (Optimized)
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    if (!mapInstance._mapPane) return;

    puzzles.forEach(puzzle => {
        const isSelected = selectedPuzzleId === puzzle.id;
        const isCompleted = completedPuzzleIds.includes(puzzle.id);
        let isVisible = true;
        if (fogEnabled && userPos) {
            isVisible = getDistance(userPos.lat, userPos.lng, puzzle.lat, puzzle.lng) <= FOG_RADIUS;
        }

        if (!isVisible) {
            if (markersRef.current[puzzle.id]) {
                safeRemoveLayer(mapInstance, markersRef.current[puzzle.id]);
                delete markersRef.current[puzzle.id];
            }
            return;
        }

        let colorClass = isCompleted ? 'bg-slate-400' : 
            (puzzle.difficulty === 'Novice' ? 'bg-emerald-500' : 
            puzzle.difficulty === 'Geologist' ? 'bg-amber-500' : 
            puzzle.difficulty === 'Expert' ? 'bg-rose-500' : 'bg-indigo-500');

        const html = `
            <div class="relative flex items-center justify-center w-12 h-12">
                ${!isCompleted ? `<div class="absolute inset-2 ${colorClass} rounded-full animate-ping opacity-40"></div>` : ''}
                <div class="relative w-8 h-8 ${colorClass} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform ${isSelected ? 'scale-125 ring-4 ring-teal-300' : ''}">
                   ${isCompleted 
                     ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                     : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>'
                   }
                </div>
            </div>
        `;

        try {
            if (!markersRef.current[puzzle.id]) {
                const icon = window.L.divIcon({ className: 'custom-puzzle-marker', html, iconSize: [48, 48], iconAnchor: [24, 24] });
                const marker = window.L.marker([puzzle.lat, puzzle.lng], { icon });
                marker.on('click', () => setSelectedPuzzleId(puzzle.id));
                marker.addTo(mapInstance);
                // Store current HTML to avoid redundant setIcon calls
                (marker as any)._lastHtml = html;
                markersRef.current[puzzle.id] = marker;
            } else {
                 const marker = markersRef.current[puzzle.id];
                 if (!mapInstance.hasLayer(marker)) {
                     marker.addTo(mapInstance);
                 }
                 // Only update if visual state changed
                 if ((marker as any)._lastHtml !== html) {
                     marker.setIcon(window.L.divIcon({ className: 'custom-puzzle-marker', html, iconSize: [48, 48], iconAnchor: [24, 24] }));
                     (marker as any)._lastHtml = html;
                 }
            }
        } catch (e) { console.warn("Puzzle marker error", e); }
    });
  }, [mapInstance, puzzles, selectedPuzzleId, completedPuzzleIds, fogEnabled, userPos]);

  // 5. Directional Arrows Hook (Optimized to reuse markers)
  useEffect(() => {
    if (!mapInstance || !window.L) return;
    if (!mapInstance._mapPane) return;
    
    // Track valid arrow IDs for cleanup
    const activeArrowIds = new Set<string>();

    if (fogEnabled && userPos) {
        puzzles.forEach(puzzle => {
            if (completedPuzzleIds.includes(puzzle.id)) return;
            const dist = getDistance(userPos.lat, userPos.lng, puzzle.lat, puzzle.lng);
            if (dist > FOG_RADIUS) {
                activeArrowIds.add(puzzle.id);

                const bearing = getBearing(userPos.lat, userPos.lng, puzzle.lat, puzzle.lng);
                const arrowPos = getDestination(userPos.lat, userPos.lng, bearing, FOG_RADIUS - 20);
                
                try {
                    if (arrowsRef.current[puzzle.id]) {
                        // Update existing
                        const arrow = arrowsRef.current[puzzle.id];
                        try {
                           arrow.setLatLng([arrowPos.lat, arrowPos.lng]);
                        } catch(e) {}
                        
                        const color = puzzle.difficulty === 'Novice' ? '#10b981' : (puzzle.difficulty === 'Geologist' ? '#f59e0b' : (puzzle.difficulty === 'Expert' ? '#f43f5e' : '#6366f1'));
                        const html = `<div style="transform: rotate(${Math.round(bearing)}deg); display: flex; align-items: center; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2"><polygon points="12 2 22 22 12 18 2 22" /></svg></div>`;
                        
                        // Optimization: Only update DOM if bearing changes by > 2 degrees to reduce layout thrashing
                        const lastBearing = (arrow as any)._lastBearing || 0;
                        if (Math.abs(lastBearing - bearing) > 2) {
                            arrow.setIcon(window.L.divIcon({
                                className: 'custom-arrow-icon',
                                html,
                                iconSize: [32, 32],
                                iconAnchor: [16, 16]
                            }));
                            (arrow as any)._lastBearing = bearing;
                        }
                        
                        if (!mapInstance.hasLayer(arrow)) arrow.addTo(mapInstance);

                    } else {
                        // Create new
                        const color = puzzle.difficulty === 'Novice' ? '#10b981' : (puzzle.difficulty === 'Geologist' ? '#f59e0b' : (puzzle.difficulty === 'Expert' ? '#f43f5e' : '#6366f1'));
                        const html = `<div style="transform: rotate(${Math.round(bearing)}deg); display: flex; align-items: center; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2"><polygon points="12 2 22 22 12 18 2 22" /></svg></div>`;
                        
                        const icon = window.L.divIcon({
                            className: 'custom-arrow-icon',
                            html,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        });
                        const marker = window.L.marker([arrowPos.lat, arrowPos.lng], { icon, interactive: false, zIndexOffset: 1000 }).addTo(mapInstance);
                        (marker as any)._lastBearing = bearing;
                        arrowsRef.current[puzzle.id] = marker;
                    }
                } catch (e) { console.warn("Arrow marker error", e); }
            }
        });
    }

    // Cleanup stale arrows
    Object.keys(arrowsRef.current).forEach(id => {
        if (!activeArrowIds.has(id)) {
            safeRemoveLayer(mapInstance, arrowsRef.current[id]);
            delete arrowsRef.current[id];
        }
    });

  }, [mapInstance, fogEnabled, userPos, puzzles, completedPuzzleIds]);

  const toggleAutoFollow = () => {
      if (isAutoFollow) {
          setIsAutoFollow(false);
      } else {
          if (userPos && mapInstance && mapInstance._mapPane) mapInstance.setView([userPos.lat, userPos.lng], 17);
          setIsAutoFollow(true);
      }
  };

  const selectedPuzzle = selectedPuzzleId ? puzzles.find(p => p.id === selectedPuzzleId) : null;
  const distanceToTarget = (userPos && selectedPuzzle) ? Math.round(getDistance(userPos.lat, userPos.lng, selectedPuzzle.lat, selectedPuzzle.lng)) : 0;

  return (
    <div className="relative w-full h-full bg-slate-200 flex-1 overflow-hidden isolate">
      <div ref={mapContainerRef} className="absolute inset-0 z-0 outline-none" />
      
      {!mapInstance && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-sm z-50">
              <Loader2 className="w-10 h-10 text-teal-600 animate-spin mb-2" />
              <div className="text-sm font-mono text-teal-700 animate-pulse uppercase tracking-widest">Initialising Grid...</div>
          </div>
      )}

      {selectedPuzzle && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm">
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden p-4">
                  <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-800 font-mono text-sm">{selectedPuzzle.title}</h3>
                      <div className="text-right"><div className="text-xl font-bold font-mono text-teal-600">{distanceToTarget}m</div></div>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">{selectedPuzzle.description}</p>
                  <div className="flex gap-2">
                      <button onClick={() => setSelectedPuzzleId(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 py-2 rounded font-bold text-xs font-mono transition-colors">CANCEL</button>
                      <button onClick={() => onPuzzleSelect(selectedPuzzle)} className="flex-[2] bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-bold text-xs font-mono shadow-md transition-colors">
                        {completedPuzzleIds.includes(selectedPuzzle.id) ? 'REVIEW MISSION' : 'START SCAN'}
                      </button>
                  </div>
              </div>
          </div>
      )}
      
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-3">
        <a 
            href="https://geomap.gsmma.gov.tw/gwh/gsb97-1/sys8a/t3/index1.cfm"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full shadow-lg border-2 bg-white text-slate-600 border-slate-100 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center"
            title="開啟線上地質圖"
        >
            <Layers className="w-6 h-6" />
        </a>

        <a 
            href="https://en.mapy.cz/turisticka?x=121.5810&y=25.0310&z=16"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full shadow-lg border-2 bg-white text-slate-600 border-slate-100 hover:text-teal-600 hover:border-teal-200 transition-all flex items-center justify-center"
            title="開啟 Mapy 等高線圖"
        >
            <MapIcon className="w-6 h-6" />
        </a>

        <button onClick={toggleAutoFollow} className={`p-3 rounded-full shadow-lg border-2 transition-all ${isAutoFollow ? 'bg-teal-600 text-white border-teal-400' : 'bg-white text-slate-600 border-slate-100'}`}>
            <Navigation className={`w-6 h-6 ${isAutoFollow ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
};
