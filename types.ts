
export interface GeneratedImage {
  original: string; // Base64
  modified: string | null; // Base64
  prompt: string;
  timestamp: number;
}

export enum AppView {
  INTRO = 'INTRO', // New Start Screen
  HOME = 'HOME', // This is the Map View
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
  GALLERY = 'GALLERY'
}

export interface StoryScript {
  speaker: string;
  text: string;
  avatar?: 'teacher' | 'chief' | 'player'; // Optional avatar type key
  portraitUrl?: string; // Optional: Specific image URL for this dialogue line (overrides default)
}

export interface Puzzle {
  id: string;
  title: string;
  description: string;
  targetPromptHint: string;
  difficulty: 'Novice' | 'Geologist' | 'Expert';
  xpReward: number;
  rankRequirement: string;
  lat: number;
  lng: number;
  fragmentId: number; // 0, 1, or 2 for main missions. -1 for side missions.
  quiz?: {
    question: string;
    answer: string;
  };
  uploadInstruction?: string; // New field for specific upload/description instructions
  type?: 'main' | 'side'; // Distinguish between main story and side missions
  referenceImage?: string; // Primary reference image
  referenceCheckImages?: string[]; // Array of reference images for AI comparison/User gallery
  
  // Story Scripts
  openingStory?: StoryScript[]; // Before mission starts (前劇情)
  solutionStory?: StoryScript[]; // Immediately upon solving/completing (謎底劇情)
  postStory?: StoryScript[]; // After solution story, leading to next phase (後劇情)
}

export interface PlayerStats {
  level: number;
  currentXp: number;
  nextLevelXp: number;
  rank: string;
  mana: number; // AP for generating images
  maxMana: number;
  sosCount: number; // Number of times player can ask for help
}

export interface SideMissionSubmission {
  image: string;
  description: string;
  timestamp: number;
}

export interface PuzzleProgress {
  m1Heights?: {
    tiger: string;
    leopard: string;
    lion: string;
    elephant: string;
  };
  m1Reason?: string;
  
  // Mission 2 Texture Matching (Deprecated but kept for type compatibility if needed)
  m2Texture?: {
    sandstone: string;
    shale: string;
  };
  // Mission 2 Formation Question
  m2Formation?: string;

  quizInput?: string;
  quizSelect1?: string;
  quizSelect2?: string;
  quizSelect3?: string; // New dropdown for slope feeling
  imageDescription?: string;
  uploadedImage?: string | null;
  
  // Side Mission History
  sideMissionSubmissions?: SideMissionSubmission[];
  
  // Stats
  failureCount?: number;

  // Solved Status Flags
  m1Part1Solved?: boolean;
  m1Part2Solved?: boolean;
  isQuizSolved?: boolean;
  hasSeenOpeningStory?: boolean; // Track if the intro story has been viewed
}

// Encyclopedia Types
export type EncyclopediaCategory = 'Geology' | 'History' | 'Ecology' | 'Tech';

export interface EncyclopediaEntry {
  id: string;
  title: string;
  category: EncyclopediaCategory;
  summary: string;
  content: string;
  relatedMissionId?: string; // Optional link to a specific mission
}
