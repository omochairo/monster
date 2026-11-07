import React from 'react';
import { Button } from './Button';
import { Sparkles, BookOpen, Swords, Gift } from 'lucide-react';
import { EGG_INFO, PlayerProgress, claimableMissionCount } from '../services/progress';
import { SPECIES_COUNT } from '../services/species';

interface StartScreenProps {
  onStart: () => void;
  onOpenCollection: () => void;
  onStartBattle: () => void;
  onOpenDaily: () => void;
  collectionCount: number;
  speciesCount: number;
  progress: PlayerProgress;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStart,
  onOpenCollection,
  onStartBattle,
  onOpenDaily,
  collectionCount,
  speciesCount,
  progress,
}) => {
  const claimable = claimableMissionCount(progress);
  const missionsLeft = progress.missions.list.filter(m => !m.claimed).length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4 animate-fade-in">
      <div className="mb-5 bg-white p-6 rounded-full shadow-xl shadow-pink-100 ring-4 ring-pink-200 relative">
        <Sparkles className="w-20 h-20 text-yellow-400 animate-pulse" />
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-3 tracking-tight drop-shadow-sm">
        <span className="text-pink-500">おもちゃいろ</span><br />
        モンスター図鑑
      </h1>

      <p className="text-lg text-gray-600 mb-6 max-w-md leading-relaxed">
        5つの しつもんに こたえるだけで<br />
        キミだけの モンスターが みつかるよ！
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Daily: stamp, missions, items */}
        <button onClick={onOpenDaily}
          className="relative bg-gradient-to-r from-yellow-300 to-amber-400 rounded-2xl px-4 py-3 shadow-lg border-b-4 border-amber-500 flex items-center gap-3 text-left active:translate-y-0.5 transition">
          <Gift className="w-8 h-8 text-white drop-shadow" />
          <div className="flex-1">
            <div className="font-black text-amber-900">きょうの おたのしみ</div>
            <div className="text-[11px] font-bold text-amber-800">
              スタンプ {progress.stamps.count}/7 ・ ミッション のこり {missionsLeft}
              {progress.egg && ` ・ ${EGG_INFO[progress.egg.tier].emoji}${progress.egg.warmth}/${EGG_INFO[progress.egg.tier].need}`}
            </div>
          </div>
          {claimable > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center animate-bounce">{claimable}</span>
          )}
        </button>

        <Button onClick={onStart} size="lg" className="animate-bounce-hover relative overflow-hidden">
          <span className="relative z-10">あたらしく つくる</span>
        </Button>

        <Button onClick={onStartBattle} variant="primary" className="bg-gradient-to-r from-orange-400 to-red-500 border-orange-300 shadow-orange-200" size="lg">
          <div className="flex items-center justify-center gap-2">
            <Swords className="w-6 h-6" />
            <span>たんけんに いく</span>
          </div>
        </Button>

        <Button onClick={onOpenCollection} variant="secondary" size="md">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>モンスター図鑑 {speciesCount}/{SPECIES_COUNT}</span>
          </div>
        </Button>
      </div>

      {collectionCount === 0 && (
        <p className="mt-6 text-sm text-gray-400 bg-white/50 px-4 py-2 rounded-full">
          まずは 「あたらしく つくる」 で<br />パートナーを みつけよう！
        </p>
      )}
    </div>
  );
};
