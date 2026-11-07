import React, { useState } from 'react';
import { GeneratedPet } from '../types';
import { PetImage } from './PetImage';
import { Button } from './Button';
import { X, Heart, Utensils } from 'lucide-react';
import { playHeartSound, playClickSound } from '../services/audioService';
import { PlayerProgress, SNACKS, SnackType } from '../services/progress';
import { BRAVE_FRIENDSHIP, displayName } from '../services/growth';

interface PetCareModalProps {
  pet: GeneratedPet;
  progress: PlayerProgress;
  onPet: (pet: GeneratedPet) => { pet: GeneratedPet; counted: boolean };
  onFeed: (pet: GeneratedPet, snack: SnackType) => GeneratedPet | null;
  onClose: () => void;
}

export const PetCareModal: React.FC<PetCareModalProps> = ({ pet, progress, onPet, onFeed, onClose }) => {
  const [currentPet, setCurrentPet] = useState<GeneratedPet>(pet);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const friendship = currentPet.friendship || 0;

  const addHeart = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newId = Date.now() + Math.random();
    setHearts(prev => [...prev, { id: newId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    playHeartSound();
    window.setTimeout(() => setHearts(prev => prev.filter(h => h.id !== newId)), 1000);

    const r = onPet(currentPet);
    setCurrentPet(r.pet);
    if (!r.counted) {
      setActiveMessage('きょうは いっぱい なでて もらって まんぞく みたい！');
    } else if ((r.pet.friendship || 0) >= 100) {
      setActiveMessage('なつき度 MAX！ だいすきって いってるよ！');
    } else if ((r.pet.friendship || 0) >= BRAVE_FRIENDSHIP && friendship < BRAVE_FRIENDSHIP) {
      setActiveMessage('なかよしパワー ゲット！ バトルで 1かい ふんばれるよ！');
    } else {
      setActiveMessage('なでなで されて うれしそう！');
    }
  };

  const handleFeed = (snack: SnackType) => {
    playClickSound();
    const updated = onFeed(currentPet, snack);
    if (!updated) {
      setActiveMessage(`${SNACKS[snack].label}が ないよ。ステージを クリアして あつめよう！`);
      return;
    }
    playHeartSound();
    setCurrentPet(updated);
    setActiveMessage(`${SNACKS[snack].emoji} ${SNACKS[snack].label}を たべて ${SNACKS[snack].statLabel}+2！`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop-in relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} aria-label="とじる" className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-gray-800 mb-1">{displayName(currentPet)} と ふれあい</h2>
        <p className="text-xs text-gray-400 font-bold mb-4">タップして なでなで してね！</p>

        <div className="bg-pink-50 p-3 rounded-2xl mb-4 border border-pink-100">
          <div className="flex justify-between items-center text-xs font-bold text-pink-600 mb-1">
            <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-pink-500 text-pink-500 animate-pulse" /> なつき度</span>
            <span>{friendship} / 100</span>
          </div>
          <div className="h-3 bg-pink-200 rounded-full overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-pink-400 to-red-400 transition-all duration-500 rounded-full" style={{ width: `${friendship}%` }} />
            <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${BRAVE_FRIENDSHIP}%` }} />
          </div>
          <div className="text-[10px] font-bold text-pink-400 mt-1 text-right">{BRAVE_FRIENDSHIP}で なかよしパワー（バトルで ふんばる）</div>
        </div>

        <div
          className="relative h-48 w-48 mx-auto bg-gradient-to-b from-gray-50 to-pink-50 rounded-3xl border-4 border-pink-200 flex items-center justify-center cursor-pointer shadow-inner overflow-hidden mb-4 group"
          onClick={addHeart}
        >
          <PetImage pet={currentPet} className="w-40 h-40 transition-transform group-active:scale-95" />
          {hearts.map(h => (
            <div key={h.id} className="absolute pointer-events-none text-2xl animate-float-up" style={{ left: `${h.x}px`, top: `${h.y}px` }}>❤️</div>
          ))}
        </div>

        {activeMessage && (
          <p className="text-xs font-bold text-pink-600 bg-pink-50 py-1.5 px-3 rounded-full mb-4 animate-fade-in inline-block">{activeMessage}</p>
        )}

        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-center gap-1">
            <Utensils className="w-3.5 h-3.5" /> おやつを あげる（なつき度+8）
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SNACKS) as SnackType[]).map(s => {
              const count = progress.snacks[s];
              return (
                <button key={s} onClick={() => handleFeed(s)}
                  className={`relative bg-white p-2 rounded-xl border transition flex flex-col items-center shadow-sm ${count > 0 ? 'border-gray-200 hover:border-pink-300 hover:bg-pink-50' : 'border-gray-100 opacity-50'}`}>
                  <span className="absolute -top-2 -right-2 bg-gray-800 text-white text-[10px] font-black min-w-5 h-5 px-1 rounded-full flex items-center justify-center">{count}</span>
                  <span className="text-2xl mb-0.5">{SNACKS[s].emoji}</span>
                  <span className="text-[10px] font-bold text-gray-600">{SNACKS[s].label}</span>
                  <span className="text-[9px] text-pink-500 font-bold">{SNACKS[s].statLabel}+2</span>
                </button>
              );
            })}
          </div>
        </div>

        <Button onClick={onClose} size="md" className="w-full mt-4 bg-gray-800 hover:bg-gray-700">できた！</Button>
      </div>
    </div>
  );
};
