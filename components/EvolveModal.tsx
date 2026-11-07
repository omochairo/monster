import React, { useEffect, useRef, useState } from 'react';
import { GeneratedPet } from '../types';
import { Button } from './Button';
import { PetImage } from './PetImage';
import { displayName } from '../services/growth';
import { FORM_LEVELS } from '../services/species';
import { playFusionSound, playLevelUpSound } from '../services/audioService';
import { triggerConfetti } from '../services/confetti';

interface EvolveModalProps {
  pet: GeneratedPet; // already evolved
  onClose: () => void;
}

// "...!?" -> flashing between forms -> the new form. Tapping skips ahead.
export const EvolveModal: React.FC<EvolveModalProps> = ({ pet, onClose }) => {
  const [step, setStep] = useState<'before' | 'flash' | 'after'>('before');
  const [flip, setFlip] = useState(false);
  const before = { ...pet, level: (pet.level || 1) >= FORM_LEVELS[2] ? FORM_LEVELS[2] - 1 : FORM_LEVELS[1] - 1 };

  const revealed = useRef(false);
  const reveal = () => {
    if (revealed.current) return;
    revealed.current = true;
    setStep('after');
    playLevelUpSound();
    triggerConfetti(3000);
  };

  useEffect(() => {
    playFusionSound();
    const t1 = window.setTimeout(() => setStep(s => (s === 'before' ? 'flash' : s)), 1200);
    const t2 = window.setTimeout(reveal, 3600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (step !== 'flash') return;
    const t = window.setInterval(() => setFlip(f => !f), 180);
    return () => clearInterval(t);
  }, [step]);

  const shown = step === 'after' || (step === 'flash' && flip) ? pet : before;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 animate-fade-in">
      <div className="bg-gradient-to-b from-indigo-900 to-purple-800 rounded-[2rem] p-6 max-w-sm w-full text-center shadow-2xl animate-pop-in">
        <h2 className="text-2xl font-black text-white mb-4">
          {step === 'after' ? 'しんか した！' : `${before.name} の ようすが…！？`}
        </h2>
        <div className={`w-56 h-56 mx-auto ${step === 'flash' ? 'brightness-[2.5]' : ''} transition`}>
          <PetImage pet={shown} className={`w-full h-full ${step === 'after' ? 'animate-pop-in' : 'animate-egg-shake'}`} />
        </div>
        {step === 'after' ? (
          <div className="animate-slide-up">
            <p className="text-3xl font-black text-yellow-300 my-3">{displayName(pet)}</p>
            <p className="text-sm font-bold text-white/80 mb-4">のうりょくが ぐーんと あがった！</p>
            <Button onClick={onClose} size="lg" className="w-full">やったー！</Button>
          </div>
        ) : (
          <button onClick={reveal} className="mt-4 text-xs text-white/60 font-bold">タップで とばす</button>
        )}
      </div>
    </div>
  );
};
