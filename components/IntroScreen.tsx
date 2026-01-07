
import React, { useState } from 'react';
import { Scroll, Users, ArrowRight, Terminal, Map, ShieldCheck, ExternalLink, Image as ImageIcon, RotateCcw, Play } from 'lucide-react';
// FIX: Use relative path
import { playSfx } from '../services/audioService';

interface IntroScreenProps {
  onStart: (teamName: string) => void;
  onContinue: () => void;
  hasSaveData: boolean;
}

export const IntroScreen: React.FC<IntroScreenProps> = ({ onStart, onContinue, hasSaveData }) => {
  const [teamName, setTeamName] = useState('');
  const [step, setStep] = useState<1 | 2>(1); // 1: Story/Menu, 2: Login (New Game)

  // Google Drive Direct Link
  const BG_IMAGE_URL = "https://drive.google.com/uc?export=view&id=1-UVds4tg7gQxZo19uTgqyvfTwmEwI3c8";

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50 text-slate-800 relative overflow-hidden fixed inset-0 h-[100dvh]">
      
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0 opacity-40 blur-sm scale-105 transition-all duration-[20s] hover:scale-110"
        style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
      ></div>

      {/* Overlay Layer for Readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-slate-50/90 to-slate-50/80 z-0"></div>

      {/* Tech Grid Effect - Light Mode */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,148,136,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(13,148,136,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-2xl mx-auto h-full min-h-0">
        
        {/* Header Logo */}
        <div className="mb-4 text-center shrink-0">
            <div className="w-16 h-16 mx-auto bg-white border-2 border-teal-500 rounded-full flex items-center justify-center mb-2 shadow-[0_0_20px_rgba(20,184,166,0.2)] animate-pulse relative z-10">
                <Map className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-1 tracking-tight drop-shadow-sm">
                永春陂地質調查
            </h1>
            <div className="text-xs font-mono text-teal-600 uppercase tracking-[0.3em] font-bold">Geological Survey</div>
        </div>

        {step === 1 ? (
          <div className="w-full flex-1 min-h-0 flex flex-col justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-xl relative shadow-xl flex flex-col max-h-[65vh]">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-teal-500 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-teal-500 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-teal-500 pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-teal-500 pointer-events-none"></div>

                {/* Card Header - Fixed */}
                <div className="flex-none p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Scroll className="w-5 h-5 text-teal-600" />
                        <h2 className="text-lg font-bold text-teal-700">任務簡報</h2>
                    </div>

                    {/* Photo Button in Title Bar */}
                    <a 
                        href={BG_IMAGE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-600 text-slate-500 px-3 py-1.5 rounded-lg transition-all shadow-sm group"
                        title="檢視老照片"
                    >
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-xs font-mono font-bold">PHOTO</span>
                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </a>
                </div>

                {/* Card Body - Scrollable Text */}
                <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-4 text-slate-600 font-sans leading-relaxed text-base text-justify scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                    <p>
                        村長在整理古老村史時，意外翻到一張泛黃的永春陂老照片(請點擊右上角)。照片裡的山形、地貌、濕地樣貌都與現在不太相同，但卻看起來非常重要。
                    </p>
                    <p>
                        為了破解照片中的線索，村長召集了全村最聰明、最勇敢的 <strong className="text-teal-600">小小地質學家</strong> 前往實地調查。
                    </p>
                    <p>
                        同時，村長也請來村裡的智者（王老師）隨行協助，途中若遇到難題，智者會提供方向，但真正的謎題還是要靠你們解開——因為只有小小地質學家最會觀察大地、閱讀地形、解讀岩石。
                    </p>
                    <div className="bg-teal-50 p-4 border-l-2 border-teal-500 mt-2 rounded-r">
                        <p className="font-bold text-teal-700 mb-1">⚡ 你們的任務</p>
                        <p className="text-sm text-slate-600">走訪永春陂周邊的地形、地層與稜線，找回老照片中的秘密，拼出永春陂的地貌密碼！</p>
                    </div>
                </div>

                {/* Card Footer - Fixed Button */}
                <div className="flex-none p-6 pt-4 bg-white/50 border-t border-slate-100 rounded-b-xl flex flex-col gap-3">
                    {hasSaveData ? (
                        <>
                            <button 
                                onClick={() => {
                                    playSfx('start');
                                    onContinue();
                                }}
                                className="w-full bg-amber-500 hover:bg-amber-400 text-white py-3 rounded-lg font-mono font-bold text-lg transition-all shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-3 border-2 border-amber-400"
                            >
                                <Play className="w-6 h-6 fill-current" />
                                <span>CONTINUE MISSION</span>
                            </button>
                            <button 
                                onClick={() => {
                                    playSfx('click');
                                    setStep(2);
                                }}
                                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-600 py-3 rounded-lg font-mono font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-5 h-5" />
                                <span>NEW GAME</span>
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={() => {
                                playSfx('click');
                                setStep(2);
                            }}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white hover:shadow-teal-500/20 py-3 rounded-lg font-mono font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2 group"
                        >
                            <span>ACCEPT MISSION</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md animate-in zoom-in-95 duration-300 shrink-0">
             {/* ... Login Form ... */}
             <div className="bg-white border border-slate-200 p-8 rounded-xl shadow-xl">
                <div className="text-center mb-6">
                    <ShieldCheck className="w-12 h-12 text-teal-600 mx-auto mb-2" />
                    <h2 className="text-xl font-mono font-bold text-slate-800">IDENTITY VERIFICATION</h2>
                    <p className="text-xs text-slate-400 font-mono mt-1">ESTABLISHING NEW SECURE CHANNEL</p>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-mono text-teal-600 uppercase block">Enter Team Designation</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <input 
                                type="text" 
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="TEAM NAME..."
                                className="w-full bg-slate-50 border border-slate-300 text-slate-800 px-10 py-3 font-mono rounded-lg focus:border-teal-500 focus:outline-none transition-colors uppercase placeholder-slate-400 focus:ring-1 focus:ring-teal-200"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && teamName.trim()) {
                                        playSfx('start');
                                        onStart(teamName);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {hasSaveData && (
                         <div className="text-[10px] text-rose-500 font-mono text-center bg-rose-50 p-2 rounded border border-rose-100">
                            WARNING: Starting a new game will overwrite your previous save.
                         </div>
                    )}

                    <button 
                        onClick={() => {
                            if (teamName.trim()) {
                                playSfx('start');
                                onStart(teamName);
                            }
                        }}
                        disabled={!teamName.trim()}
                        className="w-full bg-teal-600 disabled:bg-slate-200 disabled:text-slate-400 hover:bg-teal-500 text-white py-3 rounded-lg font-mono font-bold transition-all flex items-center justify-center gap-2 mt-4 shadow-md"
                    >
                        <Terminal className="w-4 h-4" />
                        INITIALIZE SYSTEM
                    </button>
                    
                    <button 
                        onClick={() => {
                            playSfx('click');
                            setStep(1);
                        }}
                        className="w-full text-slate-400 hover:text-slate-600 text-xs font-mono py-2"
                    >
                        &lt; BACK
                    </button>
                </div>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center mt-4 text-[10px] font-mono text-slate-400 shrink-0 relative z-20">
            SYSTEM VERSION 25.12.3 // COPYRIGHT © isky
        </div>

      </div>
    </div>
  );
};
