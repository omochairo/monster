
import { PetProfile, PetElement, GeneratedPet } from "../types";

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

/**
 * Simple string hashing to get a deterministic number from answers
 */
const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Generate the text profile of the pet based on answers using deterministic logic.
 */
export const generatePetProfile = async (answers: string[]): Promise<GeneratedPet> => {
  // Simulate "thinking" delay to build anticipation
  await new Promise(resolve => setTimeout(resolve, 4000));

  const combinedAnswers = answers.join('');
  const profile = generateProfileFromSeedString(combinedAnswers);
  
  return {
    ...profile,
    imageUrl: '', // Will be filled later
    level: 1,
    xp: 0
  };
};

/**
 * Internal logic to generate profile from a seed string.
 * This is separated so we can use it for random generation too.
 */
const generateProfileFromSeedString = (seedString: string, minStats: number = 10, isBoss: boolean = false): PetProfile => {
  const seed = simpleHash(seedString);

  // 1. Determine Name
  let name = "";
  if (isBoss) {
    name = BOSS_NAMES[seed % BOSS_NAMES.length];
  } else {
    const prefix = PET_PREFIXES[seed % PET_PREFIXES.length];
    const suffixSeed = simpleHash(seed.toString());
    const suffix = PET_SUFFIXES[suffixSeed % PET_SUFFIXES.length];
    name = `${prefix}${suffix}`;
  }

  // 2. Determine Text Content
  const pIndex = seed % PERSONALITIES.length;
  const hIndex = (seed + 13) % HABITATS.length;
  const hbIndex = (seed + 7) % HABITS.length;
  const spIndex = (seed + 29) % SUPERPOWERS.length;

  const description = `${PERSONALITIES[pIndex]}${HABITATS[hIndex]}${HABITS[hbIndex]}`;
  const superpower = SUPERPOWERS[spIndex];

  // 3. Determine Element (Type)
  const elementIndex = (seed + 42) % ELEMENTS.length;
  const element = ELEMENTS[elementIndex];

  // 4. Calculate Rarity (Weighted Probability)
  // If boss, force 5
  let rarity = 1;
  if (isBoss) {
    rarity = 5;
  } else {
    const raritySeed = (seed + 99) % 100;
    if (raritySeed > 94) rarity = 5;      // 5% Chance
    else if (raritySeed > 84) rarity = 4; // 10% Chance
    else if (raritySeed > 64) rarity = 3; // 20% Chance
    else if (raritySeed > 34) rarity = 2; // 30% Chance
    else rarity = 1;                      // 35% Chance
  }

  // 5. Generate Stats (Power, Speed, Smarts)
  // Scale stats based on input minStats (Difficulty)
  const power = Math.min(100, Math.max(minStats, minStats + (seed % (100 - minStats))));
  const speed = Math.min(100, Math.max(minStats, minStats + ((seed * 2) % (100 - minStats))));
  const smarts = Math.min(100, Math.max(minStats, minStats + ((seed * 3) % (100 - minStats))));

  const imagePrompt = isBoss ? `BOSS-${name}-${seed}` : `${name}-${seed}`; 

  return {
    name,
    description,
    superpower,
    imagePrompt,
    rarity,
    element,
    stats: {
      power,
      speed,
      smarts
    }
  };
}

/**
 * Generate a completely random pet for battles or wild encounters
 * Accepts difficulty parameters to scale enemy strength
 */
export const generateRandomPet = async (difficulty: number = 1, minStats: number = 10, stageId?: string): Promise<GeneratedPet> => {
  // Check for Fixed Boss Stages
  if (stageId === 'final_star') {
    return {
      name: 'いろパパ',
      description: '最強のパパ。家族を守るために立ちふさがる、優しくも厳しい最後の壁。',
      superpower: '無限の家族愛ビーム',
      imagePrompt: 'iro-papa',
      rarity: 5,
      element: ELEMENTS.find(e => e.id === 'dark') || ELEMENTS[0],
      stats: { power: 95, speed: 85, smarts: 98 },
      imageUrl: '',
      level: 50,
      xp: 0
    };
  }

  if (stageId === 'secret_galaxy') {
    return {
      name: 'いろママ',
      description: '真の裏ボスにして最強のママ。その笑顔の裏には銀河を揺るがすパワーが秘められている。',
      superpower: '絶対的お母さんの威厳',
      imagePrompt: 'iro-mama',
      rarity: 5,
      element: ELEMENTS.find(e => e.id === 'light') || ELEMENTS[0],
      stats: { power: 99, speed: 99, smarts: 99 },
      imageUrl: '',
      level: 99,
      xp: 0
    };
  }

  const randomSeed = Math.random().toString(36).substring(7) + Date.now().toString();
  const isBoss = difficulty === 5;
  const profile = generateProfileFromSeedString(randomSeed, minStats, isBoss);
  
  return {
    ...profile,
    imageUrl: '',
    level: difficulty * 3, // Enemies have levels too roughly
    xp: 0
  };
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
 * Generate the image of the pet using diverse APIs.
 */
export const generatePetImage = async (imagePrompt: string): Promise<string> => {
  // --- SPECIAL BOSS IMAGES ---
  if (imagePrompt === 'iro-papa') {
    return IRO_PAPA_URL;
  }
  if (imagePrompt === 'iro-mama') {
    return IRO_MAMA_URL;
  }

  const hash = simpleHash(imagePrompt);
  
  // Decide the source strategy (15 variations for maximum variety)
  // Replaced unstable sources (Boring Avatars) with reliable DiceBear/RoboHash options
  const strategy = hash % 15;
  const seed = hash.toString();

  switch (strategy) {
    // --- Stable Robots/Monsters/Cats (RoboHash) ---
    case 0: return `https://robohash.org/${seed}.png?set=set4&size=300x300`; // Cats
    case 1: return `https://robohash.org/${seed}.png?set=set2&size=300x300`; // Monsters
    
    // --- DiceBear Collection (Very Stable) ---
    case 2: return `https://api.dicebear.com/9.x/big-ears/svg?seed=${seed}&backgroundColor=transparent`; // Funny Animals
    case 3: return `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}&backgroundColor=transparent`; // People
    case 4: return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${seed}&backgroundColor=transparent`; // Doodles
    case 5: return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}&backgroundColor=transparent`; // Emoji
    case 6: return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}&backgroundColor=transparent`; // Abstract Shapes
    case 7: return `https://api.dicebear.com/9.x/icons/svg?seed=${seed}&backgroundColor=transparent`; // Icons

    // --- REPLACED: Unstable Boring Avatars -> Reliable DiceBear/RoboHash ---
    case 8: return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}&backgroundColor=transparent`; // Abstract Identicon (replaces Beam)
    case 9: return `https://api.dicebear.com/9.x/rings/svg?seed=${seed}&backgroundColor=transparent`;  // Abstract Rings (replaces Marble)
    case 10: return `https://api.dicebear.com/9.x/shapes/svg?seed=${seed}ABC&backgroundColor=transparent`; // Abstract Shapes Var 2 (replaces Sunset)
    case 11: return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=transparent`;// Detailed Avatars (replaces Bauhaus)
    case 12: return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=transparent`; // Notion Style (replaces Ring)
    case 13: return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}&backgroundColor=transparent`;  // Pixel Art (replaces Pixel)

    // --- More RoboHash ---
    case 14: return `https://robohash.org/${seed}.png?set=set5&size=300x300`; // Humans
    
    default: return `https://robohash.org/${seed}.png?set=set4`; // Fallback to Cats
  }
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

    // General Fallback
    const fallbackSet = (imagePrompt.length % 2 === 0) ? 'set4' : 'set2'; 
    return `https://robohash.org/${encodeURIComponent(imagePrompt)}.png?set=${fallbackSet}&size=300x300`;
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

/**
 * Combine two pets into a brand new powerful Fused Pet (まほうの合成)
 */
export const fusePets = async (pet1: GeneratedPet, pet2: GeneratedPet): Promise<GeneratedPet> => {
  const seedString = `${pet1.imagePrompt}-${pet2.imagePrompt}-${Date.now()}`;
  const seed = simpleHash(seedString);

  // Hybrid Name
  const name1Half = pet1.name.slice(0, Math.ceil(pet1.name.length / 2));
  const name2Half = pet2.name.slice(Math.floor(pet2.name.length / 2));
  const fusedName = `超${name1Half}${name2Half}`;

  // Fusion Boosted Stats (+15% bonus)
  const power = Math.min(999, Math.floor((pet1.stats.power + pet2.stats.power) * 0.65));
  const speed = Math.min(999, Math.floor((pet1.stats.speed + pet2.stats.speed) * 0.65));
  const smarts = Math.min(999, Math.floor((pet1.stats.smarts + pet2.stats.smarts) * 0.65));

  // High Rarity
  const rarity = Math.min(5, Math.max(pet1.rarity, pet2.rarity) + 1);

  // Hybrid Element (Chance for Light/Dark or higher level element)
  const elementIndex = (seed + 11) % ELEMENTS.length;
  const element = (rarity === 5 && seed % 2 === 0) 
    ? (ELEMENTS.find(e => e.id === 'light') || ELEMENTS[elementIndex])
    : ELEMENTS[elementIndex];

  const superpower = `超覚醒・${pet1.superpower.split('ことができる')[0]} & ${pet2.superpower}`;
  const description = `【合成モンスター】${pet1.name} と ${pet2.name} の力が合わさって誕生した幻のモンスター！秘められた力は無限大だ。`;
  
  const imagePrompt = `FUSED-${fusedName}-${seed}`;
  const imageUrl = await generatePetImage(imagePrompt);

  return {
    name: fusedName,
    description,
    superpower,
    imagePrompt,
    rarity,
    element,
    stats: { power, speed, smarts },
    imageUrl,
    level: Math.max(pet1.level || 1, pet2.level || 1) + 1,
    xp: 0,
    friendship: 50,
    dateFound: Date.now(),
    isFused: true
  };
};

