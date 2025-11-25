
export interface Option {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export interface PetStats {
  power: number;
  speed: number;
  smarts: number;
}

export interface PetElement {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export interface PetProfile {
  name: string;
  description: string;
  superpower: string;
  imagePrompt: string; // Used internally for generation
  rarity: number; // 1 to 5
  stats: PetStats;
  element: PetElement;
}

export interface GeneratedPet extends PetProfile {
  imageUrl: string;
  dateFound?: number; // timestamp for collection sorting
  level?: number;
  xp?: number;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  emoji: string;
  difficultyLevel: number; // 1-5
  minStats: number;
  bgGradient: string;
  requiredCollectionCount: number; // How many pets needed to unlock
}

export enum AppState {
  START = 'START',
  QUIZ = 'QUIZ',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  COLLECTION = 'COLLECTION',
  STAGE_SELECT = 'STAGE_SELECT',
  BATTLE = 'BATTLE',
  ERROR = 'ERROR'
}
