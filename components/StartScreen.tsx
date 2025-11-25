import React from 'react';
import { Button } from './Button';
import { Sparkles, BookOpen, Swords } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
  onOpenCollection: () => void;
  onStartBattle: () => void;
  collectionCount: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({ 
  onStart, 
  onOpenCollection, 
  onStartBattle,
  collectionCount 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
      <div className="mb-6 bg-white p-6 rounded-full shadow-xl shadow-pink-100 ring-4 ring-pink-200 relative group cursor-pointer hover:scale-110 transition-transform">
        <Sparkles className="w-20 h-20 text-yellow-400 animate-pulse" />
        <div className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          NEW!
        </div>
      </div>
      
      <h1 className="text-4xl md:text-5xl font-black text-gray-800 mb-4 tracking-tight drop-shadow-sm">
        <span className="text-pink-500">おもちゃいろ</span><br/>
        モンスター図鑑
      </h1>
      
      <p className="text-lg text-gray-600 mb-8 max-w-md leading-relaxed">
        5つの しつもんに こたえるだけで<br/>
        キミだけの モンスターが みつかるよ！
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Main Quiz Button */}
        <Button onClick={onStart} size="lg" className="animate-bounce-hover relative overflow-hidden">
          <span className="relative z-10">あたらしく つくる</span>
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </Button>

        {/* Battle Button (New Feature) */}
        <Button 
          onClick={onStartBattle} 
          variant="primary"
          className="bg-gradient-to-r from-orange-400 to-red-500 border-orange-300 shadow-orange-200"
          size="lg"
        >
          <div className="flex items-center justify-center gap-2">
            <Swords className="w-6 h-6" />
            <span>たんけんに いく</span>
          </div>
        </Button>

        {/* Collection Button */}
        <Button onClick={onOpenCollection} variant="secondary" size="md">
          <div className="flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>モンスター図鑑 ({collectionCount})</span>
          </div>
        </Button>
      </div>

      {collectionCount === 0 && (
        <p className="mt-6 text-sm text-gray-400 bg-white/50 px-4 py-2 rounded-full">
          まずは 「あたらしく つくる」 で<br/>パートナーを みつけよう！
        </p>
      )}
    </div>
  );
};