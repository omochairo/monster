import React, { useState } from 'react';
import { GeneratedPet } from '../types';
import { PetImage } from './PetImage';
import { Button } from './Button';
import { X, Sparkles, Wand2, ArrowRight, Plus } from 'lucide-react';
import { fusePets } from '../services/geminiService';
import { playFusionSound, playVictorySound } from '../services/audioService';
import { triggerConfetti } from '../services/confetti';

interface FusionModalProps {
  collection: GeneratedPet[];
  onFusionComplete: (newPet: GeneratedPet) => void;
  onClose: () => void;
}

export const FusionModal: React.FC<FusionModalProps> = ({ collection, onFusionComplete, onClose }) => {
  const [pet1, setPet1] = useState<GeneratedPet | null>(null);
  const [pet2, setPet2] = useState<GeneratedPet | null>(null);
  const [isFusing, setIsFusing] = useState(false);
  const [fusedResult, setFusedResult] = useState<GeneratedPet | null>(null);

  const handleSelectPet = (pet: GeneratedPet) => {
    const uniqueId = (p: GeneratedPet) => `${p.imagePrompt}-${p.dateFound}`;
    
    if (pet1 && uniqueId(pet1) === uniqueId(pet)) {
      setPet1(null);
      return;
    }
    if (pet2 && uniqueId(pet2) === uniqueId(pet)) {
      setPet2(null);
      return;
    }

    if (!pet1) {
      setPet1(pet);
    } else if (!pet2) {
      setPet2(pet);
    }
  };

  const handleStartFusion = async () => {
    if (!pet1 || !pet2) return;

    setIsFusing(true);
    playFusionSound();

    try {
      // Simulate magical fusion delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newFusedPet = await fusePets(pet1, pet2);
      setFusedResult(newFusedPet);
      setIsFusing(false);

      playVictorySound();
      triggerConfetti(4000);
      onFusionComplete(newFusedPet);
    } catch (e) {
      console.error("Fusion error", e);
      setIsFusing(false);
    }
  };

  const uniqueId = (p: GeneratedPet) => `${p.imagePrompt}-${p.dateFound}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-pop-in relative overflow-hidden text-center" onClick={e => e.stopPropagation()}>
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors z-20">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-black text-gray-800 mb-1 flex items-center justify-center gap-2">
          <Wand2 className="w-6 h-6 text-purple-500 animate-bounce" />
          <span>まほうの合成工房</span>
        </h2>
        <p className="text-xs text-gray-400 font-bold mb-4">2匹のモンスターを選んで 合体させよう！</p>

        {/* FUSION ANIMATION AREA */}
        {isFusing ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-32 h-32 relative flex items-center justify-center">
              <div className="absolute inset-0 bg-purple-400/30 rounded-full animate-ping"></div>
              <div className="absolute inset-0 border-4 border-purple-500 rounded-full animate-spin-slow"></div>
              <Sparkles className="w-16 h-16 text-yellow-400 animate-spin" />
            </div>
            <p className="mt-6 text-lg font-black text-purple-600 animate-pulse">
              まほうのパワーを 集めています...✨
            </p>
          </div>
        ) : fusedResult ? (
          /* RESULT DISPLAY */
          <div className="py-4 animate-pop-in">
            <div className="w-48 h-48 mx-auto bg-gradient-to-b from-purple-100 to-pink-100 rounded-3xl p-2 border-4 border-purple-300 shadow-xl mb-4 relative flex items-center justify-center">
              <PetImage 
                src={fusedResult.imageUrl} 
                alt={fusedResult.name} 
                prompt={fusedResult.imagePrompt}
                className="w-40 h-40 object-contain drop-shadow-lg"
              />
              <div className="absolute -top-3 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-0.5 rounded-full border-2 border-white shadow-md">
                合体成功！ ★{fusedResult.rarity}
              </div>
            </div>

            <h3 className="text-2xl font-black text-purple-700 mb-2">{fusedResult.name}</h3>
            <p className="text-xs font-bold text-gray-600 bg-purple-50 p-3 rounded-xl mb-4 border border-purple-100">
              {fusedResult.superpower}
            </p>

            <Button onClick={onClose} size="lg" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
              図鑑に かきこむ！
            </Button>
          </div>
        ) : (
          /* SELECTION STAGE */
          <>
            {/* Slot Display */}
            <div className="flex justify-center items-center gap-3 mb-6">
              {/* Slot 1 */}
              <div 
                onClick={() => setPet1(null)}
                className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center relative transition-all ${
                  pet1 ? 'bg-purple-50 border-purple-400 cursor-pointer shadow-md' : 'bg-gray-50 border-dashed border-gray-300'
                }`}
              >
                {pet1 ? (
                  <PetImage src={pet1.imageUrl} alt={pet1.name} prompt={pet1.imagePrompt} className="w-20 h-20 object-contain" />
                ) : (
                  <Plus className="w-8 h-8 text-gray-300" />
                )}
                <div className="absolute -bottom-2 text-[10px] bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">
                  {pet1 ? pet1.name : 'パートナー1'}
                </div>
              </div>

              <div className="text-2xl font-black text-purple-400">+</div>

              {/* Slot 2 */}
              <div 
                onClick={() => setPet2(null)}
                className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center relative transition-all ${
                  pet2 ? 'bg-purple-50 border-purple-400 cursor-pointer shadow-md' : 'bg-gray-50 border-dashed border-gray-300'
                }`}
              >
                {pet2 ? (
                  <PetImage src={pet2.imageUrl} alt={pet2.name} prompt={pet2.imagePrompt} className="w-20 h-20 object-contain" />
                ) : (
                  <Plus className="w-8 h-8 text-gray-300" />
                )}
                <div className="absolute -bottom-2 text-[10px] bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">
                  {pet2 ? pet2.name : 'パートナー2'}
                </div>
              </div>
            </div>

            {/* Collection Grid Selection */}
            <div className="max-h-48 overflow-y-auto grid grid-cols-4 gap-2 mb-4 p-1 bg-gray-50 rounded-2xl border border-gray-100">
              {collection.map(pet => {
                const isSelected = (pet1 && uniqueId(pet1) === uniqueId(pet)) || (pet2 && uniqueId(pet2) === uniqueId(pet));
                return (
                  <div
                    key={uniqueId(pet)}
                    onClick={() => handleSelectPet(pet)}
                    className={`p-1 bg-white rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-200 bg-purple-50 scale-95' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <PetImage src={pet.imageUrl} alt={pet.name} prompt={pet.imagePrompt} className="w-12 h-12 object-contain mx-auto" />
                    <p className="text-[9px] font-bold text-gray-700 truncate text-center mt-1">{pet.name}</p>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleStartFusion}
              disabled={!pet1 || !pet2}
              className={`w-full py-3 text-base font-black shadow-lg ${
                pet1 && pet2
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-400 hover:scale-105 animate-pulse'
                  : 'bg-gray-300 border-gray-300 cursor-not-allowed text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Wand2 className="w-5 h-5" />
                <span>まほうの合成！</span>
              </div>
            </Button>
          </>
        )}

      </div>
    </div>
  );
};
