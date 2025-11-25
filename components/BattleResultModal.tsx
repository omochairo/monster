
import React from 'react';
import { GeneratedPet } from '../types';
import { Button } from './Button';
import { Star, ArrowRight, UserPlus, Home, RotateCcw, Zap, Skull } from 'lucide-react';
import { PetImage } from './PetImage';

interface BattleResultModalProps {
  result: 'win' | 'lose';
  enemyPet: GeneratedPet;
  xpGained: number;
  onRecruit?: () => void;
  onNextBattle?: () => void;
  onRetry?: () => void;
  onExit: () => void;
  isRecruited: boolean;
}

export const BattleResultModal: React.FC<BattleResultModalProps> = ({
  result,
  enemyPet,
  xpGained,
  onRecruit,
  onNextBattle,
  onRetry,
  onExit,
  isRecruited
}) => {
  const isWin = result === 'win';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`
        w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-pop-in
        ${isWin ? 'border-4 border-yellow-400 ring-4 ring-yellow-200/50' : 'border-4 border-gray-600 ring-4 ring-gray-400/50'}
      `}>
        
        {/* Header */}
        <div className={`p-6 text-center relative overflow-hidden ${isWin ? 'bg-yellow-400' : 'bg-gray-800'}`}>
          {isWin && (
            <div className="absolute inset-0 opacity-20 animate-spin-slow">
               <svg viewBox="0 0 100 100" className="w-full h-full fill-white">
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(0 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(45 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(90 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(135 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(180 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(225 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(270 50 50)" />
                  <path d="M50 50 L50 0 L55 0 Z" transform="rotate(315 50 50)" />
               </svg>
            </div>
          )}
          
          <h2 className={`text-4xl font-black italic tracking-tighter relative z-10 ${isWin ? 'text-yellow-900' : 'text-gray-400'}`}>
            {isWin ? 'VICTORY!' : 'DEFEAT...'}
          </h2>
          {isWin && (
             <div className="flex justify-center gap-1 mt-2 relative z-10">
               <Star className="w-6 h-6 text-white fill-white animate-bounce" style={{ animationDelay: '0s' }} />
               <Star className="w-8 h-8 text-white fill-white animate-bounce" style={{ animationDelay: '0.1s' }} />
               <Star className="w-6 h-6 text-white fill-white animate-bounce" style={{ animationDelay: '0.2s' }} />
             </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 bg-white space-y-6">
          
          {/* XP Reward Badge */}
          <div className="flex justify-center">
             <div className="bg-blue-50 border-2 border-blue-200 px-6 py-2 rounded-full flex items-center gap-2 shadow-sm">
                <span className="text-xs font-bold text-gray-500">報酬</span>
                <div className="w-px h-4 bg-blue-200"></div>
                <div className="flex items-center gap-1">
                   <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                   <span className="text-xl font-black text-gray-800">+{xpGained} XP</span>
                </div>
             </div>
          </div>

          {/* Enemy Info (if recruited or just context) */}
          <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
             <div className={`w-12 h-12 rounded-full ${enemyPet.element.color} p-0.5 shrink-0`}>
                <div className="w-full h-full bg-white rounded-full overflow-hidden">
                   <PetImage src={enemyPet.imageUrl} prompt={enemyPet.imagePrompt} alt="enemy" className="w-full h-full object-contain" />
                </div>
             </div>
             <div>
                <div className="text-xs text-gray-400 font-bold">対戦あいて</div>
                <div className="font-bold text-gray-700">{enemyPet.name}</div>
             </div>
             {isWin && onRecruit && (
                 <div className="ml-auto">
                    {isRecruited ? (
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-full border border-green-200">
                           仲間にした！
                        </span>
                    ) : (
                        <button 
                          onClick={onRecruit}
                          className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-sm"
                        >
                           <UserPlus className="w-3 h-3" />
                           仲間にする
                        </button>
                    )}
                 </div>
             )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {isWin && onNextBattle ? (
              <Button onClick={onNextBattle} size="lg" className="w-full shadow-orange-200 bg-gradient-to-r from-orange-400 to-red-500 border-none text-white">
                 <div className="flex items-center justify-center gap-2">
                   <span>つぎのバトルへ</span>
                   <ArrowRight className="w-5 h-5" />
                 </div>
              </Button>
            ) : onRetry ? (
              <Button onClick={onRetry} size="lg" className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                <div className="flex items-center justify-center gap-2">
                   <RotateCcw className="w-5 h-5" />
                   <span>もういちど ちょうせん</span>
                </div>
              </Button>
            ) : null}

            <Button onClick={onExit} variant="secondary" size="md" className="w-full border-gray-200">
               <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Home className="w-4 h-4" />
                  <span>まちへ もどる</span>
               </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
