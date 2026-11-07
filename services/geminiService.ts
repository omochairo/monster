
import { PetProfile, PetElement, GeneratedPet, PetStats, Stage } from "../types";
import { simpleHash, seededRandom, pick, randomInt } from "./random";
import { BODY_SHAPES, bodyIndexOf } from "./species";
import { STAT_CAP } from "./growth";

// Note: This file replaces the AI service with local deterministic logic.

// --- Name Generation Data ---
const PET_PREFIXES = [
  'ポコ', 'モコ', 'キラ', 'フワ', 'ピコ', 'ルル', 'ニコ', 'ララ', 'ポン', 'メカ', 'ロボ', 'プチ',
  'ガブ', 'ドロ', 'パチ', 'ユラ', 'コロ', 'チビ', 'デカ', 'ワン', 'ニャ', 'チュ', 'モニ', 'ケロ',
  'ブブ', 'シャ', 'メロ', 'リン', 'ラン', 'ユメ', 'ホシ', 'ソラ', 'ウミ', 'リク', 'ハナ', 'タマ'
];
const PET_SUFFIXES = [
  'まる', 'すけ', 'ちゃん', 'ぴょん', 'ボット', 'っち', 'ベア', 'ゴン', 'ザウルス', 'ロン',
  'キング', 'クイーン', '姫', '太郎', 'の助', 'エモン', 'たん', 'ポン', 'リン', 'ネコ', 'イヌ',
  'バード', 'フィッシュ', 'ムシ', 'ッピー', 'ルン', 'マン', 'ガール', 'ボーイ', '先生', '博士'
];

// --- Boss Data ---
const BOSS_NAMES = ['破壊神ゼウス', '魔王サタン', '銀河龍コスモス', '虚無の王ゼロ', 'メカゴッドΩ'];

// --- Elements ---
export const ELEMENTS: PetElement[] = [
  { id: 'fire', label: 'ほのお', color: 'bg-red-500', icon: '🔥' },
  { id: 'water', label: 'みず', color: 'bg-blue-500', icon: '💧' },
  { id: 'grass', label: 'もり', color: 'bg-green-500', icon: '🌿' },
  { id: 'electric', label: 'かみなり', color: 'bg-yellow-400', icon: '⚡' },
  { id: 'ice', label: 'こおり', color: 'bg-cyan-300', icon: '❄️' },
  { id: 'wind', label: 'かぜ', color: 'bg-teal-400', icon: '🍃' },
  { id: 'light', label: 'ひかり', color: 'bg-orange-300', icon: '✨' },
  { id: 'dark', label: 'やみ', color: 'bg-purple-600', icon: '🌙' },
];

// --- Type Advantages (Pokemon-style Logic) ---
export const TYPE_ADVANTAGES: {[key: string]: string[]} = {
    'fire': ['grass', 'ice', 'wind'],      // Fire burns Grass/Ice/Wind
    'water': ['fire', 'dark'],             // Water douses Fire
    'grass': ['water', 'electric'],        // Grass absorbs Water, resists Electric
    'electric': ['water', 'wind'],         // Electric shocks Water/Wind
    'ice': ['grass', 'wind'],              // Ice freezes Grass/Wind
    'wind': ['grass'],                     // Wind blows Grass
    'light': ['dark'],                     // Light dispels Dark
    'dark': ['light', 'electric']          // Dark overcomes Light
};

// --- Description Components (Mix & Match for ~8000+ combos) ---
const PERSONALITIES = [
  "とっても恥ずかしがり屋だけど、",
  "勇気100倍で、",
  "のんびりお昼寝が大好きで、",
  "いたずらが大好きだけど憎めない、",
  "いつもニコニコ笑っている、",
  "本を読むのが大好きな物知り博士で、",
  "歌を歌うのがとっても上手で、",
  "お掃除好きなきれい好きで、",
  "冒険が大好きなチャレンジャーで、",
  "甘えん坊で寂しがり屋だけど、",
  "とっても早起きが得意で、",
  "夜になると元気になる夜行性で、",
  "おしゃれに気を使っている、",
  "食いしん坊で料理が得意な、",
  "不思議なダンスをいつも踊っている、",
  "みんなの相談に乗ってくれる優しい、",
  "ちょっとドジっ子だけど頑張り屋な、",
  "正義感が強くて頼れる、",
  "クイズを出すのが大好きな、",
  "かくれんぼの達人である、"
];

const HABITATS = [
  "虹の架かる雲の上に住んでいるよ。",
  "誰も知らない地下の秘密基地に住んでいるよ。",
  "深海のクリスタルパレスに住んでいるよ。",
  "星屑が降る宇宙ステーションに住んでいるよ。",
  "お菓子でできた森の中に住んでいるよ。",
  "古びた図書館の本棚の隙間に住んでいるよ。",
  "公園の噴水の中に住んでいるよ。",
  "火山の中のあったかい温泉に住んでいるよ。",
  "未来の都市のビル風に乗って暮らしているよ。",
  "大きなクジラのお腹の中に住んでいるよ。",
  "タンポポの綿毛に乗って旅をしているよ。",
  "コンピューターの中の電子世界に住んでいるよ。",
  "冷蔵庫のプリンの裏に隠れているよ。",
  "砂漠のオアシスの木陰に住んでいるよ。",
  "オーロラの見える雪山に住んでいるよ。",
  "おもちゃ箱の一番下に住んでいるよ。",
  "誰かのポケットの中に住んでいるかもしれないよ。",
  "テレビの裏側の暖かいところに住んでいるよ。",
  "ジャングルの巨大な葉っぱの下に住んでいるよ。",
  "月面クレーターのキャンプ場に住んでいるよ。"
];

const HABITS = [
  "キラキラ光る石を集めるのが趣味なんだ。",
  "雨上がりの水たまりでジャンプするのが日課だよ。",
  "流れ星にお願い事をするのが毎晩の楽しみ。",
  "面白い形の雲を探すのが好きみたい。",
  "どんぐりを埋めて宝の地図を作っているよ。",
  "風の音を録音して音楽を作っているんだ。",
  "困っている人を見ると放っておけないんだ。",
  "美味しいドーナツの穴を覗くのが好き。",
  "影踏み遊びなら誰にも負けないよ。",
  "朝露を集めてジュースを作っているよ。",
  "寝言で明日の天気を予報してくれるよ。",
  "とっておきのジョークを練習しているよ。",
  "四つ葉のクローバーを見つける名人なんだ。",
  "空飛ぶ夢をよく見ているよ。",
  "古い切手を集めて旅の計画を立てているよ。",
  "リボンの結び方を研究しているんだ。",
  "シャボン玉の中に入る練習をしているよ。",
  "迷子の蟻を家まで送ってあげているよ。",
  "にらめっこ遊びが大好き。",
  "世界地図を全部覚えている",
  "ウインクで写真を撮る"
];

// --- Superpowers (100 distinct items) ---
const SUPERPOWERS = [
  "指先から小さな虹を出すことができる",
  "動物の言葉がなんとなくわかる",
  "3秒だけ透明になることができる",
  "なくした物をすぐに見つけることができる",
  "枯れた花を元気にすることができる",
  "美味しいクッキーを焼くことができる",
  "どんな鍵でも開けることができる",
  "風に乗ってふわふわ飛ぶことができる",
  "嫌な夢を食べてくれる",
  "雨雲を吹き飛ばすことができる",
  "石ころを飴玉に変えることができる",
  "魚と一緒に泳ぐことができる",
  "暗闇で目がピカッと光る",
  "超高速で走ることができる",
  "遠くの音を聞くことができる",
  "時間を少しだけ止めることができる",
  "汚れた水をきれいにすることができる",
  "面白い話でみんなを笑わせる",
  "どんな壁でも登ることができる",
  "電気を操ることができる",
  "氷の彫刻を一瞬で作る",
  "本の中に入ることができる",
  "影を自在に操ることができる",
  "テレパシーで会話ができる",
  "どんな言語も話すことができる",
  "重いものを軽々と持ち上げる",
  "未来の天気を当てることができる",
  "土を掘るのがすごく速い",
  "高いところから落ちても平気",
  "水の上を歩くことができる",
  "植物を急成長させる",
  "シャボン玉を割らずに掴める",
  "自分の分身を作ることができる",
  "鏡の世界を行き来できる",
  "匂いで宝物を見つける",
  "手から温かい光を出す",
  "どんな楽器でも演奏できる",
  "折り紙に命を吹き込む",
  "眠っている間に宿題を終わらせる",
  "くしゃみで季節を変える",
  "ビー玉の中に景色を閉じ込める",
  "古い道具を修理する",
  "雲の形を自由に変える",
  "静電気を集めて充電する",
  "絵に描いた食べ物を実体化する",
  "どんなに狭い隙間も通れる",
  "口笛で鳥を呼ぶことができる",
  "足跡から花が咲く",
  "涙を宝石に変える",
  "怖いものを可愛いものに変える",
  "ジャンプで雲に届く",
  "星座を結んで絵を描く",
  "砂のお城を一瞬で作る",
  "貝殻に海の音を録音する",
  "風船を割らずに針を通す",
  "カメレオンのように色を変える",
  "どんなに辛い料理も平気で食べる",
  "瞬きする間に着替える",
  "竜巻を起こしてゴミを掃除する",
  "太陽の光を集めてビームを出す",
  "雪の結晶をコレクションする",
  "地面に潜ってどこでも移動する",
  "磁石のように金属を引き寄せる",
  "紙飛行機をどこまでも飛ばす",
  "迷路を一瞬で解く",
  "相手の考えている色がわかる",
  "くすぐられても絶対に笑わない",
  "どんな結び目もほどく",
  "蜘蛛の糸でハンモックを作る",
  "月と追いかけっこをする",
  "雷をキャッチボールする",
  "霧を出してかくれんぼする",
  "声を変えてモノマネする",
  "ロケットのように発射する",
  "体から甘い香りを出す",
  "どんな乗り物も運転できる",
  "ガラスを震わせて音楽を奏でる",
  "インクを使わずに絵を描く",
  "影の中に隠れる",
  "石像のふりをするのが上手",
  "どんなに遠くても家が見える",
  "サイコロの目を操る",
  "カードマジックが得意",
  "風車を息で回し続ける",
  "水滴をレンズにして遠くを見る",
  "葉っぱの手紙を届ける",
  "どんぐり独楽を永遠に回す",
  "焚き火の色を変える",
  "自分の体を風船のように膨らませる",
  "バリアを張って雨に濡れない",
  "文字を空中に浮かべる",
  "古い地図の続きを描く",
  "時計の針を少し戻す",
  "虹の滑り台を作る",
  "星屑でアクセサリーを作る",
  "あくびでみんなを眠らせる",
  "マシュマロを無限に出す",
  "どんな動物とも仲良くなれる",
  "世界地図を全部覚えている",
  "ウインクで写真を撮る"
];

export interface GenerateOptions {
  statRange?: [number, number];
  isBoss?: boolean;
  elementId?: string;
  bodyIndex?: number;
  minRarity?: number;
  shinyChance?: number;
  rand?: () => number;
}

export const BASE_SHINY_CHANCE = 1 / 24;

const rollRarity = (rand: () => number, minRarity: number) => {
  const r = rand() * 100;
  const rolled = r > 95 ? 5 : r > 85 ? 4 : r > 65 ? 3 : r > 35 ? 2 : 1;
  return Math.max(minRarity, rolled);
};

/**
 * Build a pet profile. With no rand given it is deterministic for the seed string.
 */
export const generateProfileFromSeedString = (seedString: string, opts: GenerateOptions = {}): PetProfile & { bodyIndex: number; shiny: boolean } => {
  const seed = simpleHash(seedString);
  const rand = opts.rand || seededRandom(seed);
  const [minStat, maxStat] = opts.statRange || [20, 40];

  const name = opts.isBoss ? pick(rand, BOSS_NAMES) : `${pick(rand, PET_PREFIXES)}${pick(rand, PET_SUFFIXES)}`;
  const description = `${pick(rand, PERSONALITIES)}${pick(rand, HABITATS)}${pick(rand, HABITS)}`;
  const superpower = pick(rand, SUPERPOWERS);
  const element = ELEMENTS.find(e => e.id === opts.elementId) || pick(rand, ELEMENTS);
  const bodyIndex = typeof opts.bodyIndex === 'number' ? opts.bodyIndex : Math.floor(rand() * BODY_SHAPES.length);
  const rarity = opts.isBoss ? 5 : rollRarity(rand, opts.minRarity || 1);
  const shiny = !opts.isBoss && rand() < (opts.shinyChance ?? BASE_SHINY_CHANCE);

  // Rarity lifts the floor a little so a ★5 feels special.
  const rarityBonus = (rarity - 1) * 3 + (shiny ? 5 : 0);
  const stat = () => Math.min(STAT_CAP, randomInt(rand, minStat, maxStat) + rarityBonus);

  return {
    name,
    description,
    superpower,
    imagePrompt: `${opts.isBoss ? 'BOSS-' : ''}${name}-${seed}`,
    rarity,
    element,
    bodyIndex,
    shiny,
    stats: { power: stat(), speed: stat(), smarts: stat() },
  };
};

// --- Quiz: answers choose the element and the body shape; the individual is new every time ---

const ELEMENT_BY_ANSWERS: Record<string, Record<string, string>> = {
  red: { space: 'light', ocean: 'fire', forest: 'fire' },
  blue: { space: 'dark', ocean: 'water', forest: 'ice' },
  yellow: { space: 'electric', ocean: 'wind', forest: 'grass' },
};

const BODY_BY_ANSWERS: Record<string, Record<string, string>> = {
  outside: { fly: 'bird', talk: 'beast', invisible: 'ghost' },
  draw: { fly: 'dragon', talk: 'bug', invisible: 'blob' },
  book: { fly: 'bird', talk: 'bug', invisible: 'ghost' },
};

const STAT_BY_SNACK: Record<string, keyof PetStats> = { sweet: 'smarts', fruit: 'speed', snack: 'power' };

export const quizTraits = (answerIds: string[]) => {
  const [play, snack, magic, color, place] = answerIds;
  const elementId = ELEMENT_BY_ANSWERS[color]?.[place];
  const bodyId = BODY_BY_ANSWERS[play]?.[magic];
  const bodyIndex = BODY_SHAPES.findIndex(b => b.id === bodyId);
  return { elementId, bodyIndex: bodyIndex >= 0 ? bodyIndex : undefined, favoriteStat: STAT_BY_SNACK[snack] };
};

export const generatePetProfile = async (answerIds: string[]): Promise<GeneratedPet> => {
  // Short "thinking" delay to build anticipation
  await new Promise(resolve => setTimeout(resolve, 2500));

  const traits = quizTraits(answerIds);
  const profile = generateProfileFromSeedString(`${answerIds.join('-')}-${Date.now()}-${Math.random()}`, {
    statRange: [28, 42],
    elementId: traits.elementId,
    bodyIndex: traits.bodyIndex,
    rand: Math.random,
  });
  if (traits.favoriteStat) profile.stats[traits.favoriteStat] += 8;

  return { ...profile, imageUrl: '', level: 1, xp: 0, friendship: 20 };
};

// --- Enemies ---

const BOSS_PROFILES: Record<string, GeneratedPet> = {
  final_star: {
    name: 'いろパパ',
    description: '最強のパパ。家族を守るために立ちふさがる、優しくも厳しい最後の壁。',
    superpower: '無限の家族愛ビーム',
    imagePrompt: 'iro-papa',
    rarity: 5,
    element: ELEMENTS.find(e => e.id === 'dark') || ELEMENTS[0],
    stats: { power: 135, speed: 120, smarts: 140 },
    imageUrl: '',
    level: 50,
    xp: 0,
  },
  secret_galaxy: {
    name: 'いろママ',
    description: '真の裏ボスにして最強のママ。その笑顔の裏には銀河を揺るがすパワーが秘められている。',
    superpower: '絶対的お母さんの威厳',
    imagePrompt: 'iro-mama',
    rarity: 5,
    element: ELEMENTS.find(e => e.id === 'light') || ELEMENTS[0],
    stats: { power: 175, speed: 170, smarts: 175 },
    imageUrl: '',
    level: 99,
    xp: 0,
  },
};

/**
 * Generate an enemy for a stage wave. The last wave is the stage boss.
 */
export const generateEnemy = (stage: Stage, wave: number): GeneratedPet => {
  const isLastWave = wave >= stage.waves - 1;
  if (isLastWave && BOSS_PROFILES[stage.id]) {
    const boss = BOSS_PROFILES[stage.id];
    return { ...boss, imageUrl: generatePetImage(boss.imagePrompt), isBoss: true };
  }
  const [min, max] = stage.enemyStats;
  const bossBoost = isLastWave ? Math.round((max - min) * 0.5) : 0;
  const profile = generateProfileFromSeedString(`${stage.id}-${wave}-${Date.now()}-${Math.random()}`, {
    statRange: [min + bossBoost, max + bossBoost],
    rand: Math.random,
    isBoss: isLastWave && stage.difficultyLevel >= 5,
  });
  return {
    ...profile,
    imageUrl: '',
    level: Math.max(1, Math.round(min / 6)) + (isLastWave ? 3 : 0),
    xp: 0,
    isBoss: isLastWave,
  };
};

/**
 * Hatch a pet from an egg. Better eggs give rarer pets and more shinies.
 */
export const generateEggPet = (minRarity: number, shinyChance: number): GeneratedPet => {
  const profile = generateProfileFromSeedString(`egg-${Date.now()}-${Math.random()}`, {
    statRange: [30, 45],
    minRarity,
    shinyChance,
    rand: Math.random,
  });
  return { ...profile, imageUrl: '', level: 1, xp: 0, friendship: 30, dateFound: Date.now() };
};

// --- CUSTOM BOSS IMAGES ---
const IRO_PAPA_URL = 'https://omcha.jp/wp-content/uploads/2025/11/iropapa.jpeg';
const IRO_MAMA_URL = 'https://omcha.jp/wp-content/uploads/2025/11/iromama.jpeg';

// --- ROBUST FALLBACK SVGS (EMBEDDED DATA) ---
// These ensure that even if the external URL fails, we NEVER show a robot.

// Papa: Suit, Glasses, Short Hair
const IRO_PAPA_SVG_DATA = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%20style%3D%22background%3A%23f4f4f9%22%3E%3Cpath%20d%3D%22M144%20144s0-64%20112-64%20112%2064%20112%2064v64h-224z%22%20fill%3D%22%23594036%22%2F%3E%3Cpath%20d%3D%22M160%20144v112c0%2053%2043%2096%2096%2096s96-43%2096-96V144%22%20fill%3D%22%23f3d0b1%22%2F%3E%3Cg%20fill%3D%22%23333%22%3E%3Ccircle%20cx%3D%22208%22%20cy%3D%22240%22%20r%3D%2216%22%2F%3E%3Ccircle%20cx%3D%22304%22%20cy%3D%22240%22%20r%3D%2216%22%2F%3E%3Cpath%20d%3D%22M176%20240h64m32%200h64%22%20stroke%3D%22%23333%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M224%20304q32%2032%2064%200%22%20fill%3D%22none%22%20stroke%3D%22%23c0392b%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M128%20352l128%20160%20128-160v160H128z%22%20fill%3D%22%2334495e%22%2F%3E%3Cpath%20d%3D%22M256%20352l-32%20160h64z%22%20fill%3D%22%23ecf0f1%22%2F%3E%3C%2Fsvg%3E`;

// Mama: Long Hair, Smile
const IRO_MAMA_SVG_DATA = `data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20512%20512%22%20style%3D%22background%3A%23fff0f5%22%3E%3Cpath%20d%3D%22M128%20128c0-64%2064-96%20128-96s128%2032%20128%2096v256c0%2032-32%2064-64%2064H192c-32%200-64-32-64-64V128z%22%20fill%3D%22%238e44ad%22%2F%3E%3Cpath%20d%3D%22M160%20144v112c0%2053%2043%2096%2096%2096s96-43%2096-96V144%22%20fill%3D%22%23ffdec8%22%2F%3E%3Cg%20fill%3D%22%23333%22%3E%3Ccircle%20cx%3D%22208%22%20cy%3D%22240%22%20r%3D%2216%22%2F%3E%3Ccircle%20cx%3D%22304%22%20cy%3D%22240%22%20r%3D%2216%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M208%20304q48%2048%2096%200%22%20fill%3D%22none%22%20stroke%3D%22%23e91e63%22%20stroke-width%3D%228%22%20stroke-linecap%3D%22round%22%2F%3E%3Cpath%20d%3D%22M128%20400q128%2064%20256%200v112H128z%22%20fill%3D%22%23f1c40f%22%2F%3E%3C%2Fsvg%3E`;

/**
 * Photo for the family bosses. Every other monster is drawn locally by MonsterArt, so this returns ''.
 */
export const generatePetImage = (imagePrompt: string): string => {
  if (imagePrompt === 'iro-papa') return IRO_PAPA_URL;
  if (imagePrompt === 'iro-mama') return IRO_MAMA_URL;
  return '';
};

/**
 * Calculates a safe fallback image if the primary one fails.
 * Crucial for Bosses to not turn into robots.
 */
export const getFallbackImageUrl = (imagePrompt: string): string => {
    // Special Boss Fallbacks - Use EMBEDDED SVG DATA
    // This is 100% reliable as it doesn't require an external network request.
    if (imagePrompt === 'iro-papa') {
        return IRO_PAPA_SVG_DATA;
    }
    if (imagePrompt === 'iro-mama') {
        return IRO_MAMA_SVG_DATA;
    }

    return '';
};

/**
 * Calculates Type Advantage Multiplier
 * Returns 1.5 for Advantage, 0.8 for Disadvantage, 1.0 for Neutral
 */
export const calculateTypeMultiplier = (attackerId: string, defenderId: string): number => {
  if (TYPE_ADVANTAGES[attackerId]?.includes(defenderId)) {
    return 1.5; // Super effective
  }
  
  // Check reverse for not effective
  if (TYPE_ADVANTAGES[defenderId]?.includes(attackerId)) {
    return 0.8; // Not very effective
  }

  return 1.0;
};

export const FUSION_MIN_LEVEL = 5;

const stripFusedMark = (name: string) => name.replace(/^超+/, '');

/**
 * Combine two pets into a new one (まほうの合成).
 * The first pet gives the body shape and the second the element, so children can aim at a missing species.
 */
export const fusePets = (pet1: GeneratedPet, pet2: GeneratedPet): GeneratedPet => {
  const seed = simpleHash(`${pet1.imagePrompt}-${pet2.imagePrompt}-${Date.now()}`);
  const n1 = stripFusedMark(pet1.name);
  const n2 = stripFusedMark(pet2.name);
  const fusedName = `超${n1.slice(0, Math.ceil(n1.length / 2))}${n2.slice(Math.floor(n2.length / 2))}`;

  const best = (k: keyof PetStats) => Math.min(STAT_CAP, Math.floor(Math.max(pet1.stats[k], pet2.stats[k]) * 1.1));
  const rarity = Math.min(5, Math.max(pet1.rarity, pet2.rarity) + 1);
  const rand = seededRandom(seed);

  return {
    name: fusedName,
    description: `【合成モンスター】${pet1.name} と ${pet2.name} の力が合わさって誕生した幻のモンスター！`,
    superpower: pick(rand, [pet1.superpower, pet2.superpower]),
    imagePrompt: `FUSED-${fusedName}-${seed}`,
    rarity,
    element: pet2.element,
    bodyIndex: bodyIndexOf(pet1),
    shiny: !!(pet1.shiny || pet2.shiny) || rand() < BASE_SHINY_CHANCE,
    stats: { power: best('power'), speed: best('speed'), smarts: best('smarts') },
    imageUrl: '',
    level: 1,
    xp: 0,
    friendship: 50,
    dateFound: Date.now(),
    isFused: true,
  };
};
