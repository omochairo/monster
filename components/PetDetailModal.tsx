import React, { useState } from 'react';
import { GeneratedPet } from '../types';
import { X, Star, Zap, Flame, Activity, Brain, ArrowUp, Volume2, Heart, Wand2 } from 'lucide-react';
import { PetImage } from './PetImage';
import { speakText, stopSpeech } from '../services/speechService';
import { playClickSound } from '../services/audioService';
import { displayName, xpToNext } from '../services/growth';
import { FORM_LEVELS, formOfLevel, speciesOf } from '../services/species';

interface PetDetailModalProps {
  pet: GeneratedPet;
  onOpenCare?: () => void;
  onClose: () => void;
}

export const PetDetailModal: React.FC<PetDetailModalProps> = ({ pet, onOpenCare, onClose }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isLegendary = pet.rarity === 5;
  
  const currentLevel = pet.level || 1;
  const currentXp = pet.xp || 0;
  const neededXp = xpToNext(currentLevel);
  const xpPercent = Math.min(100, (currentXp / neededXp) * 100);
  const nextLevelRemaining = Math.max(0, neededXp - currentXp);

  const handleSpeak = () => {
    playClickSound();
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(`${pet.name}！とくぎは、${pet.superpower}。${pet.description}`, () => {
        setIsSpeaking(false);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-pop-in relative" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button 
          onClick={() => { stopSpeech(); onClose(); }} 
          className="absolute top-4 right-4 z-30 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header / Image Area */}
        <div className={`relative h-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 to-gray-300 flex items-center justify-center overflow-hidden`}>
           <div className={`absolute inset-0 opacity-50 ${pet.element.color}`}></div>
           
           {/* Rarity / Shiny BG Effect */}
           {isLegendary && (
              <div className="absolute inset-[-50%] opacity-30 animate-spin-slow text-yellow-300">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                   <path d="M50 50 L50 0 L55 0 Z" />
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

           {pet.isFused && (
             <div className="absolute top-4 left-4 z-20 bg-purple-600 text-white text-xs font-black px-3 py-1 rounded-full border-2 border-purple-200 shadow-md flex items-center gap-1">
               <Wand2 className="w-3.5 h-3.5" /> 合成モンスター
             </div>
           )}

           <PetImage 
             pet={pet} 
             alt={pet.name}
             className={`relative z-10 h-48 w-48 object-contain drop-shadow-2xl ${isLegendary ? 'animate-bounce-hover' : ''}`}
           />

           <div className="absolute bottom-4 left-4 z-20 flex gap-1">
              {[...Array(pet.rarity)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-md" />
              ))}
           </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-2">
             <div className="flex items-center gap-2">
                 <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">{displayName(pet)}</h2>
                 <div className="bg-gray-800 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                     Lv.{currentLevel}
                 </div>
             </div>
             <span className={`px-3 py-1 rounded-full text-white font-bold text-sm shadow-sm ${pet.element.color}`}>
                {pet.element.icon} {pet.element.label}
             </span>
          </div>

          {/* Action Row: Speak & Care */}
          <div className="flex gap-2 mb-4">
            <button 
              onClick={handleSpeak}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                isSpeaking ? 'bg-pink-500 text-white border-pink-600 animate-pulse' : 'bg-pink-50 text-pink-600 border-pink-200 hover:bg-pink-100'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'しゃべっています...' : 'おはなしを聞く'}</span>
            </button>

            {onOpenCare && (
              <button 
                onClick={() => { stopSpeech(); onOpenCare(); }}
                className="flex-1 py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Heart className="w-4 h-4 fill-red-400 text-red-400" />
                <span>ふれあい ({pet.friendship || 0}%)</span>
              </button>
            )}
          </div>

          <p className="text-xs font-bold text-gray-400 mb-3">
            ずかん No.{String(speciesOf(pet).no).padStart(3, '0')} ・ {speciesOf(pet).body.label}タイプ
            {pet.shiny && <span className="ml-1 text-pink-500">✨いろちがい</span>}
            {formOfLevel(pet.level) < 3 && <span className="ml-1">・ Lv{FORM_LEVELS[formOfLevel(pet.level)]}で しんか！</span>}
          </p>

          {/* XP Bar */}
          <div className="mb-4">
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                  <span>経験値 (EXP)</span>
                  <span>{currentXp} / {neededXp}</span>
              </div>
              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden relative shadow-inner">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(34,211,238,0.8)] relative" 
                    style={{ width: `${xpPercent}%` }}
                  >
                     <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
              </div>
              <div className="text-[10px] text-right text-gray-400 mt-1 font-bold">
                  次のレベルまで あと {nextLevelRemaining} XP
              </div>
          </div>

          <div className="space-y-4">
             {/* Stats */}
             <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl relative border border-gray-100">
                 {currentLevel > 1 && (
                     <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                         <ArrowUp className="w-3 h-3" /> 成長中
                     </div>
                 )}
                 
                 <div className="text-center">
                    <div className="text-red-500 font-bold text-xs mb-1 flex justify-center items-center gap-1"><Flame className="w-3 h-3" />パワー</div>
                    <div className="font-black text-lg text-gray-700">{pet.stats.power}</div>
                 </div>
                 <div className="text-center border-l border-gray-200">
                    <div className="text-blue-500 font-bold text-xs mb-1 flex justify-center items-center gap-1"><Activity className="w-3 h-3" />スピード</div>
                    <div className="font-black text-lg text-gray-700">{pet.stats.speed}</div>
                 </div>
                 <div className="text-center border-l border-gray-200">
                    <div className="text-green-500 font-bold text-xs mb-1 flex justify-center items-center gap-1"><Brain className="w-3 h-3" />かしこさ</div>
                    <div className="font-black text-lg text-gray-700">{pet.stats.smarts}</div>
                 </div>
             </div>

             {/* Description */}
             <div className="bg-blue-50 p-4 rounded-xl text-sm border border-blue-100">
                <div className="flex items-center gap-2 mb-1 text-blue-600 font-bold">
                    <Zap className="w-4 h-4" /> とくぎ
                </div>
                <p className="font-bold text-gray-700 mb-2">{pet.superpower}</p>
                <p className="text-gray-600 leading-relaxed border-t border-blue-200 pt-2 mt-2">
                    {pet.description}
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
