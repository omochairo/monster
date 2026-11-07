import { GeneratedPet, PetStats } from '../types';
import { calculateTypeMultiplier } from './geminiService';
import { BRAVE_FRIENDSHIP } from './growth';

// Janken battle: ✊ power beats ✌️ speed, ✌️ speed beats ✋ smarts, ✋ smarts beats ✊ power.
export type Move = keyof PetStats;
export type JankenResult = 'win' | 'lose' | 'draw';

export const MOVE_ORDER: Move[] = ['power', 'speed', 'smarts'];

export const MOVES: Record<Move, { hand: string; label: string; button: string }> = {
  power: { hand: '✊', label: 'パワー', button: 'from-red-400 to-orange-500' },
  speed: { hand: '✌️', label: 'スピード', button: 'from-sky-400 to-blue-500' },
  smarts: { hand: '✋', label: 'かしこさ', button: 'from-emerald-400 to-green-500' },
};

const BEATS: Record<Move, Move> = { power: 'speed', speed: 'smarts', smarts: 'power' };

export const janken = (a: Move, b: Move): JankenResult => (a === b ? 'draw' : BEATS[a] === b ? 'win' : 'lose');

// The move that wins against the given one (used for hints).
export const counterOf = (m: Move): Move => MOVE_ORDER.find(x => BEATS[x] === m)!;

export const JANKEN_MULT: Record<JankenResult, number> = { win: 1.5, draw: 1, lose: 0.5 };
export const SPECIAL_MULT = 2.5;
export const GAUGE_GAIN: Record<JankenResult, number> = { win: 40, draw: 25, lose: 15 };

export interface Fighter {
  pet: GeneratedPet;
  hp: number;
  maxHp: number;
  braveUsed: boolean;
}

const avgStat = (s: PetStats) => (s.power + s.speed + s.smarts) / 3;

export const maxHpOf = (pet: GeneratedPet, scale = 1) =>
  Math.max(10, Math.round((30 + avgStat(pet.stats) + (pet.level || 1) * 2) * scale));

export const makeFighter = (pet: GeneratedPet, scale = 1): Fighter => {
  const maxHp = maxHpOf(pet, scale);
  return { pet, hp: maxHp, maxHp, braveUsed: false };
};

export const damageOf = (attacker: GeneratedPet, move: Move, defender: GeneratedPet, mult: number, rand: () => number) => {
  const typeMult = calculateTypeMultiplier(attacker.element.id, defender.element.id);
  const variance = 0.9 + rand() * 0.2;
  return Math.max(1, Math.round((attacker.stats[move] * 0.32 + 4) * typeMult * mult * variance));
};

// Enemies favour their best stat half of the time so their pattern can be learned.
export const chooseEnemyMove = (pet: GeneratedPet, rand: () => number): Move => {
  if (rand() < 0.5) return MOVE_ORDER.reduce((best, m) => (pet.stats[m] > pet.stats[best] ? m : best), MOVE_ORDER[0]);
  return MOVE_ORDER[Math.floor(rand() * MOVE_ORDER.length)];
};

export const bestMoveOf = (pet: GeneratedPet): Move =>
  MOVE_ORDER.reduce((best, m) => (pet.stats[m] > pet.stats[best] ? m : best), MOVE_ORDER[0]);

export interface TurnOutcome {
  result: JankenResult;
  special: boolean;
  dealt: number; // damage to the enemy
  taken: number; // damage to the player's fighter
  typeMult: number;
  player: Fighter;
  enemy: Fighter;
  braveSaved: boolean; // player's fighter survived with 1 HP thanks to friendship
  gaugeGain: number;
}

/**
 * Resolve one turn. Both sides attack at once; janken decides who hits harder.
 * A special ignores janken, hits with the best stat and blocks the enemy attack.
 */
export const resolveTurn = (
  player: Fighter,
  enemy: Fighter,
  playerMove: Move,
  enemyMove: Move,
  special: boolean,
  rand: () => number = Math.random,
): TurnOutcome => {
  const result = janken(playerMove, enemyMove);
  const typeMult = calculateTypeMultiplier(player.pet.element.id, enemy.pet.element.id);
  const attackMove = special ? bestMoveOf(player.pet) : playerMove;
  const dealt = damageOf(player.pet, attackMove, enemy.pet, special ? SPECIAL_MULT : JANKEN_MULT[result], rand);
  const enemyResult = janken(enemyMove, playerMove);
  const rawTaken = special ? 0 : damageOf(enemy.pet, enemyMove, player.pet, JANKEN_MULT[enemyResult], rand);

  const enemyHp = Math.max(0, enemy.hp - dealt);
  // The enemy only hits back if it is still standing.
  let taken = enemyHp > 0 ? rawTaken : 0;
  let braveUsed = player.braveUsed;
  let braveSaved = false;
  if (taken >= player.hp && !braveUsed && (player.pet.friendship || 0) >= BRAVE_FRIENDSHIP) {
    taken = player.hp - 1;
    braveUsed = true;
    braveSaved = true;
  }

  return {
    result,
    special,
    dealt,
    taken,
    typeMult,
    player: { ...player, hp: Math.max(0, player.hp - taken), braveUsed },
    enemy: { ...enemy, hp: enemyHp },
    braveSaved,
    gaugeGain: special ? 0 : GAUGE_GAIN[result],
  };
};

export const starsFor = (faintedCount: number) => (faintedCount === 0 ? 3 : faintedCount === 1 ? 2 : 1);

export const ENEMY_HP_SCALE = { normal: 0.8, boss: 1.25 };

// XP per defeated enemy, and a bonus when the whole stage is cleared.
export const xpForEnemy = (difficulty: number, isBoss: boolean) => (15 + difficulty * 12) * (isBoss ? 2 : 1);
export const xpForLoss = (difficulty: number) => 10 + difficulty * 5;
