
import React from 'react';
import { GeneratedPet } from '../types';
import { Button } from './Button';
import { Share2, RefreshCw, Star, Zap, Activity, Brain, Flame } from 'lucide-react';
import { PetImage } from './PetImage';
import { speciesOf } from '../services/species';

interface ResultScreenProps {
  pet: GeneratedPet;
  isNewSpecies?: boolean;
  onReset: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ pet, isNewSpecies, onReset }) => {
  const species = speciesOf(pet);
  // Determine gradient based on element
  const elementGradient = {
    fire: 'from-orange-100 via-red-50 to-yellow-50',
    water: 'from-blue-100 via-cyan-50 to-white',
    grass: 'from-green-100 via-emerald-50 to-yellow-50',
    electric: 'from-yellow-100 via-amber-50 to-white',
    ice: 'from-cyan-100 via-sky-50 to-white',
    wind: 'from-teal-100 via-emerald-50 to-white',
    light: 'from-yellow-100 via-orange-50 to-white',
    dark: 'from-purple-100 via-slate-50 to-white',
  }[pet.element.id] || 'from-indigo-50 via-purple-50 to-pink-100';

  const isLegendary = pet.rarity === 5;
  const isRare = pet.rarity >= 4;

  // Generate some random positions for confetti
  const confettiPieces = isRare ? [...Array(30)].map((_, i) => ({
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    backgroundColor: ['#ffd700', '#ff69b4', '#00bfff', '#ff4500'][Math.floor(Math.random() * 4)]
  })) : [];

  return (
    <div className="w-full max-w-lg mx-auto p-4 pb-20 overflow-hidden">
      
      {/* Confetti Effect for Rare/Legendary */}
      {isRare && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
           {confettiPieces.map((style, i) => (
             <div key={i} className="confetti" style={style}></div>
           ))}
        </div>
      )}

      {/* Celebration Overlay for Legendary */}
      {isLegendary && (
        <div className="fixed inset-0 pointer-events-none flex justify-center overflow-hidden z-40">
           <div className="absolute top-0 animate-pulse text-6xl opacity-50">✨</div>
           <div className="absolute top-10 left-10 animate-bounce text-4xl text-yellow-400">★</div>
           <div className="absolute top-20 right-20 animate-spin-slow text-4xl text-yellow-400">★</div>
        </div>
      )}

      <div className={`bg-white rounded-[2rem] shadow-xl overflow-hidden border-4 animate-pop-in ${isLegendary ? 'border-yellow-400 ring-4 ring-yellow-200' : 'border-white'}`}>
        {/* Header Badge */}
        <div className="bg-gray-800 text-white px-6 py-2 flex justify-between items-center z-20 relative">
            <div className={`flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-sm text-gray-800 ${pet.element.color}`}>
               <span>{pet.element.icon}</span>
               <span>{pet.element.label}</span>
            </div>
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`w-4 h-4 ${i < pet.rarity ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} 
                    />
                ))}
            </div>
        </div>

        {/* Image Container with Sunburst */}
        <div className={`relative aspect-square bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] ${elementGradient} overflow-hidden flex items-center justify-center`}>
          
          {/* Sunburst Background Effect for high rarity */}
          {pet.rarity >= 3 && (
            <div className={`absolute inset-[-50%] opacity-20 animate-spin-slow ${isLegendary ? 'text-yellow-400' : 'text-white'}`}>
              <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(0 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(30 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(60 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(90 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(120 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(150 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(180 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(210 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(240 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(270 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(300 50 50)" />
                <path d="M50 50 L50 0 L55 0 Z" transform="rotate(330 50 50)" />
              </svg>
            </div>
          )}

          <PetImage
            pet={pet} 
            alt={pet.name}
            className={`relative z-10 w-full h-full object-contain p-6 drop-shadow-xl ${isLegendary ? 'animate-bounce-hover' : ''}`}
          />
          
          {/* Rarity Label */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-4 flex justify-center z-20">
             <span className={`inline-block px-6 py-1.5 rounded-full text-base font-black shadow-lg transform ${
                 isLegendary ? 'bg-yellow-400 text-yellow-900 animate-pulse scale-110' : 
                 pet.rarity >= 4 ? 'bg-pink-500 text-white' : 
                 pet.rarity >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
             }`}>
                {isLegendary ? '★ レジェンド ★' : pet.rarity >= 4 ? '★ ゲキレア！ ★' : pet.rarity >= 3 ? '★ レア ★' : 'ふつう'}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 relative bg-white">
          <div className="flex justify-center gap-2 mb-2 flex-wrap">
            {isNewSpecies && <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full animate-bounce">NEW！ あたらしい しゅぞく</span>}
            {pet.shiny && <span className="bg-pink-500 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse">✨ いろちがい ✨</span>}
          </div>
          <h2 className="text-3xl font-black text-gray-800 mb-1 text-center tracking-tight">
            {pet.name}
          </h2>
          <p className="text-center text-xs font-bold text-gray-400 mb-6">
            ずかん No.{String(species.no).padStart(3, '0')} ・ {species.body.label}タイプ × {pet.element.icon}{pet.element.label}
          </p>

          <div className="space-y-6">
            {/* Stats Bars */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                        <Flame className="w-5 h-5 fill-current" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                            <span>パワー</span>
                            <span>{pet.stats.power}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, pet.stats.power)}%` }}></div>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                            <span>スピード</span>
                            <span>{pet.stats.speed}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, pet.stats.speed)}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                        <Brain className="w-5 h-5 fill-current" />
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
                            <span>かしこさ</span>
                            <span>{pet.stats.smarts}</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, pet.stats.smarts)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Description & Superpower */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold">
                <Zap className="w-5 h-5 fill-current" />
                <span>とくぎ</span>
              </div>
              <p className="text-gray-700 font-medium">{pet.superpower}</p>
            </div>

            <div className="bg-pink-50 p-4 rounded-xl border border-pink-100">
              <p className="text-gray-700 leading-relaxed font-medium">
                {pet.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button onClick={onReset} size="lg" className="shadow-pink-300">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5" />
            もういっかい あそぶ
          </div>
        </Button>
        
        {navigator.share && (
            <Button variant="secondary" size="lg" onClick={() => {
                const shareText = `5つの質問で性格がわかる子供向け診断ゲーム「ふしぎなペットメーカー」で遊んだよ！\n\n私だけのペット：${pet.name}\nレア度：★${pet.rarity}\nタイプ：${pet.element.label}\nとくぎ：${pet.superpower}\n\n${pet.description}\n\n#ふしぎなペットメーカー`;
                navigator.share({
                    title: `【ふしぎなペットメーカー】私のペットは「${pet.name}」！`,
                    text: shareText,
                    url: window.location.href
                }).catch(() => {});
            }}>
            <div className="flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5" />
                お友だちにおしえる
            </div>
            </Button>
        )}
      </div>
    </div>
  );
};
