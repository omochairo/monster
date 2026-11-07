import React, { useState } from 'react';
import { GeneratedPet } from '../types';
import { PetImage } from './PetImage';
import { Button } from './Button';
import { X, Heart, Sparkles, Utensils } from 'lucide-react';
import { playHeartSound, playClickSound } from '../services/audioService';

interface PetCareModalProps {
  pet: GeneratedPet;
  onUpdatePet: (updatedPet: GeneratedPet) => void;
  onClose: () => void;
}

export const PetCareModal: React.FC<PetCareModalProps> = ({ pet, onUpdatePet, onClose }) => {
  const [currentPet, setCurrentPet] = useState<GeneratedPet>(pet);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const friendship = currentPet.friendship || 0;

  const addHeart = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newId = Date.now() + Math.random();
    setHearts(prev => [...prev, { id: newId, x, y }]);
    playHeartSound();

    setTimeout(() => {
      setHearts(prev => prev.filter(h => h.id !== newId));
    }, 1000);

    // Increase Friendship
    const newFriendship = Math.min(100, friendship + 5);
    const updated = { ...currentPet, friendship: newFriendship };
    setCurrentPet(updated);
    onUpdatePet(updated);

    if (newFriendship >= 100) {
      setActiveMessage("なつき度 MAX！ モンスターが 大好きって言ってるよ！");
    } else {
      setActiveMessage("なでなで されて うれしそう！");
    }
  };

  const handleFeed = (snackType: 'candy' | 'apple' | 'cake') => {
    playClickSound();
    playHeartSound();

    let bonusPower = 0;
    let bonusSpeed = 0;
    let bonusSmarts = 0;
    let snackName = "";

    if (snackType === 'candy') {
      bonusSpeed = 1;
      snackName = "あめだま 🍬";
    } else if (snackType === 'apple') {
      bonusPower = 1;
      snackName = "りんご 🍎";
    } else {
      bonusSmarts = 1;
      snackName = "ケーキ 🍰";
    }

    const newFriendship = Math.min(100, friendship + 10);
    const updatedStats = {
      power: Math.min(999, currentPet.stats.power + bonusPower),
      speed: Math.min(999, currentPet.stats.speed + bonusSpeed),
      smarts: Math.min(999, currentPet.stats.smarts + bonusSmarts)
    };

    const updated = {
      ...currentPet,
      friendship: newFriendship,
      stats: updatedStats,
      lastFed: Date.now()
    };

    setCurrentPet(updated);
    onUpdatePet(updated);
    setActiveMessage(`${snackName} を食べて 元気いっぱい！ (なつき度+10)`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-pop-in relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-gray-800 mb-1 flex items-center justify-center gap-2">
          <span>{currentPet.name} と ふれあい</span>
        </h2>
        <p className="text-xs text-gray-400 font-bold mb-4">タップして なでなで してね！</p>

        {/* Friendship Bar */}
        <div className="bg-pink-50 p-3 rounded-2xl mb-4 border border-pink-100">
          <div className="flex justify-between items-center text-xs font-bold text-pink-600 mb-1">
            <span className="flex items-center gap-1"><Heart className="w-4 h-4 fill-pink-500 text-pink-500 animate-pulse" /> なつき度</span>
            <span>{friendship} / 100</span>
          </div>
          <div className="h-3 bg-pink-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-400 to-red-400 transition-all duration-500 rounded-full" style={{ width: `${friendship}%` }} />
          </div>
        </div>

        {/* Pet Touch Area */}
        <div 
          className="relative h-48 w-48 mx-auto bg-gradient-to-b from-gray-50 to-pink-50 rounded-3xl border-4 border-pink-200 flex items-center justify-center cursor-pointer shadow-inner overflow-hidden mb-4 group"
          onClick={addHeart}
        >
          <PetImage 
            src={currentPet.imageUrl} 
            alt={currentPet.name} 
            prompt={currentPet.imagePrompt}
            className="w-40 h-40 object-contain transition-transform group-active:scale-95"
          />

          {/* Floating Hearts */}
          {hearts.map(h => (
            <div 
              key={h.id} 
              className="absolute pointer-events-none text-2xl animate-float-up"
              style={{ left: `${h.x}px`, top: `${h.y}px` }}
            >
              ❤️
            </div>
          ))}
        </div>

        {/* Message */}
        {activeMessage && (
          <p className="text-xs font-bold text-pink-600 bg-pink-50 py-1.5 px-3 rounded-full mb-4 animate-fade-in inline-block">
            {activeMessage}
          </p>
        )}

        {/* Snacks Area */}
        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
          <p className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-center gap-1">
            <Utensils className="w-3.5 h-3.5" /> おやつを あげる
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleFeed('candy')}
              className="bg-white p-2 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition flex flex-col items-center shadow-sm"
            >
              <span className="text-2xl mb-0.5">🍬</span>
              <span className="text-[10px] font-bold text-gray-600">あめだま</span>
              <span className="text-[9px] text-blue-500 font-bold">Speed+1</span>
            </button>

            <button 
              onClick={() => handleFeed('apple')}
              className="bg-white p-2 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition flex flex-col items-center shadow-sm"
            >
              <span className="text-2xl mb-0.5">🍎</span>
              <span className="text-[10px] font-bold text-gray-600">りんご</span>
              <span className="text-[9px] text-red-500 font-bold">Power+1</span>
            </button>

            <button 
              onClick={() => handleFeed('cake')}
              className="bg-white p-2 rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition flex flex-col items-center shadow-sm"
            >
              <span className="text-2xl mb-0.5">🍰</span>
              <span className="text-[10px] font-bold text-gray-600">ケーキ</span>
              <span className="text-[9px] text-green-500 font-bold">Smarts+1</span>
            </button>
          </div>
        </div>

        <Button onClick={onClose} size="md" className="w-full mt-4 bg-gray-800 hover:bg-gray-700">
          できた！
        </Button>

      </div>
    </div>
  );
};
