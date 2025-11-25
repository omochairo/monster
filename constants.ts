
import { Question, Stage } from './types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "おやすみのひ、なにをしてあそぶ？",
    options: [
      { id: 'outside', label: 'おそとで はしりまわる', emoji: '🏃', color: 'bg-orange-100 border-orange-300' },
      { id: 'draw', label: 'おえかき・こうさく', emoji: '🎨', color: 'bg-blue-100 border-blue-300' },
      { id: 'book', label: 'えほんを よむ', emoji: '📚', color: 'bg-green-100 border-green-300' },
    ]
  },
  {
    id: 2,
    text: "すきな おやつは なあに？",
    options: [
      { id: 'sweet', label: 'あまい ケーキ', emoji: '🍰', color: 'bg-pink-100 border-pink-300' },
      { id: 'fruit', label: 'つめたい フルーツ', emoji: '🍇', color: 'bg-purple-100 border-purple-300' },
      { id: 'snack', label: 'サクサク おせんべい', emoji: '🍘', color: 'bg-yellow-100 border-yellow-300' },
    ]
  },
  {
    id: 3,
    text: "もし まほうが つかえたら？",
    options: [
      { id: 'fly', label: 'おそらを とぶ', emoji: '✈️', color: 'bg-sky-100 border-sky-300' },
      { id: 'talk', label: 'どうぶつと おはなし', emoji: '🐶', color: 'bg-lime-100 border-lime-300' },
      { id: 'invisible', label: 'とうめいに なる', emoji: '👻', color: 'bg-indigo-100 border-indigo-300' },
    ]
  },
  {
    id: 4,
    text: "きになる いろは どれ？",
    options: [
      { id: 'red', label: 'あかるい あか', emoji: '❤️', color: 'bg-red-100 border-red-300' },
      { id: 'blue', label: 'すずしい あお', emoji: '💙', color: 'bg-blue-100 border-blue-300' },
      { id: 'yellow', label: 'げんきな きいろ', emoji: '💛', color: 'bg-yellow-100 border-yellow-300' },
    ]
  },
  {
    id: 5,
    text: "ぼうけん するなら どこがいい？",
    options: [
      { id: 'space', label: 'キラキラ うちゅう', emoji: '🚀', color: 'bg-slate-100 border-slate-300' },
      { id: 'ocean', label: 'ひろーい うみ', emoji: '🌊', color: 'bg-cyan-100 border-cyan-300' },
      { id: 'forest', label: 'ふしぎな もり', emoji: '🌳', color: 'bg-emerald-100 border-emerald-300' },
    ]
  }
];

export const LOADING_MESSAGES = [
  "まほうの杖を ふっています...",
  "タマゴを あたためています...",
  "どんな お名前にしようかな...",
  "お絵かきを しています...",
  "もうすぐ 会えるよ！"
];

export const STAGES: Stage[] = [
  {
    id: 'town',
    name: 'はじまりの町',
    description: 'よわい敵がおおいよ。れんしゅうにピッタリ！',
    emoji: '🏠',
    difficultyLevel: 1,
    minStats: 10,
    bgGradient: 'from-blue-100 to-green-100',
    requiredCollectionCount: 0
  },
  {
    id: 'forest',
    name: '迷いの森',
    description: 'ちょっと強い敵がいるかも。気をつけて！',
    emoji: '🌲',
    difficultyLevel: 2,
    minStats: 30,
    bgGradient: 'from-green-200 to-emerald-300',
    requiredCollectionCount: 0
  },
  {
    id: 'volcano',
    name: '灼熱の火山',
    description: '強敵ばかり！属性を考えて戦おう。',
    emoji: '🌋',
    difficultyLevel: 3,
    minStats: 50,
    bgGradient: 'from-orange-200 to-red-400',
    requiredCollectionCount: 0
  },
  {
    id: 'space',
    name: '果ての宇宙',
    description: '未知の強さが待っている...！',
    emoji: '🌌',
    difficultyLevel: 4,
    minStats: 70,
    bgGradient: 'from-indigo-300 to-purple-500',
    requiredCollectionCount: 0
  },
  {
    id: 'final_star',
    name: '最後の星',
    description: 'ラスボス「いろパパ」が まっている...！',
    emoji: '👔',
    difficultyLevel: 5,
    minStats: 90,
    bgGradient: 'from-gray-800 via-gray-900 to-black',
    requiredCollectionCount: 10
  },
  {
    id: 'secret_galaxy',
    name: '秘密の楽園',
    description: '真の最強ボス「いろママ」に いどめ！',
    emoji: '👑',
    difficultyLevel: 6,
    minStats: 100,
    bgGradient: 'from-pink-300 via-purple-300 to-indigo-400',
    requiredCollectionCount: 15
  }
];
