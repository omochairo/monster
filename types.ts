
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
  friendship?: number; // 0-100
  lastFed?: number; // timestamp
  isFused?: boolean;
  bodyIndex?: number; // body shape; derived from imagePrompt when missing (old saves)
  shiny?: boolean; // いろちがい
  isBoss?: boolean; // stage boss (enemies only)
}

export interface AppSettings {
  seEnabled: boolean;
  bgmEnabled: boolean;
  speechEnabled: boolean;
  hiraganaMode: boolean;
}

export interface Stage {
  id: string;
  name: string;
  description: string;
  emoji: string;
  difficultyLevel: number; // 1-6
  enemyStats: [number, number]; // stat range of normal enemies
  waves: number; // battles per visit; the last one is the stage boss
  hideIntentChance: number; // chance the enemy hides its next move
  bgGradient: string;
  requiresStage?: string; // must clear this stage first
  requiredSpecies?: number; // species found in the zukan
}

export enum AppState {
  START = 'START',
  QUIZ = 'QUIZ',
  LOADING = 'LOADING',
  RESULT = 'RESULT',
  COLLECTION = 'COLLECTION',
  STAGE_SELECT = 'STAGE_SELECT',
  BATTLE = 'BATTLE',
  FUSION = 'FUSION',
  ERROR = 'ERROR'
}

