
import React, { useState } from 'react';
import { STAGES } from '../constants';
import { Stage, GeneratedPet } from '../types';
import { Button } from './Button';
import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { generateRandomPet, generatePetImage, getFallbackImageUrl } from '../services/geminiService';
import { PetImage } from './PetImage';

interface StageSelectScreenProps {
  playerTeam: GeneratedPet[];
  collectionCount: number;
  onSelectStage: (stage: Stage, enemy: GeneratedPet) => void;
  onBack: () => void;
}

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({
  playerTeam,
  collectionCount,
  onSelectStage,
  onBack
}) => {
  const [loadingStageId, setLoadingStageId] = useState<string | null>(null);
  const leader = playerTeam[0];

  const handleStageClick = async (stage: Stage) => {
    if (loadingStageId) return; // Prevent double click
    setLoadingStageId(stage.id);

    try {
        // 1. Generate Enemy Data instantly
        const profile = await generateRandomPet(stage.difficultyLevel, stage.minStats, stage.id);
        const imageUrl = await generatePetImage(profile.imagePrompt);
        
        // 2. Preload Image in background
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "anonymous";
        
        img.onload = () => {
            // 3. Once loaded, proceed to Battle
            setLoadingStageId(null);
            onSelectStage(stage, { ...profile, imageUrl });
        };

        img.onerror = () => {
            // Fallback if image fails - Use smart fallback (Humans for bosses, etc)
            console.warn("Enemy image load failed, using fallback");
            const safeUrl = getFallbackImageUrl(profile.imagePrompt);
            setLoadingStageId(null);
            onSelectStage(stage, { ...profile, imageUrl: safeUrl });
        };
    } catch (e) {
        console.error("Failed to prepare battle", e);
        setLoadingStageId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 min-h-[80vh] flex flex-col animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
        <Button variant="secondary" size="sm" onClick={onBack} disabled={!!loadingStageId}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-gray-800">たんけんの場所をえらぶ</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-500 font-bold">チーム:</span>
            <div className="flex -space-x-3">
                {playerTeam.map((pet, i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white shadow-md ${pet.element.color} flex items-center justify-center overflow-hidden bg-white`}>
                        <PetImage
                            src={pet.imageUrl} 
                            alt={pet.name}
                            prompt={pet.imagePrompt}
                            className="w-full h-full object-contain" 
                        />
                    </div>
                ))}
            </div>
             <span className="text-sm text-gray-400 font-bold ml-1">
                 {leader.name} たちと出発！
             </span>
          </div>
        </div>
      </div>

      {/* Stage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAGES.map((stage) => {
          const isLocked = collectionCount < stage.requiredCollectionCount;
          const isLoading = loadingStageId === stage.id;
          
          return (
            <button
              key={stage.id}
              onClick={() => !isLocked && handleStageClick(stage)}
              disabled={isLocked || !!loadingStageId}
              className={`
                relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 border-4
                flex flex-col h-40 shadow-lg group
                ${isLocked 
                  ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-80' 
                  : `bg-gradient-to-br ${stage.bgGradient} border-white hover:scale-105 hover:shadow-xl cursor-pointer`
                }
                ${isLoading ? 'scale-95 opacity-90 ring-4 ring-pink-300' : ''}
              `}
            >
              <div className="flex justify-between items-start z-10 relative">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <span className="text-4xl filter drop-shadow-md">
                         {isLoading ? <Loader2 className="animate-spin" /> : stage.emoji}
                     </span>
                     <h3 className={`text-xl font-black ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                       {stage.name}
                     </h3>
                  </div>
                  <p className={`text-sm font-bold ${isLocked ? 'text-gray-400' : 'text-gray-600'} max-w-[80%]`}>
                    {isLoading ? 'てきを探しています...' : isLocked ? `ペットを ${stage.requiredCollectionCount}匹 あつめると オープン！` : stage.description}
                  </p>
                </div>

                {isLocked ? (
                  <Lock className="w-8 h-8 text-gray-400" />
                ) : (
                  <div className="flex gap-0.5">
                    {[...Array(stage.difficultyLevel)].map((_, i) => (
                      <div key={i} className="w-2 h-4 bg-red-400 rounded-sm" />
                    ))}
                    {[...Array(5 - stage.difficultyLevel)].map((_, i) => (
                      <div key={i} className="w-2 h-4 bg-gray-200/50 rounded-sm" />
                    ))}
                  </div>
                )}
              </div>
              
              {!isLocked && !isLoading && (
                <div className="mt-auto z-10">
                   <span className="bg-white/80 px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                      てきの強さ: Lv.{stage.minStats}~
                   </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
