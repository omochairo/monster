import React, { useState } from 'react';
import { GeneratedPet } from '../types';
import { PetImage } from './PetImage';
import { Button } from './Button';
import { Star } from 'lucide-react';
import { EGG_INFO, EggTier } from '../services/progress';
import { playLevelUpSound } from '../services/audioService';
import { triggerConfetti } from '../services/confetti';

interface EggModalProps {
  mode: 'found' | 'hatched';
  tier: EggTier;
  pet?: GeneratedPet;
  onClose: () => void;
}

const EGG_STYLE: Record<EggTier, string> = {
  normal: '',
  gold: 'drop-shadow-[0_0_20px_rgba(250,204,21,0.9)]',
  rainbow: 'drop-shadow-[0_0_24px_rgba(236,72,153,0.9)] animate-pulse',
};

export const EggModal: React.FC<EggModalProps> = ({ mode, tier, pet, onClose }) => {
  const [stage, setStage] = useState<'egg' | 'crack' | 'open'>('egg');
  const info = EGG_INFO[tier];

  const handleCrack = () => {
    if (mode === 'found') return;
    if (stage === 'egg') {
      setStage('crack');
      window.setTimeout(() => {
        setStage('open');
        playLevelUpSound();
        if (pet?.shiny || (pet?.rarity || 0) >= 4) triggerConfetti(3000);
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl animate-pop-in relative overflow-hidden">
        <h2 className="text-2xl font-black text-gray-800 mb-1 relative z-10">
          {mode === 'found' ? `${info.label}を みつけた！` : stage === 'open' ? 'タマゴが かえった！' : `${info.label}が…！？`}
        </h2>
        {mode === 'found' && <p className="text-xs font-bold text-gray-400">ステージを {info.need}かい クリアすると うまれるよ</p>}

        <div className="h-60 flex items-center justify-center my-4 cursor-pointer relative z-10" onClick={handleCrack}>
          {stage !== 'open' ? (
            <div className={`text-9xl transition-transform duration-300 ${stage === 'crack' ? 'animate-shake' : 'animate-egg-shake'} ${EGG_STYLE[tier]}`}>
              🥚
              {tier !== 'normal' && <div className="text-4xl -mt-6">{info.emoji}</div>}
            </div>
          ) : pet && (
            <div className="relative animate-pop-in">
              <div className="w-48 h-48 bg-yellow-50 rounded-full flex items-center justify-center shadow-inner">
                <PetImage pet={pet} className="w-44 h-44" />
              </div>
              <Star className="absolute -top-4 -right-4 w-12 h-12 text-yellow-400 fill-yellow-400 animate-spin-slow" />
            </div>
          )}
        </div>

        {stage === 'open' && pet ? (
          <div className="relative z-10 animate-slide-up">
            {pet.shiny && <p className="text-sm font-black text-pink-500 mb-1 animate-bounce">✨ いろちがい！ ✨</p>}
            <p className="text-3xl font-black text-pink-500 mb-1">{pet.name}</p>
            <p className="text-yellow-500 mb-4">{'★'.repeat(pet.rarity)}</p>
            <Button onClick={onClose} size="lg" className="w-full">なかまに なった！</Button>
          </div>
        ) : mode === 'found' ? (
          <Button onClick={onClose} size="lg" className="w-full">やったね！</Button>
        ) : (
          <p className="text-gray-500 font-bold relative z-10">タップして わる！</p>
        )}
      </div>
    </div>
  );
};
