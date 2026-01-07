
import React, { useState, useEffect } from 'react';
import { ChevronRight, User, BookOpen, SkipForward } from 'lucide-react';
import { StoryScript } from '../types';
import { playSfx } from '../services/audioService';

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

  return (
    <div 
      className="absolute inset-0 z-[1500] bg-black/60 backdrop-blur-sm flex flex-col justify-end pb-8 sm:pb-12"
      onClick={handleNext}
    >
      <div className="w-full max-w-2xl mx-auto px-4">
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
            
            {/* Avatar / Icon Placeholder (Optional) */}
            <div className="absolute -top-12 right-4 w-16 h-16 bg-white border-4 border-slate-900 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                {currentLine.speaker === '王老師' ? (
                    <BookOpen className="w-8 h-8 text-amber-600" />
                ) : currentLine.speaker === '村長' ? (
                    <User className="w-8 h-8 text-indigo-600" />
                ) : (
                    <User className="w-8 h-8 text-slate-400" />
                )}
            </div>

            <p className="text-lg text-slate-100 font-sans leading-relaxed tracking-wide">
              {displayedText}
              {!isTyping && (
                <span className="inline-block w-2 h-5 bg-teal-400 ml-1 animate-pulse align-middle"></span>
              )}
            </p>

            {/* Tap to continue indicator */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-xs font-mono text-slate-400 animate-bounce">
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
            className="absolute top-4 right-4 text-white/50 hover:text-white flex items-center gap-1 text-xs font-mono bg-black/20 px-3 py-1 rounded-full"
        >
            <SkipForward className="w-3 h-3" /> SKIP STORY
        </button>
      </div>
    </div>
  );
};
