import { ELEMENTS } from './geminiService';
import { pick, seededRandom, simpleHash, todayKey } from './random';

// Player progress lives in its own key so the existing collection save is never rewritten by these features.
export const PROGRESS_STORAGE_KEY = 'mystery-pet-progress-v1';
const LEGACY_EGG_KEY = 'mystery-pet-has-egg';

export type SnackType = 'candy' | 'apple' | 'cake';
export type EggTier = 'normal' | 'gold' | 'rainbow';

export interface EggState {
  tier: EggTier;
  warmth: number;
}

export type Reward =
  | { kind: 'snack'; snack: SnackType; amount: number }
  | { kind: 'egg'; tier: EggTier };

export type MissionKind = 'janken_win' | 'special' | 'stage_clear' | 'stage_clear_element' | 'pet' | 'feed' | 'three_star' | 'recruit';

export interface Mission {
  id: string;
  kind: MissionKind;
  label: string;
  target: number;
  progress: number;
  claimed: boolean;
  elementId?: string;
  reward: Reward;
}

export interface PlayerProgress {
  version: 1;
  snacks: Record<SnackType, number>;
  stageStars: Record<string, number>;
  stamps: { lastDate: string; count: number };
  missions: { date: string; list: Mission[]; bonusClaimed: boolean };
  petting: { date: string; count: number };
  egg: EggState | null;
  stats: { battlesWon: number; stagesCleared: number; shinyFound: number };
}

export type GameEvent =
  | { type: 'janken_win' }
  | { type: 'special' }
  | { type: 'stage_clear'; elementIds: string[]; stars: number }
  | { type: 'pet' }
  | { type: 'feed' }
  | { type: 'recruit' };

export const SNACKS: Record<SnackType, { label: string; emoji: string; stat: 'power' | 'speed' | 'smarts'; statLabel: string }> = {
  apple: { label: 'りんご', emoji: '🍎', stat: 'power', statLabel: 'パワー' },
  candy: { label: 'あめだま', emoji: '🍬', stat: 'speed', statLabel: 'スピード' },
  cake: { label: 'ケーキ', emoji: '🍰', stat: 'smarts', statLabel: 'かしこさ' },
};

export const EGG_INFO: Record<EggTier, { label: string; emoji: string; need: number; minRarity: number; shinyChance: number }> = {
  normal: { label: 'ふつうの タマゴ', emoji: '🥚', need: 2, minRarity: 1, shinyChance: 1 / 24 },
  gold: { label: 'きんの タマゴ', emoji: '🌟', need: 3, minRarity: 3, shinyChance: 1 / 8 },
  rainbow: { label: 'にじの タマゴ', emoji: '🌈', need: 4, minRarity: 4, shinyChance: 1 / 3 },
};

export const STAMP_CARD_SIZE = 7;
export const PETTING_DAILY_LIMIT = 25;

export const createProgress = (): PlayerProgress => ({
  version: 1,
  snacks: { candy: 3, apple: 3, cake: 3 },
  stageStars: {},
  stamps: { lastDate: '', count: 0 },
  missions: { date: '', list: [], bonusClaimed: false },
  petting: { date: '', count: 0 },
  egg: null,
  stats: { battlesWon: 0, stagesCleared: 0, shinyFound: 0 },
});

// Fill any missing fields so older or partial saves keep working.
export const normalizeProgress = (raw: unknown): PlayerProgress => {
  const base = createProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<PlayerProgress>;
  return {
    version: 1,
    snacks: { ...base.snacks, ...(r.snacks || {}) },
    stageStars: { ...(r.stageStars || {}) },
    stamps: { ...base.stamps, ...(r.stamps || {}) },
    missions: { ...base.missions, ...(r.missions || {}), list: Array.isArray(r.missions?.list) ? r.missions!.list : [] },
    petting: { ...base.petting, ...(r.petting || {}) },
    egg: r.egg && EGG_INFO[r.egg.tier] ? { tier: r.egg.tier, warmth: r.egg.warmth || 0 } : null,
    stats: { ...base.stats, ...(r.stats || {}) },
  };
};

export const loadProgress = (): PlayerProgress => {
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) return normalizeProgress(JSON.parse(saved));
  } catch (e) {
    console.error('Failed to parse progress', e);
  }
  // First run with v2: carry over the old single egg flag.
  const progress = createProgress();
  try {
    if (localStorage.getItem(LEGACY_EGG_KEY) === 'true') progress.egg = { tier: 'normal', warmth: 0 };
  } catch {
    // storage unavailable: start fresh
  }
  return progress;
};

export const saveProgress = (progress: PlayerProgress) => {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
};

// --- Rewards ---

export const applyReward = (p: PlayerProgress, reward: Reward): PlayerProgress => {
  if (reward.kind === 'snack') {
    return { ...p, snacks: { ...p.snacks, [reward.snack]: p.snacks[reward.snack] + reward.amount } };
  }
  // Only one egg is carried at a time; a better tier replaces a worse one, otherwise it becomes snacks.
  const order: EggTier[] = ['normal', 'gold', 'rainbow'];
  if (!p.egg || order.indexOf(reward.tier) > order.indexOf(p.egg.tier)) {
    return { ...p, egg: { tier: reward.tier, warmth: p.egg?.warmth || 0 } };
  }
  return { ...p, snacks: { candy: p.snacks.candy + 1, apple: p.snacks.apple + 1, cake: p.snacks.cake + 1 } };
};

export const rewardLabel = (reward: Reward) =>
  reward.kind === 'snack'
    ? `${SNACKS[reward.snack].emoji} ${SNACKS[reward.snack].label} ×${reward.amount}`
    : `${EGG_INFO[reward.tier].emoji} ${EGG_INFO[reward.tier].label}`;

// --- Daily stamp card ---

export interface StampResult {
  progress: PlayerProgress;
  stamped: boolean;
  count: number;
  rewards: Reward[];
}

export const claimDailyStamp = (p: PlayerProgress, date: string = todayKey()): StampResult => {
  if (p.stamps.lastDate === date) return { progress: p, stamped: false, count: p.stamps.count, rewards: [] };
  const count = p.stamps.count + 1;
  const rand = seededRandom(simpleHash(`stamp:${date}`));
  const rewards: Reward[] = [{ kind: 'snack', snack: pick(rand, ['candy', 'apple', 'cake'] as SnackType[]), amount: 2 }];
  if (count >= STAMP_CARD_SIZE) rewards.push({ kind: 'egg', tier: 'gold' });
  let next: PlayerProgress = { ...p, stamps: { lastDate: date, count: count >= STAMP_CARD_SIZE ? 0 : count } };
  rewards.forEach(r => { next = applyReward(next, r); });
  return { progress: next, stamped: true, count, rewards };
};

// --- Daily missions ---

interface MissionTemplate {
  kind: MissionKind;
  target: number;
  label: (elementLabel?: string) => string;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  { kind: 'janken_win', target: 5, label: () => 'じゃんけんで 5かい かつ' },
  { kind: 'special', target: 2, label: () => 'とくぎを 2かい つかう' },
  { kind: 'stage_clear', target: 2, label: () => 'ステージを 2かい クリア' },
  { kind: 'stage_clear_element', target: 1, label: (el) => `${el}タイプを つれて クリア` },
  { kind: 'pet', target: 10, label: () => '10かい なでなで する' },
  { kind: 'feed', target: 2, label: () => 'おやつを 2かい あげる' },
  { kind: 'three_star', target: 1, label: () => '★3つで クリア' },
  { kind: 'recruit', target: 1, label: () => 'なかまを 1ぴき ふやす' },
];

export const generateMissions = (date: string): Mission[] => {
  const rand = seededRandom(simpleHash(`missions:${date}`));
  const pool = [...MISSION_TEMPLATES];
  const list: Mission[] = [];
  while (list.length < 3) {
    const t = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    const element = t.kind === 'stage_clear_element' ? pick(rand, ELEMENTS) : undefined;
    list.push({
      id: `${date}-${t.kind}`,
      kind: t.kind,
      label: t.label(element ? `${element.icon}${element.label}` : undefined),
      target: t.target,
      progress: 0,
      claimed: false,
      elementId: element?.id,
      reward: { kind: 'snack', snack: pick(rand, ['candy', 'apple', 'cake'] as SnackType[]), amount: 2 },
    });
  }
  return list;
};

export const ensureTodayMissions = (p: PlayerProgress, date: string = todayKey()): PlayerProgress =>
  p.missions.date === date ? p : { ...p, missions: { date, list: generateMissions(date), bonusClaimed: false } };

const missionAdvance = (m: Mission, e: GameEvent): number => {
  switch (m.kind) {
    case 'janken_win': return e.type === 'janken_win' ? 1 : 0;
    case 'special': return e.type === 'special' ? 1 : 0;
    case 'stage_clear': return e.type === 'stage_clear' ? 1 : 0;
    case 'stage_clear_element': return e.type === 'stage_clear' && !!m.elementId && e.elementIds.includes(m.elementId) ? 1 : 0;
    case 'pet': return e.type === 'pet' ? 1 : 0;
    case 'feed': return e.type === 'feed' ? 1 : 0;
    case 'three_star': return e.type === 'stage_clear' && e.stars >= 3 ? 1 : 0;
    case 'recruit': return e.type === 'recruit' ? 1 : 0;
  }
};

export const recordEvent = (p: PlayerProgress, e: GameEvent, date: string = todayKey()): PlayerProgress => {
  const today = ensureTodayMissions(p, date);
  const list = today.missions.list.map(m => {
    const add = missionAdvance(m, e);
    return add ? { ...m, progress: Math.min(m.target, m.progress + add) } : m;
  });
  const stats = { ...today.stats };
  if (e.type === 'stage_clear') stats.stagesCleared += 1;
  return { ...today, missions: { ...today.missions, list }, stats };
};

export const MISSION_BONUS: Reward = { kind: 'egg', tier: 'normal' };

export const claimMission = (p: PlayerProgress, missionId: string): PlayerProgress => {
  const m = p.missions.list.find(x => x.id === missionId);
  if (!m || m.claimed || m.progress < m.target) return p;
  let next: PlayerProgress = {
    ...p,
    missions: { ...p.missions, list: p.missions.list.map(x => (x.id === missionId ? { ...x, claimed: true } : x)) },
  };
  next = applyReward(next, m.reward);
  if (!next.missions.bonusClaimed && next.missions.list.every(x => x.claimed)) {
    next = applyReward({ ...next, missions: { ...next.missions, bonusClaimed: true } }, MISSION_BONUS);
  }
  return next;
};

export const claimableMissionCount = (p: PlayerProgress) =>
  p.missions.list.filter(m => !m.claimed && m.progress >= m.target).length;

// --- Petting (free, but friendship gain is capped per day) ---

export const registerPetting = (p: PlayerProgress, date: string = todayKey()): { progress: PlayerProgress; counted: boolean } => {
  const count = p.petting.date === date ? p.petting.count : 0;
  if (count >= PETTING_DAILY_LIMIT) return { progress: p, counted: false };
  return { progress: recordEvent({ ...p, petting: { date, count: count + 1 } }, { type: 'pet' }, date), counted: true };
};

// --- Eggs ---

export const warmEgg = (p: PlayerProgress, amount: number): { progress: PlayerProgress; hatchTier: EggTier | null } => {
  if (!p.egg) return { progress: p, hatchTier: null };
  const warmth = p.egg.warmth + amount;
  if (warmth >= EGG_INFO[p.egg.tier].need) return { progress: { ...p, egg: null }, hatchTier: p.egg.tier };
  return { progress: { ...p, egg: { ...p.egg, warmth } }, hatchTier: null };
};

export const eggFromStageClear = (stars: number, stageDifficulty: number): EggTier =>
  stageDifficulty >= 6 ? 'rainbow' : stars >= 3 ? 'gold' : 'normal';
