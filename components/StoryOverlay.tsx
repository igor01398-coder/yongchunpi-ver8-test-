
import React, { useState, useEffect } from 'react';
import { ChevronRight, User, BookOpen, SkipForward } from 'lucide-react';
import { StoryScript } from '../types';
import { playSfx } from '../services/audioService';
import { ASSETS } from '../services/assetService';

// 預設頭像設定 (Default Avatar Mapping)
const DEFAULT_AVATARS: Record<string, string> = {
  '王老師': ASSETS.CHARACTERS.TEACHER,
  '村長': ASSETS.CHARACTERS.CHIEF,
  'Me': ASSETS.CHARACTERS.PLAYER
};

// 設定哪些角色使用「立繪模式」 (顯示在對話框上方的大圖)
const PORTRAIT_CHARACTERS = ['村長', '王老師'];

interface StoryOverlayProps {
  script: StoryScript[];
  onComplete: () => void;
}

export const StoryOverlay: React.FC<StoryOverlayProps> = ({ script, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const currentLine = script[currentIndex];

  useEffect(() => {
    if (!currentLine) return;
    
    setDisplayedText('');
    setIsTyping(true);
    let charIndex = 0;
    const fullText = currentLine.text;

    const interval = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(prev => prev + fullText[charIndex]);
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 30); // Typing speed

    return () => clearInterval(interval);
  }, [currentIndex, currentLine]);

  const handleNext = () => {
    if (isTyping) {
      // If typing, finish immediately
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      playSfx('click');
      if (currentIndex < script.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete();
      }
    }
  };

  if (!currentLine) return null;

  // Determine which image to show:
  const portraitUrl = currentLine.portraitUrl || DEFAULT_AVATARS[currentLine.speaker];
  
  // 判斷是否為重要角色 (使用大立繪模式)
  const isPortraitMode = PORTRAIT_CHARACTERS.includes(currentLine.speaker);

  return (
    <div 
      className="absolute inset-0 z-[1500] bg-black/60 backdrop-blur-sm flex flex-col justify-end pb-8 sm:pb-12"
      onClick={handleNext}
    >
      <div className="w-full max-w-2xl mx-auto px-4 relative">
        
        {/* Character Name Tag */}
        <div className="flex items-end mb-[-2px] relative z-10 pl-4">
           <div className={`
             px-6 py-2 rounded-t-lg font-bold font-mono text-sm border-t-2 border-x-2 border-white/20
             ${currentLine.speaker === '王老師' ? 'bg-amber-600 text-white' : 
               currentLine.speaker === '村長' ? 'bg-indigo-600 text-white' : 
               'bg-slate-700 text-slate-200'}
           `}>
             {currentLine.speaker}
           </div>
        </div>

        {/* Dialogue Box */}
        <div className="bg-slate-900/95 border-2 border-white/20 rounded-lg p-6 min-h-[140px] relative shadow-2xl animate-in slide-in-from-bottom-2">
            
            {/* Avatar / Portrait Logic */}
            <div className={`
                absolute flex items-center justify-center overflow-hidden shrink-0 transition-all duration-300 z-20
                ${isPortraitMode 
                    // 立繪模式：大圖，位於對話框上方，方形圓角
                    ? '-top-32 right-2 w-32 h-32 sm:w-40 sm:h-40 rounded-xl border-4 border-white/30 shadow-2xl backdrop-blur-sm origin-bottom transform hover:scale-105' 
                    // 一般模式：小圓形，位於右上角
                    : '-top-12 right-4 w-20 h-20 rounded-full border-4 border-slate-900 bg-white shadow-lg'
                }
                ${currentLine.speaker === '村長' ? 'bg-indigo-900/80' : 
                  currentLine.speaker === '王老師' ? 'bg-amber-900/80' : 'bg-white'}
            `}>
                {portraitUrl ? (
                    <img 
                        src={portraitUrl} 
                        alt={currentLine.speaker} 
                        // 村長 (Pixel Art): 像素化渲染，並做適當縮放以顯示上半身
                        className={`w-full h-full object-cover ${currentLine.speaker === '村長' ? 'object-top scale-125 translate-y-2' : ''}`}
                        style={currentLine.speaker === '村長' ? { imageRendering: 'pixelated' } : {}}
                    />
                ) : (
                    // Fallback Icons
                    currentLine.speaker === '王老師' ? (
                        <BookOpen className="w-10 h-10 text-amber-600" />
                    ) : currentLine.speaker === '村長' ? (
                        <User className="w-16 h-16 text-indigo-200" />
                    ) : (
                        <User className="w-10 h-10 text-slate-400" />
                    )
                )}
            </div>

            <p className="text-lg text-slate-100 font-sans leading-relaxed tracking-wide pr-4 sm:pr-16 relative z-10">
              {displayedText}
              {!isTyping && (
                <span className="inline-block w-2 h-5 bg-teal-400 ml-1 animate-pulse align-middle"></span>
              )}
            </p>

            {/* Tap to continue indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs font-mono text-slate-400 animate-bounce z-10">
                {isTyping ? 'CLICK TO SKIP' : 'TAP TO CONTINUE'} 
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
        
        {/* Skip All Button */}
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onComplete();
            }}
            className="absolute top-4 right-4 text-white/50 hover:text-white flex items-center gap-1 text-xs font-mono bg-black/20 px-3 py-1 rounded-full z-0"
        >
            <SkipForward className="w-3 h-3" /> SKIP STORY
        </button>
      </div>
    </div>
  );
};
