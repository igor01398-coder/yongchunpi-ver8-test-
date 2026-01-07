
import React from 'react';
import { X, User, Trophy, Activity, Timer, Hash, Clock, ShieldCheck } from 'lucide-react';
import { PlayerStats } from '../types';

interface PlayerProfileModalProps {
  onClose: () => void;
  playerStats: PlayerStats;
  teamName: string;
  missionDuration: string;
  startTime: Date | null;
  endTime: Date | null;
  collectedFragments: number[];
  completedPuzzleCount: number;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  onClose,
  playerStats,
  teamName,
  missionDuration,
  startTime,
  endTime,
  collectedFragments,
  completedPuzzleCount
}) => {
  return (
    <div className="absolute inset-0 z-[1300] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl relative">
        
        {/* Header Background */}
        <div className="h-24 bg-gradient-to-r from-teal-600 to-emerald-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[size:20px_20px] opacity-30"></div>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-1 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        {/* Profile Content */}
        <div className="px-6 pb-8 -mt-12 relative">
            
            {/* Avatar & Name */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg mb-3">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center border-2 border-teal-100">
                        <User className="w-12 h-12 text-teal-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold font-mono text-slate-800 uppercase tracking-wider">{teamName}</h2>
                <div className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold font-mono rounded-full border border-teal-200 mt-1">
                    {playerStats.rank}
                </div>
            </div>

            {/* Timer Section (Prominent) */}
            <div className={`mb-6 p-4 rounded-lg border flex flex-col items-center justify-center relative overflow-hidden ${endTime ? 'bg-amber-50 border-amber-200' : 'bg-slate-800 border-slate-700'}`}>
                {endTime && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] px-2 py-0.5 font-bold font-mono rounded-bl">MISSION COMPLETE</div>}
                
                <div className="flex items-center gap-2 mb-1 opacity-80">
                    <Timer className={`w-4 h-4 ${endTime ? 'text-amber-600' : 'text-teal-400'}`} />
                    <span className={`text-xs font-mono uppercase tracking-widest ${endTime ? 'text-amber-700' : 'text-slate-300'}`}>
                        Mission Timer
                    </span>
                </div>
                <div className={`text-4xl font-mono font-bold tracking-widest ${endTime ? 'text-amber-600' : 'text-white'}`}>
                    {missionDuration}
                </div>
                {startTime && (
                    <div className="flex gap-4 mt-2 text-[10px] font-mono opacity-60">
                        <span className={endTime ? 'text-amber-800' : 'text-slate-300'}>START: {startTime.toLocaleTimeString()}</span>
                        {endTime && <span className="text-amber-800">END: {endTime.toLocaleTimeString()}</span>}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col items-center">
                    <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Level
                    </div>
                    <div className="text-xl font-bold text-slate-700">{playerStats.level}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col items-center">
                     <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3" /> Fragments
                    </div>
                    <div className="text-xl font-bold text-slate-700">{collectedFragments.length} / 3</div>
                </div>
                 <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col items-center">
                     <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Missions
                    </div>
                    <div className="text-xl font-bold text-slate-700">{completedPuzzleCount}</div>
                </div>
                 <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg flex flex-col items-center">
                     <div className="text-xs text-slate-400 font-mono uppercase mb-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Total XP
                    </div>
                    <div className="text-xl font-bold text-slate-700">{playerStats.currentXp}</div>
                </div>
            </div>

            {/* Detailed XP Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-slate-500">
                    <span>PROGRESS TO NEXT LEVEL</span>
                    <span>{playerStats.currentXp % 500} / 500 XP</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000" 
                        style={{ width: `${(playerStats.currentXp % 500) / 500 * 100}%` }}
                    ></div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
