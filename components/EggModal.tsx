import React, { useState, useEffect } from 'react';
import { GeneratedPet } from '../types';
import { PetImage } from './PetImage';
import { Button } from './Button';
import { Star } from 'lucide-react';

interface EggModalProps {
  mode: 'found' | 'hatched';
  pet?: GeneratedPet;
  onClose: () => void;
}

export const EggModal: React.FC<EggModalProps> = ({ mode, pet, onClose }) => {
  const [stage, setStage] = useState<'egg' | 'crack' | 'open'>('egg');

  useEffect(() => {
    if (mode === 'hatched') {
      // Start as egg
      setStage('egg');
    } else {
      // Just showing found egg
      setStage('egg');
    }
  }, [mode]);

  const handleCrack = () => {
    if (mode === 'found') {
      onClose();
      return;
    }
    
    if (stage === 'egg') {
      setStage('crack');
      setTimeout(() => setStage('open'), 1000);
    } else if (stage === 'open') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl animate-pop-in relative overflow-hidden">
        
        {/* Background Rays */}
        <div className="absolute inset-[-50%] opacity-10 animate-spin-slow text-yellow-500 pointer-events-none">
             <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
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

        <h2 className="text-2xl font-black text-gray-800 mb-6 relative z-10">
          {mode === 'found' ? 'タマゴを みつけた！' : stage === 'open' ? 'タマゴが かえった！' : 'タマゴが...！？'}
        </h2>

        <div 
          className="h-64 flex items-center justify-center mb-6 cursor-pointer relative z-10"
          onClick={handleCrack}
        >
          {stage !== 'open' ? (
            <div className={`text-9xl transition-transform duration-300 ${stage === 'crack' ? 'animate-shake' : 'animate-egg-shake'}`}>
              🥚
            </div>
          ) : (
             <div className="relative animate-pop-in">
                {pet && (
                    <>
                      <div className="w-48 h-48 bg-yellow-50 rounded-full flex items-center justify-center mb-2 shadow-inner">
                          <PetImage 
                            src={pet.imageUrl} 
                            prompt={pet.imagePrompt} 
                            alt={pet.name} 
                            className="w-40 h-40 object-contain"
                          />
                      </div>
                      <div className="absolute -top-4 -right-4">
                         <Star className="w-12 h-12 text-yellow-400 fill-yellow-400 animate-spin-slow" />
                      </div>
                    </>
                )}
             </div>
          )}
        </div>

        {stage === 'open' && pet ? (
          <div className="relative z-10 animate-slide-up">
            <p className="text-lg font-bold text-gray-600 mb-1">新しい仲間！</p>
            <p className="text-3xl font-black text-pink-500 mb-6">{pet.name}</p>
            <Button onClick={onClose} size="lg" className="w-full">
              OK！
            </Button>
          </div>
        ) : (
           <div className="relative z-10">
              <p className="text-gray-500 font-bold mb-6">
                {mode === 'found' ? '次の冒険から帰ってきたら\n生まれるかも...？' : 'タップして わる！'}
              </p>
              {mode === 'found' && (
                  <Button onClick={onClose} size="lg" className="w-full">
                    やったね！
                  </Button>
              )}
           </div>
        )}

      </div>
    </div>
  );
};