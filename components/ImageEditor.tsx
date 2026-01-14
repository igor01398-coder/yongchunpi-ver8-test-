
import React, { useState, useRef, useEffect } from 'react';
import { editImageWithGemini, fileToGenerativePart, validateImage } from '../services/geminiService';
import { playSfx } from '../services/audioService';
import { ASSETS } from '../services/assetService';
import { Loader2, ArrowLeft, Upload, Camera, RefreshCw, Terminal, ChevronRight, CheckCircle, HelpCircle, AlertTriangle, ClipboardList, PartyPopper, Image as ImageIcon, ShieldCheck, Check, X, FolderOpen, ExternalLink, ScanSearch, Lightbulb, Map, History, User } from 'lucide-react';
import { Puzzle, PuzzleProgress, SideMissionSubmission } from '../types';
import { StoryOverlay } from './StoryOverlay';

interface ImageEditorProps {
  activePuzzle: Puzzle | null;
  onBack: (progress: PuzzleProgress) => void;
  onComplete?: (data?: PuzzleProgress, stayOnScreen?: boolean) => void;
  onSideMissionProgress?: (submission: SideMissionSubmission) => void;
  onFieldSolved?: () => void;
  onStoryComplete?: () => void; // New callback
  initialState?: PuzzleProgress;
  isCompleted?: boolean;
  teamName?: string;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ activePuzzle, onBack, onComplete, onSideMissionProgress, onFieldSolved, onStoryComplete, initialState, isCompleted, teamName }) => {
  const [originalImage, setOriginalImage] = useState<string | null>(null); // Base64
  const [resultImage, setResultImage] = useState<string | null>(null); // Base64
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; feedback: string } | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Side Mission State
  const [submissionHistory, setSubmissionHistory] = useState<SideMissionSubmission[]>([]);

  // Quiz State
  const [quizInput, setQuizInput] = useState<string>('');
  const [quizSelect1, setQuizSelect1] = useState<string>('');
  const [quizSelect2, setQuizSelect2] = useState<string>('');
  const [quizSelect3, setQuizSelect3] = useState<string>(''); // New Slope Dropdown
  
  // Mission 1 State (Four Beasts)
  const [m1Heights, setM1Heights] = useState({ tiger: '', leopard: '', lion: '', elephant: '' });
  const [m1Reason, setM1Reason] = useState<string>('');
  const [m1Part1Solved, setM1Part1Solved] = useState(false);
  const [m1Part2Solved, setM1Part2Solved] = useState(false);
  const [m1Part1Error, setM1Part1Error] = useState(false);
  const [m1Part2Error, setM1Part2Error] = useState(false);

  // Mission 2 State (Texture Matching & Formation)
  const [m2Formation, setM2Formation] = useState<string>('');
  const [m2Texture, setM2Texture] = useState({ sandstone: '', shale: '' });

  const [isQuizSolved, setIsQuizSolved] = useState<boolean>(false);
  const [showQuizError, setShowQuizError] = useState<boolean>(false);
  
  // Failure Tracking
  const [failureCount, setFailureCount] = useState<number>(0);
  
  // Reference Image State
  const [showReferenceImage, setShowReferenceImage] = useState<boolean>(false);
  
  // Check Image (Gallery) State
  const [showCheckGallery, setShowCheckGallery] = useState<boolean>(false);
  
  // Story State
  const [showOpeningStory, setShowOpeningStory] = useState(false);
  const [showSolutionStory, setShowSolutionStory] = useState(false);
  const [showPostStory, setShowPostStory] = useState(false);
  
  // Mission 1 Interlude State
  const [showM1Interlude, setShowM1Interlude] = useState(false);
  const [m1InterludeError, setM1InterludeError] = useState(false);

  // Mission 2 Interlude State
  const [showM2Interlude, setShowM2Interlude] = useState(false);
  const [m2InterludeError, setM2InterludeError] = useState(false);

  // Mission 3 Interlude State
  const [showM3Interlude, setShowM3Interlude] = useState(false);
  const [m3InterludeError, setM3InterludeError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unified flag for missions that are "Upload & Verify" only (Single column, no AI generation)
  // Mission 3 (Contour Drawing) and Side Missions fall into this category.
  const isUploadOnly = activePuzzle?.id === '3' || activePuzzle?.type === 'side';

  // Initialize
  useEffect(() => {
    if (activePuzzle) {
        // Story Logic: If puzzle has a story AND it hasn't been seen yet, show it.
        // Also don't show opening story if we are already in completed state upon load
        if (activePuzzle.openingStory && activePuzzle.openingStory.length > 0 && !isCompleted) {
            if (!initialState?.hasSeenOpeningStory) {
                setShowOpeningStory(true);
            }
        }

        // For Mission 3 and Side Missions, the input is for remarks, so don't pre-fill the AI prompt hint
        if (activePuzzle.id === '3' || activePuzzle.type === 'side') {
            setPrompt('');
        } else {
            setPrompt(activePuzzle.targetPromptHint);
        }
        
        // Load Initial State if Available
        if (initialState) {
            if (initialState.m1Heights) setM1Heights(initialState.m1Heights);
            if (initialState.m1Reason) setM1Reason(initialState.m1Reason);
            if (initialState.quizInput) setQuizInput(initialState.quizInput);
            if (initialState.quizSelect1) setQuizSelect1(initialState.quizSelect1);
            if (initialState.quizSelect2) setQuizSelect2(initialState.quizSelect2);
            if (initialState.quizSelect3) setQuizSelect3(initialState.quizSelect3);
            if (initialState.m2Texture) setM2Texture(initialState.m2Texture);
            if (initialState.m2Formation) setM2Formation(initialState.m2Formation);
            
            // Restore prompt/description
            if (initialState.imageDescription) setPrompt(initialState.imageDescription);
            // Restore image
            if (initialState.uploadedImage) setOriginalImage(initialState.uploadedImage);
            // Restore Side Mission History
            if (initialState.sideMissionSubmissions) setSubmissionHistory(initialState.sideMissionSubmissions);
            // Restore Failure Count
            if (initialState.failureCount !== undefined) setFailureCount(initialState.failureCount);
            
            // Restore Solved States
            if (initialState.m1Part1Solved) setM1Part1Solved(true);
            if (initialState.m1Part2Solved) setM1Part2Solved(true);
            if (initialState.isQuizSolved) setIsQuizSolved(true);
        }

        // If Completed, force solved states
        if (isCompleted) {
             setIsQuizSolved(true);
             setM1Part1Solved(true);
             setM1Part2Solved(true);
             return; 
        }

        // Reset Quiz state when puzzle changes if NOT completed and NO initial state
        if (!initialState && activePuzzle.quiz) {
            setIsQuizSolved(false);
            setQuizInput('');
            // Default values for dropdowns
            setQuizSelect1('');
            setQuizSelect2('');
            setQuizSelect3('');
            setM2Texture({ sandstone: '', shale: '' });
            setM2Formation('');
            // Reset Mission 1
            setM1Heights({ tiger: '', leopard: '', lion: '', elephant: '' });
            setM1Reason('');
            setM1Part1Solved(false);
            setM1Part2Solved(false);
            setM1Part1Error(false);
            setM1Part2Error(false);
            // Reset failure count
            setFailureCount(0);

            setShowQuizError(false);
        } else if (!activePuzzle.quiz) {
            // No quiz for this puzzle, auto-solve
            setIsQuizSolved(true);
            if (!initialState) setFailureCount(0);
        }
    } else {
        setPrompt('');
    }
  }, [activePuzzle, initialState, isCompleted]);

  // Handle Back Navigation with State Saving
  const handleBack = () => {
    const progress: PuzzleProgress = {
        m1Heights,
        m1Reason,
        m2Texture,
        m2Formation,
        quizInput,
        quizSelect1,
        quizSelect2,
        quizSelect3,
        imageDescription: prompt,
        uploadedImage: originalImage,
        // Save Solved Flags
        m1Part1Solved,
        m1Part2Solved,
        isQuizSolved,
        // Save history & stats
        sideMissionSubmissions: submissionHistory,
        failureCount,
        // Preserve story seen flag if it was in initial state, 
        // though handleStoryComplete() should have updated the parent already.
        hasSeenOpeningStory: initialState?.hasSeenOpeningStory || !showOpeningStory
    };
    onBack(progress);
  };

  const verifyM1Part1 = () => {
    const checkRange = (val: string, min: number, max: number) => {
        const num = parseInt(val.replace(/[^0-9]/g, ''));
        return !isNaN(num) && num >= min && num <= max;
    };
    // Ranges: Tiger: 135-145 (Aligned with map display 138), Leopard: 139-143, Lion: 147-153, Elephant: 180-188
    if (checkRange(m1Heights.tiger, 135, 145) && 
        checkRange(m1Heights.leopard, 139, 143) && 
        checkRange(m1Heights.lion, 147, 153) && 
        checkRange(m1Heights.elephant, 180, 188)) {
        
        setM1Part1Solved(true);
        setM1Part1Error(false);
        playSfx('success');
        if (onFieldSolved) onFieldSolved();
        
        // Check if both parts are now solved
        if (m1Part2Solved) {
            setIsQuizSolved(true);
        }
    } else {
        playSfx('error');
        setM1Part1Error(true);
        setFailureCount(prev => prev + 1);
    }
  };

  const verifyM1Part2 = () => {
    const r = m1Reason.trim();
    const hasHighConcept = r.includes('高') || r.includes('山');
    const hasLowConcept = r.includes('低') || r.includes('窪') || r.includes('水') || r.includes('凹');

    if (hasHighConcept && hasLowConcept) {
        setM1Part2Solved(true);
        setM1Part2Error(false);
        playSfx('success');
        if (onFieldSolved) onFieldSolved();
        
        // Check if both parts are now solved
        if (m1Part1Solved) {
            setIsQuizSolved(true);
        }
    } else {
        playSfx('error');
        setM1Part2Error(true);
        setFailureCount(prev => prev + 1);
    }
  };

  const handleQuizVerify = () => {
    if (!activePuzzle?.quiz) return;
    
    let isCorrect = false;

    if (activePuzzle.id === '2') {
         // Mission 2 Logic: 
         // 1. Formation = 大寮層 OR 石底層 (Modified: Fill in the blank)
         const formationInput = m2Formation.trim();
         const formationCorrect = formationInput.includes('大寮層') || formationInput.includes('石底層');
         
         // 2. Texture: Sandstone -> Rough, Shale -> Smooth
         const textureCorrect = m2Texture.sandstone === '較粗糙' && m2Texture.shale === '較細緻';
         
         if (formationCorrect && textureCorrect) {
             isCorrect = true;
         }
    } else if (activePuzzle.id === '3') {
         // Logic: 
         // A: Dense (密集) + Tired (累) + Very Steep (很陡)
         // B: Sparse (稀疏) + Not Tired (不累) + Gentle (平緩)
         if ((quizSelect1 === '密集' && quizSelect2 === '累' && quizSelect3 === '很陡') || 
             (quizSelect1 === '稀疏' && quizSelect2 === '不累' && quizSelect3 === '平緩')) {
             isCorrect = true;
         }
    } else {
        // Standard Text Logic for other missions
        const input = quizInput.trim();
        const target = activePuzzle.quiz.answer;
        
        isCorrect = input === target || input.includes(target);
    }
    
    if (isCorrect) {
        setIsQuizSolved(true);
        setShowQuizError(false);
        playSfx('success');
        if (onFieldSolved) onFieldSolved();
    } else {
        playSfx('error');
        setShowQuizError(true);
        setFailureCount(prev => prev + 1);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const base64 = await fileToGenerativePart(e.target.files[0]);
        setOriginalImage(base64);
        setResultImage(null);
        setValidationResult(null); // Reset validation
        setError(null);
      } catch (err) {
        setError("Failed to load image.");
      }
    }
  };

  const handleValidateAndGenerate = async () => {
    if (!originalImage || !activePuzzle) return;

    setValidationLoading(true);
    setLoading(true); // Start loading UI
    setError(null);
    setValidationResult(null);

    try {
        // 1. Validation Step (Pass reference images if available)
        const validation = await validateImage(
            originalImage, 
            activePuzzle.title, 
            activePuzzle.uploadInstruction || activePuzzle.description,
            activePuzzle.referenceCheckImages
        );
        
        setValidationResult(validation);
        setValidationLoading(false);

        if (!validation.isValid) {
            playSfx('error');
            setLoading(false); // Stop if invalid
            setFailureCount(prev => prev + 1);
            return;
        }

        playSfx('success');
        
        // Mission 2 & 3 & Side Logic: If valid, award XP immediately and STOP (no generation)
        if (isUploadOnly && validation.isValid) {
            if (onFieldSolved) onFieldSolved();
            return;
        }
        
        // 2. Generation/Editing Step (only if valid, and NOT UploadOnly)
        if (prompt && !isUploadOnly) {
             const resultBase64 = await editImageWithGemini(originalImage, prompt, aspectRatio, imageSize);
             setResultImage(resultBase64);
        }
        
    } catch (err: any) {
        console.error("Gemini API Error:", err);
        setError(err.message || "Protocol Failed. Re-calibrate sensors.");
        setValidationLoading(false);
    } finally {
        setLoading(false);
    }
  };

  const triggerFileInput = () => {
    if (isCompleted) return;
    fileInputRef.current?.click();
  };

  // Helper to actually finalize data saving (Used after all stories are told)
  const performFinalCompletion = () => {
     const progressData: PuzzleProgress = {
        m1Heights,
        m1Reason,
        m2Texture,
        m2Formation,
        quizInput,
        quizSelect1,
        quizSelect2,
        quizSelect3,
        imageDescription: prompt,
        uploadedImage: originalImage,
        m1Part1Solved,
        m1Part2Solved,
        isQuizSolved,
        sideMissionSubmissions: submissionHistory,
        failureCount,
        hasSeenOpeningStory: true 
    };
    
    // For Main Missions, complete with stayOnScreen=true to show the "Completed" state UI
    if (onComplete) onComplete(progressData, true);
  };

  // Triggered when user clicks "Transmit Data" or manual pass (via Auto-complete effect)
  const handlePreComplete = () => {
    if (activePuzzle?.type === 'side') {
        // Side Missions: Instant logic, no story chain
        if (!originalImage) return;

        // Create submission object
        const newSubmission: SideMissionSubmission = {
            image: originalImage,
            description: prompt || "No description",
            timestamp: Date.now()
        };

        // Update local history for display
        setSubmissionHistory(prev => [newSubmission, ...prev]);

        // Trigger parent callback to save state and award XP
        if (onSideMissionProgress) onSideMissionProgress(newSubmission);
        
        playSfx('success');

        // Check total count for celebration modal (optional logic, kept from before)
        if (submissionHistory.length + 1 >= 5 && !showSuccessModal) {
             setShowSuccessModal(true);
        }

        // RESET FIELDS FOR NEXT UPLOAD (Side Mission Specific)
        setOriginalImage(null);
        setResultImage(null);
        setValidationResult(null);
        setPrompt('');
        
    } else {
        // Main Mission Completion Logic
        playSfx('success');
        
        // Start Story Chain if available
        if (activePuzzle?.solutionStory && activePuzzle.solutionStory.length > 0) {
            setShowSolutionStory(true);
        } else if (activePuzzle?.postStory && activePuzzle.postStory.length > 0) {
             setShowPostStory(true);
        } else {
            // No stories, just finish
            performFinalCompletion();
        }
    }
  };
  
  // Handler for when Solution Story finishes
  const handleSolutionStoryEnd = () => {
      setShowSolutionStory(false);
      
      // *** MISSION 1 INTERACTIVE BRANCH ***
      if (activePuzzle?.id === '1') {
          setShowM1Interlude(true);
          return;
      }
      
      // *** MISSION 2 INTERACTIVE BRANCH ***
      // If this is Mission 2, trigger the interactive choice instead of going straight to PostStory
      if (activePuzzle?.id === '2') {
          setShowM2Interlude(true);
          return;
      }
      
      // *** MISSION 3 INTERACTIVE BRANCH ***
      if (activePuzzle?.id === '3') {
          setShowM3Interlude(true);
          return;
      }

      // Check for Post Story
      if (activePuzzle?.postStory && activePuzzle.postStory.length > 0) {
          setShowPostStory(true);
      } else {
          performFinalCompletion();
      }
  };
  
  // New: Handler for M1 Interlude Choice
  const handleM1InterludeChoice = (choice: string) => {
      if (choice === '窪地') {
          playSfx('success');
          setShowM1Interlude(false);
          // Proceed to Post Story
          setShowPostStory(true);
      } else {
          playSfx('error');
          setM1InterludeError(true);
          setTimeout(() => setM1InterludeError(false), 2000);
      }
  };

  // New: Handler for M2 Interlude Choice
  const handleM2InterludeChoice = (choice: string) => {
      if (choice === '差異侵蝕') {
          playSfx('success');
          setShowM2Interlude(false);
          // Proceed to Post Story
          setShowPostStory(true);
      } else {
          playSfx('error');
          setM2InterludeError(true);
          setTimeout(() => setM2InterludeError(false), 2000);
      }
  };

  // New: Handler for M3 Interlude Choice
  const handleM3InterludeChoice = (choice: string) => {
      if (choice === '稜線') {
          playSfx('success');
          setShowM3Interlude(false);
          // Proceed to Post Story
          setShowPostStory(true);
      } else {
          playSfx('error');
          setM3InterludeError(true);
          setTimeout(() => setM3InterludeError(false), 2000);
      }
  };
  
  // Handler for when Post Story finishes
  const handlePostStoryEnd = () => {
      setShowPostStory(false);
      performFinalCompletion();
  };

  // Auto-complete Effect for Main Missions (M2, M3)
  useEffect(() => {
    // Logic: If Main Mission (not side), Not yet completed, Quiz Solved, and Image Validated -> Auto Complete
    if (activePuzzle?.type !== 'side' && !isCompleted && isQuizSolved && validationResult?.isValid) {
        // Use a small timeout to allow UI to update (e.g. show validation success tick) before completing
        const timer = setTimeout(() => {
           // Important: Auto-complete also triggers the story chain via handlePreComplete
           handlePreComplete();
        }, 1000); // 1s delay to see the green checkmark/feedback
        return () => clearTimeout(timer);
    }
  }, [validationResult, isQuizSolved, isCompleted, activePuzzle]);

  // Triggered when user clicks "Yay" in modal (Still used for Side Mission Milestone or if triggered)
  const handleFinalExit = () => {
    if (onComplete) {
        const progressData: PuzzleProgress = {
            m1Heights: m1Heights,
            m1Reason: m1Reason,
            m2Texture: m2Texture,
            m2Formation: m2Formation,
            quizInput: quizInput,
            quizSelect1: quizSelect1,
            quizSelect2: quizSelect2,
            quizSelect3: quizSelect3,
            imageDescription: prompt,
            uploadedImage: originalImage,
            m1Part1Solved,
            m1Part2Solved,
            isQuizSolved,
            sideMissionSubmissions: submissionHistory,
            failureCount,
            hasSeenOpeningStory: true
        };
        onComplete(progressData, false);
    }
  };

  // Helper to detect if URL is likely a Drive Folder
  const isDriveFolder = activePuzzle?.referenceImage?.includes('drive.google.com/drive/folders');

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto bg-slate-50 relative">
      
      {/* 1. Opening Story Overlay */}
      {showOpeningStory && activePuzzle?.openingStory && (
          <StoryOverlay 
              script={activePuzzle.openingStory}
              onComplete={() => {
                  setShowOpeningStory(false);
                  if (onStoryComplete) onStoryComplete();
              }}
              teamName={teamName}
          />
      )}
      
      {/* 2. Solution Story Overlay */}
      {showSolutionStory && activePuzzle?.solutionStory && (
          <StoryOverlay 
              script={activePuzzle.solutionStory}
              onComplete={handleSolutionStoryEnd}
              teamName={teamName}
          />
      )}
      
      {/* 3. Mission 1 Interactive Interlude (New) */}
      {showM1Interlude && (
          <div className="absolute inset-0 z-[1600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="w-full max-w-sm animate-in zoom-in-95">
                   <div className="flex items-end mb-[-2px] relative z-10 pl-4">
                       <div className="px-6 py-2 rounded-t-lg font-bold font-mono text-sm border-t-2 border-x-2 border-white/20 bg-slate-700 text-slate-200">
                           {teamName || 'Me'}
                       </div>
                   </div>
                   <div className="bg-slate-900/95 border-2 border-white/20 rounded-lg p-6 relative shadow-2xl">
                        {/* Player Avatar */}
                        <div className="absolute -top-12 right-4 w-20 h-20 rounded-full border-4 border-slate-900 bg-white shadow-lg flex items-center justify-center overflow-hidden">
                             <img src={ASSETS.CHARACTERS.PLAYER} alt="Me" className="w-full h-full object-cover" />
                        </div>
                        
                        <p className="text-lg text-slate-100 font-sans leading-relaxed tracking-wide mb-6">
                            我知道！這個碗狀地形叫做...
                        </p>
                        
                        <div className="grid gap-3">
                             <button 
                                onClick={() => handleM1InterludeChoice('工地')}
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white py-3 rounded-lg font-bold transition-all active:scale-95"
                             >
                                工地
                             </button>
                             <button 
                                onClick={() => handleM1InterludeChoice('窪地')}
                                className="w-full bg-teal-600 hover:bg-teal-500 border border-teal-400 text-white py-3 rounded-lg font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                             >
                                窪地
                             </button>
                        </div>
                        
                        {m1InterludeError && (
                             <div className="mt-4 text-center text-rose-400 text-sm font-bold animate-pulse">
                                 看起來不像是在施工吧...？
                             </div>
                        )}
                   </div>
               </div>
          </div>
      )}
      
      {/* 4. Mission 2 Interactive Interlude (New) */}
      {showM2Interlude && (
          <div className="absolute inset-0 z-[1600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="w-full max-w-sm animate-in zoom-in-95">
                   <div className="flex items-end mb-[-2px] relative z-10 pl-4">
                       <div className="px-6 py-2 rounded-t-lg font-bold font-mono text-sm border-t-2 border-x-2 border-white/20 bg-slate-700 text-slate-200">
                           {teamName || 'Me'}
                       </div>
                   </div>
                   <div className="bg-slate-900/95 border-2 border-white/20 rounded-lg p-6 relative shadow-2xl">
                        {/* Player Avatar */}
                        <div className="absolute -top-12 right-4 w-20 h-20 rounded-full border-4 border-slate-900 bg-white shadow-lg flex items-center justify-center overflow-hidden">
                             <img src={ASSETS.CHARACTERS.PLAYER} alt="Me" className="w-full h-full object-cover" />
                        </div>
                        
                        <p className="text-lg text-slate-100 font-sans leading-relaxed tracking-wide mb-6">
                            我知道！這種軟硬岩層受侵蝕程度不同的現象，叫做...
                        </p>
                        
                        <div className="grid gap-3">
                             <button 
                                onClick={() => handleM2InterludeChoice('向下侵蝕')}
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white py-3 rounded-lg font-bold transition-all active:scale-95"
                             >
                                向下侵蝕
                             </button>
                             <button 
                                onClick={() => handleM2InterludeChoice('差異侵蝕')}
                                className="w-full bg-teal-600 hover:bg-teal-500 border border-teal-400 text-white py-3 rounded-lg font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                             >
                                差異侵蝕
                             </button>
                        </div>
                        
                        {m2InterludeError && (
                             <div className="mt-4 text-center text-rose-400 text-sm font-bold animate-pulse">
                                 再想想... 這是關於「不一樣」的侵蝕喔！
                             </div>
                        )}
                   </div>
               </div>
          </div>
      )}

      {/* 5. Mission 3 Interactive Interlude (New) */}
      {showM3Interlude && (
          <div className="absolute inset-0 z-[1600] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
               <div className="w-full max-w-sm animate-in zoom-in-95">
                   <div className="flex items-end mb-[-2px] relative z-10 pl-4">
                       <div className="px-6 py-2 rounded-t-lg font-bold font-mono text-sm border-t-2 border-x-2 border-white/20 bg-slate-700 text-slate-200">
                           {teamName || 'Me'}
                       </div>
                   </div>
                   <div className="bg-slate-900/95 border-2 border-white/20 rounded-lg p-6 relative shadow-2xl">
                        {/* Player Avatar */}
                        <div className="absolute -top-12 right-4 w-20 h-20 rounded-full border-4 border-slate-900 bg-white shadow-lg flex items-center justify-center overflow-hidden">
                             <img src={ASSETS.CHARACTERS.PLAYER} alt="Me" className="w-full h-full object-cover" />
                        </div>
                        
                        <p className="text-lg text-slate-100 font-sans leading-relaxed tracking-wide mb-6">
                            我知道！這叫做...
                        </p>
                        
                        <div className="grid gap-3">
                             <button 
                                onClick={() => handleM3InterludeChoice('牙線')}
                                className="w-full bg-white/10 hover:bg-white/20 border border-white/30 text-white py-3 rounded-lg font-bold transition-all active:scale-95"
                             >
                                牙線
                             </button>
                             <button 
                                onClick={() => handleM3InterludeChoice('稜線')}
                                className="w-full bg-teal-600 hover:bg-teal-500 border border-teal-400 text-white py-3 rounded-lg font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                             >
                                稜線
                             </button>
                        </div>
                        
                        {m3InterludeError && (
                             <div className="mt-4 text-center text-rose-400 text-sm font-bold animate-pulse">
                                 嗯... 這應該不是用來清潔牙齒的吧？
                             </div>
                        )}
                   </div>
               </div>
          </div>
      )}
      
      {/* 6. Post Story Overlay */}
      {showPostStory && activePuzzle?.postStory && (
          <StoryOverlay 
              script={activePuzzle.postStory}
              onComplete={handlePostStoryEnd}
              teamName={teamName}
          />
      )}

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 shadow-sm">
        <button onClick={handleBack} className="p-2 hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-600 hover:text-teal-600 transition-all">
            <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
            <div className={`text-[10px] font-mono uppercase tracking-widest ${activePuzzle?.type === 'side' ? 'text-indigo-600' : 'text-slate-500'}`}>
                {activePuzzle?.type === 'side' ? 'SIDE OPERATION ACTIVE' : 'ACTIVE PROTOCOL'}
            </div>
            <h2 className={`text-base font-bold font-mono truncate max-w-[200px] ${activePuzzle?.type === 'side' ? 'text-indigo-600' : 'text-teal-600'}`}>
            {activePuzzle ? activePuzzle.title : 'Free Explore Mode'}
            </h2>
        </div>
        <div className="flex gap-2">
            {/* Mission 1: Map Link */}
            {activePuzzle?.id === '1' ? (
                 <a 
                    href={ASSETS.LINKS.MAPY_M1}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                    title="開啟地圖"
                >
                    <Map className="w-5 h-5" />
                </a>
            ) : activePuzzle?.id === '2' ? (
                 <a 
                    href={ASSETS.LINKS.M2_HINT_FOLDER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                    title="開啟提示"
                >
                    <Lightbulb className="w-5 h-5" />
                </a>
            ) : activePuzzle?.type === 'side' ? (
                 <a 
                    href={ASSETS.LINKS.SIDE_HINT_FOLDER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                    title="開啟提示"
                >
                    <Lightbulb className="w-5 h-5" />
                </a>
            ) : (
                <>
                    {/* Gallery Button for Check Images */}
                    {activePuzzle?.referenceCheckImages && activePuzzle.referenceCheckImages.length > 0 && (
                        <button 
                            onClick={() => setShowCheckGallery(true)}
                            className="p-2 hover:bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-600 shadow-sm transition-colors"
                            title="View Examples"
                        >
                            <Lightbulb className="w-5 h-5" />
                        </button>
                    )}
                    
                    {/* Reference Image Button (if available) - Mission 3 specific override */}
                    {activePuzzle?.id === '3' ? (
                        <a 
                            href={ASSETS.PUZZLES.M3.HINT_VIEW}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                            title="開啟提示"
                        >
                            <Lightbulb className="w-5 h-5" />
                        </a>
                    ) : activePuzzle?.referenceImage && (
                        <button 
                            onClick={() => setShowReferenceImage(true)}
                            className="p-2 hover:bg-amber-50 rounded-lg border border-amber-200 text-amber-600 shadow-sm transition-colors"
                            title="View Reference"
                        >
                            <ImageIcon className="w-5 h-5" />
                        </button>
                    )}
                </>
            )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-36 relative z-10">
        
        {/* Instructions */}
        {activePuzzle && !originalImage && (
          <div className={`border p-6 rounded-none relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${activePuzzle.type === 'side' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-teal-200 shadow-sm'}`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${activePuzzle.type === 'side' ? 'bg-indigo-500' : 'bg-teal-500'}`}></div>
            <div className="flex justify-between items-start mb-2">
                <h3 className={`font-mono text-xs flex items-center gap-2 ${activePuzzle.type === 'side' ? 'text-indigo-600' : 'text-teal-600'}`}>
                    {activePuzzle.type === 'side' ? <ClipboardList className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                    {activePuzzle.type === 'side' ? 'SIDE MISSION BRIEFING' : '任務目標'}
                </h3>
                {activePuzzle.type === 'side' && (
                    <span className="text-xs font-mono font-bold text-indigo-800 bg-indigo-200/50 px-2 py-0.5 rounded">
                        UPLOADED: {submissionHistory.length}
                    </span>
                )}
            </div>
            <p className="text-slate-700 mb-4 font-mono text-sm leading-relaxed border-l border-slate-200 pl-4">
                {activePuzzle.description}
            </p>
            {!activePuzzle.quiz && (
                <div className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wide border ${activePuzzle.type === 'side' ? 'bg-indigo-100/50 border-indigo-200 text-indigo-700' : 'bg-teal-50 border-teal-200 text-teal-700'}`}>
                <Camera className="w-4 h-4" />
                <span>Objective: Acquire Visual Data</span>
                </div>
            )}
            
            {/* Inline Hint to use Reference */}
            {activePuzzle.referenceCheckImages && activePuzzle.referenceCheckImages.length > 0 && activePuzzle.id !== '2' && (
                 <div className="mt-4 flex items-center gap-2 text-emerald-700 text-xs font-mono">
                    <Lightbulb className="w-4 h-4" />
                    <span>TIP: VIEW EXAMPLE PHOTOS (TOP RIGHT)</span>
                </div>
            )}
          </div>
        )}

        {/* Quiz Section (If applicable) */}
        {activePuzzle?.quiz && (
            <div className={`p-6 rounded-lg border transition-all duration-500 ${isQuizSolved ? 'bg-teal-50 border-teal-200' : 'bg-white border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]'}`}>
                <div className="flex items-center gap-3 mb-4">
                    {isQuizSolved ? (
                        <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                             <CheckCircle className="w-5 h-5" />
                        </div>
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 animate-pulse">
                             <HelpCircle className="w-5 h-5" />
                        </div>
                    )}
                    <div>
                        <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                            {isQuizSolved ? 'SECURITY CLEARANCE GRANTED' : 'SECURITY CHALLENGE REQUIRED'}
                        </div>
                        <h3 className={`font-bold font-sans text-lg ${isQuizSolved ? 'text-teal-700' : 'text-slate-800'}`}>
                            {activePuzzle.quiz.question}
                        </h3>
                    </div>
                </div>

                {/* Show inputs if not solved, or if it's Mission 1/2/3 to see answers */}
                <div className="space-y-6">
                        {activePuzzle.id === '1' ? (
                            <div className="space-y-6">
                                {/* Question 1 Section */}
                                <div className={`space-y-3 p-4 border rounded-lg ${m1Part1Solved ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className={`font-bold text-sm flex items-center gap-2 ${m1Part1Solved ? 'text-teal-700' : 'text-slate-700'}`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m1Part1Solved ? 'bg-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>1</span>
                                            四獸山高度
                                        </h4>
                                        {m1Part1Solved && <CheckCircle className="w-5 h-5 text-teal-500" />}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {['tiger', 'leopard', 'lion', 'elephant'].map((mount) => (
                                            <div key={mount} className="space-y-1">
                                                <label className="text-xs font-mono text-slate-500 capitalize">
                                                    {mount === 'tiger' ? '虎山' : mount === 'leopard' ? '豹山' : mount === 'lion' ? '獅山' : '象山'}
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        type="number" 
                                                        value={(m1Heights as any)[mount]}
                                                        onChange={(e) => setM1Heights({...m1Heights, [mount]: e.target.value})}
                                                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded font-mono text-sm focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:shadow-none disabled:font-bold"
                                                        placeholder="請輸入數字"
                                                        disabled={m1Part1Solved || isCompleted}
                                                    />
                                                    <span className="absolute right-3 top-2 text-xs text-slate-400">m</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {!m1Part1Solved && !isCompleted && (
                                        <>
                                            {m1Part1Error && (
                                                <div className="text-rose-600 text-xs font-mono flex items-center gap-1 animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> 數值不正確，請再檢查。
                                                </div>
                                            )}
                                            <button 
                                                onClick={verifyM1Part1}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono py-2 rounded text-xs uppercase tracking-wider transition-all"
                                            >
                                                確認高度
                                            </button>
                                        </>
                                    )}
                                </div>
                                
                                {/* Question 2 Section */}
                                <div className={`space-y-3 p-4 border rounded-lg ${m1Part2Solved ? 'bg-teal-50 border-teal-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className={`font-bold text-sm flex items-center gap-2 ${m1Part2Solved ? 'text-teal-700' : 'text-slate-700'}`}>
                                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${m1Part2Solved ? 'bg-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>2</span>
                                            地形觀察
                                        </h4>
                                        {m1Part2Solved && <CheckCircle className="w-5 h-5 text-teal-500" />}
                                    </div>

                                    <div className="">
                                        <label className="text-xs font-mono text-slate-500 mb-2 block">開啟3D地圖，觀察周遭地形，為何永春陂會是濕地？</label>
                                        <textarea 
                                            value={m1Reason}
                                            onChange={(e) => setM1Reason(e.target.value)}
                                            className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded font-mono text-sm focus:border-amber-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:resize-none disabled:font-bold"
                                            placeholder="請輸入你的觀察..."
                                            rows={2}
                                            disabled={m1Part2Solved || isCompleted}
                                        />
                                    </div>

                                    {!m1Part2Solved && !isCompleted && (
                                        <>
                                            {m1Part2Error && (
                                                <div className="text-rose-600 text-xs font-mono flex items-center gap-1 animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> 觀察方向有誤，請思考「高低」關係。
                                                </div>
                                            )}
                                            <button 
                                                onClick={verifyM1Part2}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold font-mono py-2 rounded text-xs uppercase tracking-wider transition-all"
                                            >
                                                確認觀察
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : activePuzzle.id === '2' ? (
                            <div className="space-y-4">
                                {/* Formation Question (Modified to Text Input) */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="text-sm font-bold text-slate-700 mb-2">1. 我們現在位於哪個地層？</div>
                                    <input 
                                        type="text" 
                                        value={m2Formation}
                                        onChange={(e) => setM2Formation(e.target.value)}
                                        placeholder="請輸入地層名稱 (例如: OO層)"
                                        className="w-full bg-white border border-slate-300 text-slate-900 px-3 py-2 rounded font-mono text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:font-bold"
                                        disabled={isCompleted || isQuizSolved}
                                    />
                                </div>

                                <div className="border-t border-slate-200 my-2"></div>
                                <div className="text-sm font-bold text-slate-700 mb-1">2. 觸感分析</div>

                                {/* Sandstone Matching */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="text-sm font-bold text-slate-700 mb-2">砂岩 (Sandstone)</div>
                                    <div className="flex gap-2">
                                        {['較粗糙', '較細緻'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setM2Texture({...m2Texture, sandstone: opt})}
                                                disabled={isCompleted || isQuizSolved}
                                                className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${
                                                    m2Texture.sandstone === opt
                                                        ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                                                        : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Shale Matching */}
                                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <div className="text-sm font-bold text-slate-700 mb-2">頁岩 (Shale)</div>
                                    <div className="flex gap-2">
                                        {['較粗糙', '較細緻'].map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setM2Texture({...m2Texture, shale: opt})}
                                                disabled={isCompleted || isQuizSolved}
                                                className={`flex-1 py-2 text-xs font-bold rounded border transition-all ${
                                                    m2Texture.shale === opt
                                                        ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                                                        : 'bg-white text-slate-600 border-slate-300 hover:border-teal-400'
                                                }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {showQuizError && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-mono animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>地層或觸感判斷錯誤，請再仔細觀察。</span>
                                    </div>
                                )}
                                {!isQuizSolved && !isCompleted && (
                                    <button 
                                        onClick={handleQuizVerify}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono py-2.5 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20"
                                    >
                                        VERIFY ANSWER
                                    </button>
                                )}
                            </div>
                        ) : activePuzzle.id === '3' ? (
                            <div className="space-y-3">
                                <div className="flex flex-col gap-2 p-3 border border-slate-200 rounded bg-slate-50">
                                    <div className="flex items-center flex-wrap gap-2 text-slate-700 font-mono text-sm">
                                        <span>等高線越</span>
                                        <select 
                                            value={quizSelect1}
                                            onChange={(e) => setQuizSelect1(e.target.value)}
                                            className="bg-white border border-slate-300 text-teal-700 px-2 py-1 rounded focus:outline-none focus:border-amber-500 transition-colors disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:font-bold"
                                            disabled={isCompleted || isQuizSolved}
                                        >
                                            <option value="" disabled>請選擇</option>
                                            <option value="稀疏">稀疏</option>
                                            <option value="密集">密集</option>
                                        </select>
                                        <span>，爬起來越</span>
                                        <select 
                                            value={quizSelect2}
                                            onChange={(e) => setQuizSelect2(e.target.value)}
                                            className="bg-white border border-slate-300 text-teal-700 px-2 py-1 rounded focus:outline-none focus:border-amber-500 transition-colors disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:font-bold"
                                            disabled={isCompleted || isQuizSolved}
                                        >
                                            <option value="" disabled>請選擇</option>
                                            <option value="累">累</option>
                                            <option value="不累">不累</option>
                                        </select>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-2 text-slate-700 font-mono text-sm">
                                        <span>，坡度感受</span>
                                        <select 
                                            value={quizSelect3}
                                            onChange={(e) => setQuizSelect3(e.target.value)}
                                            className="bg-white border border-slate-300 text-teal-700 px-2 py-1 rounded focus:outline-none focus:border-amber-500 transition-colors disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-300 disabled:font-bold"
                                            disabled={isCompleted || isQuizSolved}
                                        >
                                            <option value="" disabled>請選擇</option>
                                            <option value="平緩">平緩</option>
                                            <option value="微陡">微陡</option>
                                            <option value="很陡">很陡</option>
                                        </select>
                                    </div>
                                </div>
                                
                                {showQuizError && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-mono animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>INCORRECT ANSWER. ACCESS DENIED.</span>
                                    </div>
                                )}
                                {!isQuizSolved && !isCompleted && (
                                    <button 
                                        onClick={handleQuizVerify}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono py-2.5 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20"
                                    >
                                        VERIFY ANSWER
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    value={quizInput}
                                    onChange={(e) => setQuizInput(e.target.value)}
                                    placeholder="輸入你的答案..."
                                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 px-4 py-3 rounded font-mono text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-900 disabled:border-slate-200 disabled:font-bold"
                                    disabled={isCompleted || isQuizSolved}
                                />
                                {showQuizError && (
                                    <div className="flex items-center gap-2 text-rose-600 text-xs font-mono animate-pulse">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>INCORRECT ANSWER. ACCESS DENIED.</span>
                                    </div>
                                )}
                                {!isQuizSolved && !isCompleted && (
                                    <button 
                                        onClick={handleQuizVerify}
                                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold font-mono py-2.5 rounded uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/20"
                                    >
                                        VERIFY ANSWER
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
            </div>
        )}

        {/* ... (rest of the component remains unchanged) ... */}
        
        {/* Mission Completion Button for Mission 1 & 2 (Since no image upload) */}
        {(activePuzzle?.id === '1' || activePuzzle?.id === '2') && isQuizSolved && !isCompleted && (
            <button
                onClick={handlePreComplete}
                className="w-full bg-teal-600 hover:bg-teal-500 text-white py-4 rounded-lg font-mono font-bold text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg animate-in fade-in slide-in-from-bottom-4"
            >
                <CheckCircle className="w-6 h-6" />
                <span>COMPLETE MISSION</span>
            </button>
        )}
        
        {/* Unified Completed Banner for All Main Missions */}
        {isCompleted && activePuzzle?.type !== 'side' && (
             <div className="w-full bg-slate-100 text-slate-500 py-4 rounded-lg font-mono font-bold text-center uppercase tracking-widest border border-slate-200 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-500" />
                MISSION COMPLETED
            </div>
        )}

        {/* Image Area - Unconditionally shown for Mission 3 & Side, conditional for others */}
        {(activePuzzle?.id === '3' || activePuzzle?.type === 'side' || (isQuizSolved && activePuzzle?.id !== '1' && activePuzzle?.id !== '2')) && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards">
                
                {/* Secondary Instruction (If exists) */}
                {!originalImage && activePuzzle?.uploadInstruction && !isCompleted && (
                    <div className={`border-l-2 p-4 rounded-r ${activePuzzle.type === 'side' ? 'bg-indigo-50 border-indigo-500' : 'bg-amber-50 border-amber-500'}`}>
                         <h4 className={`font-bold text-sm mb-1 font-mono flex items-center gap-2 ${activePuzzle.type === 'side' ? 'text-indigo-600' : 'text-amber-700'}`}>
                            <ImageIcon className="w-4 h-4" /> 
                            {(activePuzzle.id === '2' || activePuzzle.id === '3') ? `Question 2: ${activePuzzle.id === '2' ? 'Geological Analysis' : 'Field Sketch'}` : 'IMAGE REQUIRED'}
                         </h4>
                         <p className="text-sm text-slate-700">{activePuzzle.uploadInstruction}</p>
                    </div>
                )}

                <div className={`min-h-[300px] border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4 relative bg-slate-100 group transition-colors hover:border-teal-400 hover:bg-slate-50 ${isCompleted ? 'border-solid border-slate-200' : ''}`}>
                {!originalImage ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm border border-slate-200 group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-slate-400 group-hover:text-teal-500 transition-colors" />
                        </div>
                        <div>
                            <p className="text-slate-600 font-mono mb-2">UPLOAD SENSOR DATA</p>
                            {!isCompleted && (
                                <button 
                                    onClick={triggerFileInput}
                                    className={`px-6 py-2 rounded-full font-bold shadow-md transition-all ${activePuzzle?.type === 'side' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-teal-600 hover:bg-teal-500 text-white'}`}
                                >
                                    ACTIVATE CAMERA / FILE
                                </button>
                            )}
                            {isCompleted && (
                                <p className="text-slate-400 font-mono text-xs">NO IMAGE DATA SAVED</p>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isCompleted}
                        />
                    </div>
                ) : (
                    <div className="w-full space-y-4">
                         {/* If resultImage is null (e.g. manual confirm), make original image bigger. Else show grid. 
                             UploadOnly Missions (2 & 3 & Side): Force single column to hide result image. */}
                         <div className={`grid ${(resultImage || loading) && !isUploadOnly ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                            <div className="relative group">
                                <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-mono backdrop-blur-sm z-10">ORIGINAL</div>
                                <img 
                                    src={`data:image/jpeg;base64,${originalImage}`} 
                                    alt="Original" 
                                    className={`w-full rounded border border-slate-200 shadow-sm object-contain max-h-[50vh] ${!resultImage && !loading ? 'mx-auto' : ''}`} 
                                />
                                {!isCompleted && (
                                    <button 
                                        onClick={() => setOriginalImage(null)}
                                        className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-slate-600 hover:text-rose-600 transition-colors shadow-sm z-10"
                                        title="Remove Image"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                
                                {/* Loading Overlay for UploadOnly (since result column is hidden) */}
                                {loading && isUploadOnly && (
                                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] flex flex-col items-center justify-center rounded z-20">
                                        <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-md" />
                                        <span className="text-white font-mono text-xs font-bold mt-2 drop-shadow-md">ANALYZING...</span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Result Image or Loading State - Hidden for UploadOnly */}
                            {((loading || resultImage) && !isUploadOnly) && (
                                <div className="relative">
                                    <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded font-mono backdrop-blur-sm z-10">ANALYSIS</div>
                                    {loading ? (
                                        <div className="w-full h-full min-h-[150px] bg-slate-200 rounded border border-slate-300 flex flex-col items-center justify-center animate-pulse gap-3 p-4">
                                            <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                                            <p className="text-xs font-mono text-slate-500 text-center">
                                                {validationLoading ? 'VALIDATING GEOLOGY...' : 'PROCESSING VISUAL DATA...'}
                                            </p>
                                        </div>
                                    ) : (
                                        <img 
                                            src={`data:image/jpeg;base64,${resultImage}`} 
                                            alt="Processed" 
                                            className="w-full rounded border border-slate-200 shadow-sm object-contain max-h-[50vh]" 
                                        />
                                    )}
                                </div>
                            )}
                         </div>

                         {/* Error Message */}
                         {error && (
                             <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-mono flex items-center gap-2">
                                 <AlertTriangle className="w-4 h-4 shrink-0" />
                                 {error}
                             </div>
                         )}

                         {/* UploadOnly: Verify Button placed immediately below image */}
                         {isUploadOnly && !isCompleted && !validationResult?.isValid && (
                             <button 
                                onClick={handleValidateAndGenerate}
                                disabled={loading}
                                className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white px-4 py-3 rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm mb-2"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                                VERIFY SAMPLE
                            </button>
                         )}

                         {/* Validation Result Message */}
                         {validationResult && (
                             <div className={`p-4 rounded-lg border flex items-start gap-3 ${validationResult.isValid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                 {validationResult.isValid ? (
                                     <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                 ) : (
                                     <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                                 )}
                                 <div>
                                     <h4 className={`font-bold text-sm font-mono ${validationResult.isValid ? 'text-emerald-800' : 'text-rose-800'}`}>
                                         {validationResult.isValid ? 'DATA VALIDATED' : 'DATA REJECTED'}
                                     </h4>
                                     <p className={`text-sm ${validationResult.isValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                                         {validationResult.feedback}
                                     </p>
                                 </div>
                             </div>
                         )}

                         {/* Prompt Input Area - Now acts as Memo for UploadOnly missions */}
                         {(!isCompleted || (isCompleted && prompt)) && (
                             <div className="space-y-2">
                                <label className="text-xs font-mono text-slate-500">
                                    {isUploadOnly ? "FIELD NOTES (MEMO)" : "AUGMENTATION PROMPT"}
                                </label>
                                {isCompleted ? (
                                     <div className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm font-mono text-slate-700 break-words">
                                        {prompt}
                                     </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input 
                                            type="text" 
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            className={`bg-white border border-slate-300 rounded px-3 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none shadow-sm flex-1`}
                                            placeholder={isUploadOnly ? "Record your observations here (optional)..." : "Enter visualization parameters..."}
                                        />
                                        {!isUploadOnly && (
                                            <div className="flex gap-2">
                                                {/* Aspect Ratio Selector */}
                                                <div className="relative shrink-0">
                                                    <select 
                                                        value={aspectRatio}
                                                        onChange={(e) => setAspectRatio(e.target.value)}
                                                        className="bg-white border border-slate-300 rounded pl-2 pr-6 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none shadow-sm appearance-none h-full cursor-pointer"
                                                        title="Select Aspect Ratio"
                                                    >
                                                        {['1:1', '2:3', '3:2', '3:4', '4:3', '9:16', '16:9', '21:9'].map(r => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                    </div>
                                                </div>

                                                {/* Image Size Selector */}
                                                <div className="relative shrink-0">
                                                    <select 
                                                        value={imageSize}
                                                        onChange={(e) => setImageSize(e.target.value)}
                                                        className="bg-white border border-slate-300 rounded pl-2 pr-6 py-2 text-sm font-mono focus:border-teal-500 focus:outline-none shadow-sm appearance-none h-full cursor-pointer"
                                                        title="Select Image Size"
                                                    >
                                                        {['1K', '2K', '4K'].map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={handleValidateAndGenerate}
                                                    disabled={loading || (!prompt && !isUploadOnly)}
                                                    className="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-300 text-white px-4 py-2 rounded font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
                                                >
                                                    {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Terminal className="w-3 h-3" />}
                                                    EXECUTE
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                             </div>
                         )}
                         
                         {/* Complete Button (Only if valid or bypassed) */}
                         {!isCompleted && validationResult?.isValid && (
                            <>
                                {( (activePuzzle?.id !== '2' && activePuzzle?.id !== '3') || isQuizSolved) ? (
                                    activePuzzle?.type === 'side' ? (
                                     <button
                                        onClick={handlePreComplete}
                                        className="w-full hover:opacity-90 text-white py-4 rounded-lg font-mono font-bold text-lg uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg mt-4 animate-in fade-in slide-in-from-bottom-2 bg-indigo-600 hover:bg-indigo-500"
                                     >
                                        <CheckCircle className="w-6 h-6" />
                                        <span>UPLOAD & CONTINUE ({submissionHistory.length + 1})</span>
                                     </button>
                                    ) : (
                                        <div className="mt-4 text-center text-teal-600 font-mono text-xs animate-pulse font-bold tracking-widest bg-teal-50 py-3 rounded-lg border border-teal-100">
                                            VERIFIED. UPLOADING DATA...
                                        </div>
                                    )
                                ) : (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm font-mono flex items-center gap-2 animate-pulse">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>PENDING: PLEASE RESOLVE SECURITY CHALLENGE (QUIZ) ABOVE</span>
                                    </div>
                                )}
                            </>
                         )}
                    </div>
                )}
                </div>
            </div>
        )}

        {/* Side Mission History Log */}
        {activePuzzle?.type === 'side' && submissionHistory.length > 0 && (
            <div className="mt-6 border-t border-slate-200 pt-6 animate-in slide-in-from-bottom-4">
                <h3 className="text-sm font-bold font-mono text-slate-600 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    FIELD LOG (現場紀錄)
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    {submissionHistory.map((sub, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex gap-3 shadow-sm">
                            <div className="w-20 h-20 shrink-0 bg-slate-100 rounded border border-slate-200 overflow-hidden">
                                <img 
                                    src={`data:image/jpeg;base64,${sub.image}`} 
                                    alt={`Submission ${idx}`} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                        ENTRY #{submissionHistory.length - idx}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        {new Date(sub.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed break-words">
                                    {sub.description || "No notes recorded."}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
            <div className="absolute inset-0 z-[1100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in zoom-in-95 duration-300">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-emerald-500 to-teal-400"></div>
                    
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <PartyPopper className="w-10 h-10 text-emerald-600" />
                    </div>
                    
                    <h2 className="text-2xl font-bold font-mono text-slate-800 mb-2">MISSION ACCOMPLISHED</h2>
                    <p className="text-slate-600 mb-8">Data successfully verified and uploaded to the Geological Archive.</p>
                    
                    <button 
                        onClick={handleFinalExit}
                        className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-bold font-mono shadow-lg transition-all"
                    >
                        RETURN TO MAP
                    </button>
                </div>
            </div>
        )}

        {/* Reference Image Modal */}
        {showReferenceImage && activePuzzle?.referenceImage && (
            <div className="absolute inset-0 z-[1200] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowReferenceImage(false)}>
                <div className="relative max-w-full max-h-full" onClick={e => e.stopPropagation()}>
                    <button 
                        onClick={() => setShowReferenceImage(false)}
                        className="absolute -top-12 right-0 text-white hover:text-slate-300 p-2"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    {isDriveFolder ? (
                         <div className="bg-white p-8 rounded-lg text-center max-w-sm">
                             <FolderOpen className="w-16 h-16 mx-auto text-amber-500 mb-4" />
                             <h3 className="text-lg font-bold mb-2">External Reference Folder</h3>
                             <p className="text-sm text-slate-500 mb-6">This mission contains multiple reference files stored in a secure external drive.</p>
                             <a 
                                href={activePuzzle.referenceImage} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded font-bold flex items-center justify-center gap-2"
                             >
                                <span>OPEN FOLDER</span>
                                <ExternalLink className="w-4 h-4" />
                             </a>
                         </div>
                    ) : (
                        <img 
                            src={activePuzzle.referenceImage} 
                            alt="Reference" 
                            className="max-w-full max-h-[85vh] rounded shadow-2xl border-2 border-white/20" 
                        />
                    )}
                </div>
            </div>
        )}

        {/* Check Gallery Modal */}
        {showCheckGallery && activePuzzle?.referenceCheckImages && (
            <div className="absolute inset-0 z-[1200] bg-black/95 flex flex-col p-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-white font-mono font-bold flex items-center gap-2">
                        <ScanSearch className="w-5 h-5 text-emerald-400" />
                        VALIDATED EXAMPLES
                    </h3>
                    <button onClick={() => setShowCheckGallery(false)} className="text-slate-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                    {activePuzzle.referenceCheckImages.map((imgUrl, idx) => (
                        <div key={idx} className="relative group">
                            <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded font-mono shadow-sm">
                                EXAMPLE #{idx + 1}
                            </div>
                            <img 
                                src={imgUrl} 
                                alt={`Example ${idx+1}`} 
                                className="w-full rounded-lg border border-slate-700 bg-slate-800 min-h-[200px] object-contain"
                            />
                        </div>
                    ))}
                </div>
                <div className="text-center text-slate-500 text-xs font-mono shrink-0 pt-2">
                    Use these examples to verify your findings.
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
