import React from 'react';
import { STAGES } from '../constants';
import { Stage, GeneratedPet } from '../types';
import { Button } from './Button';
import { Lock, ArrowLeft, Star } from 'lucide-react';
import { PetImage } from './PetImage';
import { displayName, petKey } from '../services/growth';

interface StageSelectScreenProps {
  playerTeam: GeneratedPet[];
  stageStars: Record<string, number>;
  speciesCount: number;
  onSelectStage: (stage: Stage) => void;
  onBack: () => void;
}

export const lockReason = (stage: Stage, stageStars: Record<string, number>, speciesCount: number): string | null => {
  if (stage.requiresStage && !stageStars[stage.requiresStage]) {
    const prev = STAGES.find(s => s.id === stage.requiresStage);
    return `「${prev?.name}」を クリアすると オープン！`;
  }
  if (stage.requiredSpecies && speciesCount < stage.requiredSpecies) {
    return `ずかんで ${stage.requiredSpecies}しゅるい みつけると オープン！（いま ${speciesCount}）`;
  }
  return null;
};

export const StageSelectScreen: React.FC<StageSelectScreenProps> = ({ playerTeam, stageStars, speciesCount, onSelectStage, onBack }) => {
  const leader = playerTeam[0];

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-4 min-h-[80vh] flex flex-col animate-fade-in">
      <div className="flex items-start md:items-center gap-3 mb-5">
        <Button variant="secondary" size="sm" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-black text-gray-800">たんけんの場所をえらぶ</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <div className="flex -space-x-3">
              {playerTeam.map(pet => (
                <div key={petKey(pet)} className="w-10 h-10 rounded-full border-2 border-white shadow-md bg-white overflow-hidden">
                  <PetImage pet={pet} className="w-full h-full" />
                </div>
              ))}
            </div>
            <span className="text-sm text-gray-500 font-bold">{displayName(leader)} たちと出発！</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STAGES.map(stage => {
          const reason = lockReason(stage, stageStars, speciesCount);
          const isLocked = !!reason;
          const stars = stageStars[stage.id] || 0;
          const darkBg = stage.difficultyLevel === 5;
          return (
            <button
              key={stage.id}
              onClick={() => !isLocked && onSelectStage(stage)}
              disabled={isLocked}
              className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border-4 flex flex-col min-h-[9rem] shadow-lg
                ${isLocked ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-80' : `bg-gradient-to-br ${stage.bgGradient} border-white hover:scale-[1.03] hover:shadow-xl cursor-pointer`}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-4xl drop-shadow-md">{stage.emoji}</span>
                  <h3 className={`text-xl font-black ${isLocked ? 'text-gray-400' : darkBg ? 'text-white' : 'text-gray-800'}`}>{stage.name}</h3>
                </div>
                {isLocked ? (
                  <Lock className="w-8 h-8 text-gray-400 shrink-0" />
                ) : (
                  <div className="flex gap-0.5 shrink-0" aria-label={`ほし ${stars}こ`}>
                    {[1, 2, 3].map(i => (
                      <Star key={i} className={`w-6 h-6 ${i <= stars ? 'fill-yellow-400 text-yellow-500' : 'text-white/80'}`} />
                    ))}
                  </div>
                )}
              </div>
              <p className={`text-sm font-bold mt-2 ${isLocked ? 'text-gray-400' : darkBg ? 'text-white/90' : 'text-gray-700'}`}>
                {reason || stage.description}
              </p>
              {!isLocked && (
                <div className="mt-auto pt-2 flex gap-2 flex-wrap">
                  <span className="bg-white/85 px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">
                    むずかしさ {'🔥'.repeat(stage.difficultyLevel)}
                  </span>
                  <span className="bg-white/85 px-3 py-1 rounded-full text-xs font-bold text-gray-700 shadow-sm">{stage.waves}せん（さいごは ボス👑）</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-gray-500 font-bold mt-4">★3つ = だれも たおれずに クリア！</p>
    </div>
  );
};
