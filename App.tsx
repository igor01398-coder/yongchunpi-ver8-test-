
import React, { useState, useEffect, useCallback } from 'react';
import { Puzzle, AppView, PlayerStats, PuzzleProgress, SideMissionSubmission } from './types';
import { ImageEditor } from './components/ImageEditor';
import { GameMap } from './components/GameMap';
import { IntroScreen } from './components/IntroScreen';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { ManualModal } from './components/ManualModal';
import { TreasureMapModal } from './components/TreasureMapModal';
import { WeatherWidget } from './components/WeatherWidget';
import { playSfx, setSfxEnabled } from './services/audioService';
import { User, Satellite, LifeBuoy, BookOpen, X, Mountain, Info, ClipboardList, ChevronRight, CloudFog, MapPin, CheckCircle, AlertTriangle, Book, Clock, RotateCcw, Settings, Lock, ExternalLink } from 'lucide-react';

const SAMPLE_PUZZLES: Puzzle[] = [
  {
    id: '1',
    title: 'Mission 01: 四獸山連線',
    description: '透過方位與地形觀察理解永春陂是被四獸山包圍的山谷窪地。',
    targetPromptHint: 'Overlay digital measurement grid on mountain peaks',
    difficulty: 'Novice',
    xpReward: 300,
    rankRequirement: 'Cadet',
    lat: 25.032647652556317,
    lng: 121.58009862209747,
    fragmentId: 0,
    type: 'main',
    quiz: {
      question: "請對照Mapy，回答下列問題",
      answer: "138,141,151,183"
    },
    openingStory: [
        { speaker: '村長', text: '這裡就是永春陂的入口。你看，周圍的山勢是不是很特別？' },
        { speaker: '王老師', text: '沒錯。請打開地圖，確認一下我們被哪些山頭包圍了。' },
        { speaker: '王老師', text: '這四座山頭——虎、豹、獅、象，是守護這裡的關鍵。要了解永春陂，得先認識它們的高度與位置。' }
    ],
    referenceImage: 'https://drive.google.com/uc?export=view&id=1-UVds4tg7gQxZo19uTgqyvfTwmEwI3c8',
    referenceCheckImages: [
        'https://drive.google.com/uc?export=view&id=11CSe57nK3J-0hju0mRR8eDQ9g4hqn5JF',
        'https://drive.google.com/uc?export=view&id=1_XGaO_K9uv4SaZsAc-LIiSPDCXBVbLtt'
    ]
  },
  {
    id: '2',
    title: 'Mission 02: 岩層解密',
    description: '請觀察岩壁並查詢地質資料，辨識此處的地層與岩石觸感。',
    targetPromptHint: '描述岩石特徵',
    difficulty: 'Geologist',
    xpReward: 300,
    rankRequirement: 'Scout',
    lat: 25.028155021059753,
    lng: 121.57924699325368,
    fragmentId: 1,
    quiz: {
      question: "地層辨識與岩石觸感分析",
      answer: "南港層+配對"
    },
    openingStory: [
        { speaker: '王老師', text: '停一下！看看你身邊這片裸露的岩壁。' },
        { speaker: '村長', text: '這片石頭看起來破破爛爛的，有什麼特別嗎？' },
        { speaker: '王老師', text: '這可是大地的歷史書！這層岩石叫做「南港層」，是這裡最主要的地基。' },
        { speaker: '王老師', text: '請各位同學上前去摸摸看。有些粗粗的像砂紙，有些滑滑的像粉末。' },
        { speaker: '王老師', text: '試著分辨「砂岩」和「頁岩」，就能知道為什麼這裡會形成凹陷的陂塘了。' }
    ],
    type: 'main',
    referenceImage: 'https://drive.google.com/uc?export=view&id=1XEaYf4LuoadsCnneUUGQPFBObLRE9ikA',
    referenceCheckImages: [
        'https://drive.google.com/uc?export=view&id=1pyoxwe__OHmvF5RwO3KUwunbBF7OSX4E',
        'https://drive.google.com/uc?export=view&id=1hkYG5AeVQqsTkLFS9X7r84TA3k_f6BMC'
    ]
  },
  {
    id: '3',
    title: 'Mission 03: 等高線挑戰',
    description: '請觀察Mapy裡的等高線圖並繪製路線。',
    targetPromptHint: 'Project holographic red contour lines onto the terrain',
    difficulty: 'Expert',
    xpReward: 300,
    rankRequirement: 'Ranger',
    lat: 25.029229726415355, 
    lng: 121.57698592023897,
    fragmentId: 2,
    quiz: {
      question: "爬完的感受？",
      answer: "等高線越密集，爬起來越累 或 稀疏→不累"
    },
    openingStory: [
        { speaker: '村長', text: '呼... 這裡的坡好陡啊，爬得我氣喘吁吁。' },
        { speaker: '王老師', text: '哈哈，這就是地形的奧秘。打開你的 Mapy 地圖應用程式。' },
        { speaker: '王老師', text: '看看地圖上那一圈一圈的線條，這叫做「等高線」。' },
        { speaker: '王老師', text: '線條密的地方就是陡坡，疏的地方就是緩坡。學會看這個，下次就不會走冤枉路了！' }
    ],
    uploadInstruction: "上傳您的Mapy截圖，並繪製路線。",
    type: 'main',
    referenceImage: 'https://drive.google.com/uc?export=view&id=1h1z0gNtdVvAfhZr_DqhbYAZJk3dxj0zL'
  }
];

const SIDE_MISSIONS: Puzzle[] = [
  {
    id: 's1',
    title: '擋土牆獵人',
    description: '校園或步道周邊有許多保護邊坡的擋土牆。請尋找擋土牆，觀察其結構與排水狀況。',
    targetPromptHint: 'Analyze retaining wall structure',
    difficulty: 'Novice',
    xpReward: 50,
    rankRequirement: 'Freelancer',
    lat: 0,
    lng: 0,
    fragmentId: -1,
    type: 'side',
    uploadInstruction: '請拍攝擋土牆正面照片。',
    referenceCheckImages: [
        'https://drive.google.com/uc?export=view&id=1luPB-i-a_YzHmPQiJVcxthPDBiPpv6Zl',
        'https://drive.google.com/uc?export=view&id=1p0Az9jvsbjadMIQojasL4rhlr63mrf5D'
    ]
  }
];

const INITIAL_STATS: PlayerStats = {
  level: 1,
  currentXp: 0,
  nextLevelXp: 500,
  rank: '小小地質學家',
  mana: 75,
  maxMana: 100,
  sosCount: 1
};

const STORAGE_KEY = 'yongchun_save_v1';

const App: React.FC = () => {
  const [initialSaveData] = useState<any>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.startTime) parsed.startTime = new Date(parsed.startTime);
            if (parsed.endTime) parsed.endTime = new Date(parsed.endTime);
            return parsed;
        }
    } catch (e) { console.error(e); }
    return null;
  });

  const [view, setView] = useState<AppView>(AppView.INTRO);
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats>(initialSaveData?.playerStats || INITIAL_STATS);
  const [teamName, setTeamName] = useState<string>(initialSaveData?.teamName || 'UNIT-734');
  const [isSfxEnabledState, setIsSfxEnabledState] = useState<boolean>(initialSaveData?.isSfxEnabled ?? true);
  const [isFogEnabled, setIsFogEnabled] = useState<boolean>(true);

  const [isFogTimeReached, setIsFogTimeReached] = useState<boolean>(() => {
      if (initialSaveData?.startTime) {
          const diff = (new Date().getTime() - initialSaveData.startTime.getTime()) / 1000;
          return diff >= 1200;
      }
      return false;
  });

  const [fogOpacity, setFogOpacity] = useState<number>(0);
  const [showManual, setShowManual] = useState<boolean>(false); 
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTreasureMap, setShowTreasureMap] = useState<boolean>(false); 
  const [showSideMissions, setShowSideMissions] = useState<boolean>(false); 
  const [showEncyclopedia, setShowEncyclopedia] = useState<boolean>(false); 
  const [showProfile, setShowProfile] = useState<boolean>(false); 
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'locked' | 'error'>('searching');
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsRetryTrigger, setGpsRetryTrigger] = useState<number>(0);
  const [collectedFragments, setCollectedFragments] = useState<number[]>(initialSaveData?.collectedFragments || []);
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<string[]>(initialSaveData?.completedPuzzleIds || []);
  const [startTime, setStartTime] = useState<Date | null>(initialSaveData?.startTime || null);
  const [endTime, setEndTime] = useState<Date | null>(initialSaveData?.endTime || null);
  const [missionDuration, setMissionDuration] = useState<string>("00:00:00");
  const [puzzleProgress, setPuzzleProgress] = useState<Record<string, PuzzleProgress>>(initialSaveData?.puzzleProgress || {});
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { setSfxEnabled(isSfxEnabledState); }, [isSfxEnabledState]);

  useEffect(() => {
    if (!startTime || endTime) return;
    const interval = setInterval(() => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        if (diffInSeconds >= 1200) {
            if (!isFogTimeReached) setIsFogTimeReached(true);
            const progress = Math.min(Math.max((diffInSeconds - 1200) / 20, 0), 1);
            setFogOpacity(progress * 0.9);
        }
        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;
        setMissionDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, endTime, isFogTimeReached]);

  useEffect(() => {
    if (!startTime) return;
    const dataToSave = {
        playerStats, teamName, collectedFragments, completedPuzzleIds,
        startTime: startTime.toISOString(), endTime: endTime ? endTime.toISOString() : null,
        puzzleProgress, isSfxEnabled: isSfxEnabledState
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [playerStats, teamName, collectedFragments, completedPuzzleIds, startTime, endTime, puzzleProgress, isSfxEnabledState]);

  const handleIntroStart = (name: string) => {
    setPlayerStats(INITIAL_STATS);
    setCollectedFragments([]);
    setCompletedPuzzleIds([]);
    setPuzzleProgress({});
    setEndTime(null);
    setTeamName(name);
    setStartTime(new Date()); 
    playSfx('start');
    setView(AppView.HOME);
  };

  const handleContinue = () => { playSfx('start'); setView(AppView.HOME); };

  const handlePuzzleSelect = async (puzzle: Puzzle) => {
    try {
        if (navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
        }
    } catch (e) { console.warn(e); }
    setActivePuzzle(puzzle);
    setView(AppView.EDITOR);
    setShowSideMissions(false);
  };

  const handleFieldSolved = () => {
      if (activePuzzle?.type === 'side') return;
      if (activePuzzle && completedPuzzleIds.includes(activePuzzle.id)) return;
      playSfx('success');
      setPlayerStats(prev => {
          const newXp = prev.currentXp + 100;
          const newLevel = Math.floor(newXp / 500) + 1; 
          return { ...prev, currentXp: newXp, level: newLevel, rank: "地形線索搜查員" };
      });
  };

  const handleEditorBack = (progress: PuzzleProgress) => {
    if (activePuzzle) {
        setPuzzleProgress(prev => ({ ...prev, [activePuzzle.id]: progress }));
    }
    setView(AppView.HOME);
    setActivePuzzle(null);
  };
  
  // New: Handle story completion to record it
  const handleStoryComplete = () => {
      if (activePuzzle) {
          setPuzzleProgress(prev => ({
              ...prev,
              [activePuzzle.id]: {
                  ...prev[activePuzzle.id],
                  hasSeenOpeningStory: true
              }
          }));
      }
  };

  const handleImageComplete = (progressData?: PuzzleProgress, stayOnScreen: boolean = false) => {
    if (activePuzzle) {
        const puzzleId = activePuzzle.id;
        const fragmentId = activePuzzle.fragmentId;
        const puzzleType = activePuzzle.type;

        if (progressData) {
            setPuzzleProgress(prev => ({ ...prev, [puzzleId]: progressData }));
        }

        if (!completedPuzzleIds.includes(puzzleId) && puzzleType !== 'side') {
            const newCompletedIds = [...completedPuzzleIds, puzzleId];
            setCompletedPuzzleIds(newCompletedIds);
            
            if (fragmentId !== -1) {
                setCollectedFragments(prev => Array.from(new Set([...prev, fragmentId])));
            }
            
            if (newCompletedIds.length === 3) {
                setEndTime(new Date());
            }
        }
        
        if (!stayOnScreen) {
            setActivePuzzle(null);
            setView(AppView.HOME);
        }
    }
  };

  const xpPercentage = Math.min(((playerStats.currentXp % playerStats.nextLevelXp) / playerStats.nextLevelXp) * 100, 100);

  return (
    <div className="h-[100dvh] w-screen bg-slate-50 text-slate-900 overflow-hidden flex flex-col font-sans relative">
      {view === AppView.INTRO && (
        <IntroScreen onStart={handleIntroStart} onContinue={handleContinue} hasSaveData={!!initialSaveData} />
      )}

      {view === AppView.HOME && (
        <>
            <div className="absolute top-0 left-0 right-0 z-[500] p-2 sm:p-4 pointer-events-none">
                <div className="flex justify-between items-start gap-2 max-w-full">
                    <button 
                        onClick={() => setShowProfile(true)}
                        className="bg-white/90 backdrop-blur border border-slate-200 p-2 sm:p-3 rounded-lg pointer-events-auto shadow-lg text-left hover:scale-105 active:scale-95 transition-transform flex-[0_1_auto] max-w-[42%] min-w-0"
                    >
                        <div className="flex items-center gap-1.5 sm:gap-3 mb-1 min-w-0">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-teal-50 rounded-full flex items-center justify-center border border-teal-200 shrink-0">
                                <User className="w-4 h-4 sm:w-6 sm:h-6 text-teal-600" />
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="text-[9px] text-slate-500 font-mono truncate uppercase">{playerStats.rank}</div>
                                <div className="font-bold font-mono text-teal-700 truncate text-xs sm:text-base leading-none">{teamName}</div>
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200/50 rounded-full overflow-hidden mt-1 sm:mt-2">
                            <div className="h-full bg-teal-500 transition-all duration-500 ease-out" style={{ width: `${xpPercentage}%` }}></div>
                        </div>
                    </button>

                    <div className="flex flex-col items-end gap-1.5 flex-[1_1_auto] max-w-[58%] min-w-0 pointer-events-auto">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                            <button onClick={() => setGpsRetryTrigger(p => p + 1)} className={`backdrop-blur border px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all ${gpsStatus === 'locked' ? 'bg-teal-50/90 border-teal-200' : gpsStatus === 'error' ? 'bg-rose-50/90 border-rose-200' : 'bg-amber-50/90 border-amber-200'}`}>
                                <Satellite className={`w-3 h-3 ${gpsStatus === 'locked' ? 'text-teal-600' : 'text-amber-600 animate-pulse'}`} />
                                <span className="text-[10px] font-mono font-bold whitespace-nowrap text-slate-700">{gpsStatus === 'locked' && gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : 'GPS'}</span>
                            </button>
                            <WeatherWidget />
                            <div className="backdrop-blur bg-white/90 border border-slate-200 px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="text-[10px] font-mono text-slate-600">{currentTime.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit', hour12: false})}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setShowSettings(true)} className="p-2 bg-white border border-slate-300 text-slate-500 rounded-full hover:bg-slate-50 shadow-sm"><Settings className="w-4 h-4" /></button>
                             <button onClick={() => setShowManual(true)} className="p-2 bg-white border border-slate-300 text-slate-500 rounded-full hover:bg-slate-50 shadow-sm"><Info className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>

            <GameMap 
                key="yongchun-main-map"
                puzzles={SAMPLE_PUZZLES} 
                onPuzzleSelect={handlePuzzleSelect}
                fogEnabled={isFogEnabled && isFogTimeReached} 
                fogOpacity={fogOpacity} 
                onGpsStatusChange={(s, a) => { setGpsStatus(s); if (a) setGpsAccuracy(a); }}
                completedPuzzleIds={completedPuzzleIds}
                gpsRetryTrigger={gpsRetryTrigger}
            />

            <div className="absolute bottom-6 left-6 z-[500] flex flex-col gap-3 pointer-events-auto">
                 <button onClick={() => setShowEncyclopedia(true)} className="bg-white/90 border border-teal-200 p-3 rounded-lg shadow-lg"><Book className="w-6 h-6 text-teal-600" /></button>
                 <button onClick={() => setShowSideMissions(true)} className="bg-white/90 border border-indigo-200 p-3 rounded-lg shadow-lg"><ClipboardList className="w-6 h-6 text-indigo-600" /></button>
                 <button onClick={() => setShowTreasureMap(true)} className="bg-white/90 border border-amber-200 p-3 rounded-lg shadow-lg relative">
                    <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{collectedFragments.length}/3</div>
                    <BookOpen className="w-6 h-6 text-amber-500" />
                 </button>
            </div>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} isSfxEnabled={isSfxEnabledState} onToggleSfx={setIsSfxEnabledState} isFogEnabled={isFogEnabled} onToggleFog={() => setIsFogEnabled(!isFogEnabled)} isFogTimeReached={isFogTimeReached} onResetGame={() => localStorage.removeItem(STORAGE_KEY)} />}
            {showProfile && <PlayerProfileModal onClose={() => setShowProfile(false)} playerStats={playerStats} teamName={teamName} missionDuration={missionDuration} startTime={startTime} endTime={endTime} collectedFragments={collectedFragments} completedPuzzleCount={completedPuzzleIds.length} />}
            {showEncyclopedia && <EncyclopediaModal onClose={() => setShowEncyclopedia(false)} completedPuzzleIds={completedPuzzleIds} />}
            {showManual && <ManualModal onClose={() => setShowManual(false)} />}
            {showTreasureMap && <TreasureMapModal onClose={() => setShowTreasureMap(false)} collectedFragments={collectedFragments} />}
            {showSideMissions && (
                <div className="absolute inset-0 z-[1000] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold font-mono text-indigo-700">支線任務</h2>
                            <button onClick={() => setShowSideMissions(false)}><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-4 overflow-y-auto bg-slate-50 space-y-4">
                            {SIDE_MISSIONS.map(m => (
                                <div key={m.id} className="bg-white border p-4 rounded-lg">
                                    <h3 className="font-bold mb-1">{m.title}</h3>
                                    <p className="text-xs text-slate-500 mb-4">{m.description}</p>
                                    <button onClick={() => handlePuzzleSelect(m)} className="w-full bg-indigo-600 text-white py-2 rounded text-xs font-bold">START MISSION</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
      )}

      {view === AppView.EDITOR && activePuzzle && (
        <ImageEditor 
            activePuzzle={activePuzzle} 
            onBack={handleEditorBack} 
            onComplete={handleImageComplete}
            onSideMissionProgress={(s) => setPuzzleProgress(p => ({ ...p, [activePuzzle.id]: { ...p[activePuzzle.id], sideMissionSubmissions: [s, ...(p[activePuzzle.id]?.sideMissionSubmissions || [])] } }))}
            onFieldSolved={handleFieldSolved}
            initialState={puzzleProgress[activePuzzle.id]}
            isCompleted={completedPuzzleIds.includes(activePuzzle.id)}
            onStoryComplete={handleStoryComplete}
        />
      )}
    </div>
  );
};

export default App;
