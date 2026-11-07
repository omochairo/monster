import { describe, expect, it } from 'vitest';
import { GeneratedPet } from '../types';
import { ELEMENTS, fusePets, generateEnemy, generateProfileFromSeedString, quizTraits } from '../services/geminiService';
import { janken, counterOf, makeFighter, resolveTurn, starsFor, maxHpOf } from '../services/battle';
import { gainXp, xpToNext, displayName, normalizePet } from '../services/growth';
import { bodyIndexOf, speciesNo, SPECIES_COUNT, formOfLevel } from '../services/species';
import {
  claimDailyStamp, claimMission, createProgress, ensureTodayMissions, normalizeProgress, recordEvent,
  registerPetting, warmEgg, PETTING_DAILY_LIMIT, STAMP_CARD_SIZE,
} from '../services/progress';
import { STAGES } from '../constants';

const pet = (over: Partial<GeneratedPet> = {}): GeneratedPet => ({
  name: 'テスト',
  description: '',
  superpower: '',
  imagePrompt: 'test-1',
  rarity: 1,
  element: ELEMENTS.find(e => e.id === 'fire')!,
  stats: { power: 40, speed: 40, smarts: 40 },
  imageUrl: '',
  level: 1,
  xp: 0,
  friendship: 0,
  ...over,
});
const fixed = (v: number) => () => v;

describe('janken', () => {
  it('✊ > ✌️ > ✋ > ✊', () => {
    expect(janken('power', 'speed')).toBe('win');
    expect(janken('speed', 'smarts')).toBe('win');
    expect(janken('smarts', 'power')).toBe('win');
    expect(janken('speed', 'power')).toBe('lose');
    expect(janken('power', 'power')).toBe('draw');
  });
  it('counterOf returns the winning move', () => {
    for (const m of ['power', 'speed', 'smarts'] as const) expect(janken(counterOf(m), m)).toBe('win');
  });
});

describe('resolveTurn', () => {
  it('winning janken deals more than losing it', () => {
    const p = makeFighter(pet());
    const e = makeFighter(pet({ element: ELEMENTS.find(x => x.id === 'wind')!, imagePrompt: 'e' }));
    const win = resolveTurn(p, e, 'power', 'speed', false, fixed(0.5));
    const lose = resolveTurn(p, e, 'speed', 'power', false, fixed(0.5));
    expect(win.dealt).toBeGreaterThan(lose.dealt);
    expect(win.taken).toBeLessThan(lose.taken);
  });
  it('special blocks the enemy attack and gives no gauge', () => {
    const out = resolveTurn(makeFighter(pet()), makeFighter(pet()), 'power', 'smarts', true, fixed(0.5));
    expect(out.taken).toBe(0);
    expect(out.gaugeGain).toBe(0);
  });
  it('friendship 80+ saves the fighter once with 1 HP', () => {
    const p = { ...makeFighter(pet({ friendship: 90 })), hp: 1 };
    const e = makeFighter(pet({ stats: { power: 200, speed: 200, smarts: 200 } }));
    const first = resolveTurn(p, e, 'speed', 'power', false, fixed(0.5));
    expect(first.braveSaved).toBe(true);
    expect(first.player.hp).toBe(1);
    const second = resolveTurn(first.player, first.enemy, 'speed', 'power', false, fixed(0.5));
    expect(second.braveSaved).toBe(false);
    expect(second.player.hp).toBe(0);
  });
  it('a defeated enemy does not hit back', () => {
    const e = { ...makeFighter(pet()), hp: 1 };
    const out = resolveTurn(makeFighter(pet()), e, 'power', 'speed', false, fixed(0.5));
    expect(out.enemy.hp).toBe(0);
    expect(out.taken).toBe(0);
  });
  it('stars follow fainted count', () => {
    expect([starsFor(0), starsFor(1), starsFor(2)]).toEqual([3, 2, 1]);
  });
  it('a fresh quiz pet beats a town enemy in a few turns', () => {
    const me = makeFighter(pet({ stats: { power: 35, speed: 35, smarts: 35 } }));
    const foe = makeFighter(pet({ stats: { power: 28, speed: 28, smarts: 28 }, element: ELEMENTS[5] }), 0.8);
    const turnsToWin = Math.ceil(foe.maxHp / resolveTurn(me, foe, 'power', 'power', false, fixed(0.5)).dealt);
    expect(turnsToWin).toBeGreaterThanOrEqual(2);
    expect(turnsToWin).toBeLessThanOrEqual(5);
    expect(maxHpOf(me.pet)).toBeGreaterThan(50);
  });
});

describe('growth', () => {
  it('xp carries over and levels add stats', () => {
    const r = gainXp(pet(), xpToNext(1) + 5);
    expect(r.pet.level).toBe(2);
    expect(r.pet.xp).toBe(5);
    expect(r.pet.stats.power).toBe(43);
    expect(r.evolvedTo).toBeNull();
  });
  it('evolves at Lv8 and renames on screen', () => {
    const r = gainXp(pet({ level: 7 }), xpToNext(7));
    expect(r.pet.level).toBe(8);
    expect(r.evolvedTo).toBe(2);
    expect(displayName(r.pet)).toBe('ネオテスト');
    expect(formOfLevel(20)).toBe(3);
  });
  it('normalizePet fills fields of old saves', () => {
    const old = { ...pet(), level: undefined, xp: undefined, friendship: undefined } as unknown as GeneratedPet;
    expect(normalizePet(old)).toMatchObject({ level: 1, xp: 0, friendship: 0 });
  });
});

describe('species', () => {
  it('has 48 numbered species and stable bodies for old saves', () => {
    expect(SPECIES_COUNT).toBe(48);
    expect(speciesNo('fire', 0)).toBe(1);
    expect(speciesNo('dark', 5)).toBe(48);
    expect(bodyIndexOf({ imagePrompt: 'abc' })).toBe(bodyIndexOf({ imagePrompt: 'abc' }));
    expect(bodyIndexOf({ imagePrompt: 'abc', bodyIndex: 2 })).toBe(2);
  });
  it('quiz answers decide element and body', () => {
    expect(quizTraits(['outside', 'snack', 'fly', 'red', 'ocean'])).toMatchObject({ elementId: 'fire', bodyIndex: 2, favoriteStat: 'power' });
  });
  it('generation is deterministic for a seed', () => {
    expect(generateProfileFromSeedString('x')).toEqual(generateProfileFromSeedString('x'));
  });
});

describe('enemies and fusion', () => {
  it('normal enemies stay in the stage band; last wave is the boss', () => {
    const town = STAGES[0];
    for (let i = 0; i < 20; i++) {
      const e = generateEnemy(town, 0);
      expect(e.isBoss).toBe(false);
      expect(e.stats.power).toBeLessThanOrEqual(town.enemyStats[1] + 4 * 3 + 5);
    }
    expect(generateEnemy(town, town.waves - 1).isBoss).toBe(true);
    const papa = generateEnemy(STAGES.find(s => s.id === 'final_star')!, 2);
    expect(papa.name).toBe('いろパパ');
  });
  it('fusion takes body from the first, element from the second and never stacks 超', () => {
    const a = pet({ name: '超ポコまる', bodyIndex: 3, stats: { power: 100, speed: 10, smarts: 10 } });
    const b = pet({ name: 'キラゴン', element: ELEMENTS.find(e => e.id === 'ice')!, stats: { power: 10, speed: 50, smarts: 10 } });
    const f = fusePets(a, b);
    expect(f.name.startsWith('超超')).toBe(false);
    expect(bodyIndexOf(f)).toBe(3);
    expect(f.element.id).toBe('ice');
    expect(f.stats.power).toBe(110);
    expect(f.stats.speed).toBe(55);
  });
});

describe('progress', () => {
  it('stamps once per day and gives a gold egg on the 7th', () => {
    let p = createProgress();
    const again = claimDailyStamp(claimDailyStamp(p, '2026-11-01').progress, '2026-11-01');
    expect(again.stamped).toBe(false);
    for (let d = 1; d <= STAMP_CARD_SIZE; d++) p = claimDailyStamp(p, `2026-11-0${d}`).progress;
    expect(p.egg?.tier).toBe('gold');
    expect(p.stamps.count).toBe(0);
  });
  it('missions advance by events and claiming all gives the bonus egg', () => {
    let p = ensureTodayMissions(createProgress(), '2026-11-07');
    expect(p.missions.list).toHaveLength(3);
    for (let i = 0; i < 10; i++) {
      for (const e of [{ type: 'janken_win' }, { type: 'special' }, { type: 'pet' }, { type: 'feed' }, { type: 'recruit' }] as const) p = recordEvent(p, e, '2026-11-07');
      p = recordEvent(p, { type: 'stage_clear', elementIds: ELEMENTS.map(e => e.id), stars: 3 }, '2026-11-07');
    }
    for (const m of p.missions.list) p = claimMission(p, m.id);
    expect(p.missions.list.every(m => m.claimed)).toBe(true);
    expect(p.missions.bonusClaimed).toBe(true);
    expect(p.egg).not.toBeNull();
  });
  it('petting is capped per day', () => {
    let p = createProgress();
    let counted = 0;
    for (let i = 0; i < PETTING_DAILY_LIMIT + 5; i++) {
      const r = registerPetting(p, '2026-11-07');
      p = r.progress;
      if (r.counted) counted++;
    }
    expect(counted).toBe(PETTING_DAILY_LIMIT);
  });
  it('eggs hatch when warm enough', () => {
    const p = { ...createProgress(), egg: { tier: 'normal' as const, warmth: 1 } };
    expect(warmEgg(p, 1).hatchTier).toBe('normal');
    expect(warmEgg(p, 1).progress.egg).toBeNull();
  });
  it('normalizeProgress tolerates junk', () => {
    expect(normalizeProgress(null).snacks.apple).toBe(3);
    expect(normalizeProgress({ snacks: { apple: 9 }, egg: { tier: 'bogus' } }).egg).toBeNull();
  });
});
