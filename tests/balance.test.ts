import { describe, expect, it } from 'vitest';
import { GeneratedPet } from '../types';
import { STAGES } from '../constants';
import { ELEMENTS, generateEnemy } from '../services/geminiService';
import { ENEMY_HP_SCALE, Move, MOVE_ORDER, chooseEnemyMove, counterOf, makeFighter, resolveTurn } from '../services/battle';

// Plays a whole stage with one monster and reports whether it was cleared.
const playStage = (pet: GeneratedPet, stageIndex: number, pickMove: (intent: Move) => Move) => {
  const stage = STAGES[stageIndex];
  let me = makeFighter(pet);
  let gauge = 0;
  for (let wave = 0; wave < stage.waves; wave++) {
    const enemyPet = generateEnemy(stage, wave);
    let enemy = makeFighter(enemyPet, enemyPet.isBoss ? ENEMY_HP_SCALE.boss : ENEMY_HP_SCALE.normal);
    for (let turn = 0; turn < 40 && enemy.hp > 0; turn++) {
      const intent = chooseEnemyMove(enemy.pet, Math.random);
      const special = gauge >= 100;
      const out = resolveTurn(me, enemy, pickMove(intent), intent, special);
      gauge = special ? 0 : Math.min(100, gauge + out.gaugeGain);
      me = out.player;
      enemy = out.enemy;
      if (me.hp <= 0) return false;
    }
  }
  return true;
};

const starter = (): GeneratedPet => ({
  name: 'スターター', description: '', superpower: '', imagePrompt: `s-${Math.random()}`, rarity: 2,
  element: ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)],
  stats: { power: 40, speed: 36, smarts: 36 }, imageUrl: '', level: 1, xp: 0, friendship: 20,
});

const clearRate = (stageIndex: number, pickMove: (intent: Move) => Move, runs = 400) => {
  let cleared = 0;
  for (let i = 0; i < runs; i++) if (playStage(starter(), stageIndex, pickMove)) cleared++;
  return cleared / runs;
};

describe('balance (simulation)', () => {
  it('a new monster can clear the first town alone when it reads the enemy', () => {
    expect(clearRate(0, counterOf)).toBeGreaterThan(0.85);
  });
  it('reading the enemy matters: random choices clear less often', () => {
    const random = () => MOVE_ORDER[Math.floor(Math.random() * 3)];
    expect(clearRate(0, counterOf) - clearRate(0, random)).toBeGreaterThan(0.15);
  });
  it('the volcano is out of reach for a new monster alone', () => {
    expect(clearRate(2, counterOf)).toBeLessThan(0.3);
  });
});
