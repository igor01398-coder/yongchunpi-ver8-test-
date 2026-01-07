
import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudLightning, CloudFog, CloudSun, Loader2 } from 'lucide-react';

export const WeatherWidget: React.FC = () => {
  const [temp, setTemp] = useState<number | null>(null);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchWeather = async () => {
    try {
      const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=25.03&longitude=121.58&current=temperature_2m,weather_code&timezone=auto`);
      const data = await response.json();
      setTemp(data.current.temperature_2m);
      setWeatherCode(data.current.weather_code);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-3 h-3 text-amber-500" />;
    if (code >= 1 && code <= 3) return <CloudSun className="w-3 h-3 text-slate-500" />;
    if (code === 45 || code === 48) return <CloudFog className="w-3 h-3 text-slate-400" />;
    if (code >= 51 && code <= 82) return <CloudRain className="w-3 h-3 text-blue-400" />;
    if (code >= 95) return <CloudLightning className="w-3 h-3 text-purple-500" />;
    return <Cloud className="w-3 h-3 text-slate-500" />;
  };

  return (
    <div className="backdrop-blur bg-white/90 border border-slate-200 px-1.5 sm:px-3 py-0.5 rounded-full shadow-sm flex items-center gap-1">
      {loading ? (
        <Loader2 className="w-2.5 h-2.5 text-slate-400 animate-spin" />
      ) : (
        <>
          {weatherCode !== null && getWeatherIcon(weatherCode)}
          <span className="text-[10px] font-mono text-slate-600 font-bold whitespace-nowrap">
             {temp !== null ? `${Math.round(temp)}°C` : '--'}
          </span>
        </>
      )}
    </div>
  );
};
