import { GeneratedPet } from '../types';
import { formOfLevel } from './species';

export const STAT_CAP = 999;
export const LEVEL_UP_STAT = 3;
export const EVOLVE_STAT = 8;
export const BRAVE_FRIENDSHIP = 80; // friendship needed for the "ふんばり" save in battle

export const xpToNext = (level: number) => 40 + level * 20;

const FORM_PREFIX = ['', 'ネオ', 'キング'];

// Name shown on screen; the stored name never changes so evolution needs no migration.
export const displayName = (pet: Pick<GeneratedPet, 'name' | 'level' | 'imagePrompt'>) => {
  if (pet.imagePrompt === 'iro-papa' || pet.imagePrompt === 'iro-mama') return pet.name;
  return `${FORM_PREFIX[formOfLevel(pet.level) - 1]}${pet.name}`;
};

export interface XpResult {
  pet: GeneratedPet;
  levelsGained: number;
  evolvedTo: 2 | 3 | null;
}

const addAll = (stats: GeneratedPet['stats'], n: number) => ({
  power: Math.min(STAT_CAP, stats.power + n),
  speed: Math.min(STAT_CAP, stats.speed + n),
  smarts: Math.min(STAT_CAP, stats.smarts + n),
});

export const gainXp = (pet: GeneratedPet, amount: number): XpResult => {
  let level = pet.level || 1;
  let xp = (pet.xp || 0) + amount;
  let stats = { ...pet.stats };
  const startForm = formOfLevel(level);
  let levelsGained = 0;
  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    levelsGained += 1;
    stats = addAll(stats, LEVEL_UP_STAT);
  }
  const endForm = formOfLevel(level);
  if (endForm > startForm) stats = addAll(stats, EVOLVE_STAT * (endForm - startForm));
  return {
    pet: { ...pet, level, xp, stats },
    levelsGained,
    evolvedTo: endForm > startForm ? (endForm as 2 | 3) : null,
  };
};

// Make sure every saved pet has the fields newer code reads.
export const normalizePet = (pet: GeneratedPet): GeneratedPet => ({
  ...pet,
  level: pet.level || 1,
  xp: pet.xp || 0,
  friendship: pet.friendship ?? 0,
  dateFound: pet.dateFound || 0,
});

export const petKey = (p: Pick<GeneratedPet, 'imagePrompt' | 'dateFound'>) => `${p.imagePrompt}-${p.dateFound}`;
