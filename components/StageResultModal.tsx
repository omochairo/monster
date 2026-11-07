import React, { useState } from 'react';
import { GeneratedPet, Stage } from '../types';
import { Button } from './Button';
import { Star, RotateCcw, Map, Home, Zap, UserPlus, Check } from 'lucide-react';
import { PetImage } from './PetImage';
import { displayName, petKey } from '../services/growth';
import { isBossPrompt } from '../services/species';

export interface StageOutcome {
  stage: Stage;
  cleared: boolean;
  stars: number;
  firstClear: boolean;
  newBest: boolean;
  xp: number;
  levelUps: { pet: GeneratedPet; levels: number }[];
  rewards: string[];
  candidates: GeneratedPet[];
}

interface StageResultModalProps {
  outcome: StageOutcome;
  onRecruit: (pet: GeneratedPet) => void;
  onRetry: () => void;
  onStageSelect: () => void;
  onExit: () => void;
}

export const StageResultModal: React.FC<StageResultModalProps> = ({ outcome, onRecruit, onRetry, onStageSelect, onExit }) => {
  const [recruited, setRecruited] = useState<string | null>(null);
  const { cleared, stars } = outcome;
  const candidates = outcome.candidates.filter(p => !isBossPrompt(p.imagePrompt));

  const handleRecruit = (pet: GeneratedPet) => {
    if (recruited) return;
    setRecruited(petKey(pet));
    onRecruit(pet);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-pop-in max-h-[95vh] overflow-y-auto border-4 ${cleared ? 'border-yellow-400' : 'border-gray-500'}`}>
        <div className={`p-5 text-center ${cleared ? 'bg-gradient-to-b from-yellow-300 to-amber-400' : 'bg-gray-700'}`}>
          <div className={`text-sm font-bold ${cleared ? 'text-yellow-900' : 'text-gray-300'}`}>{outcome.stage.emoji} {outcome.stage.name}</div>
          <h2 className={`text-3xl font-black ${cleared ? 'text-yellow-900' : 'text-white'}`}>{cleared ? 'ステージ クリア！' : 'ざんねん…'}</h2>
          {cleared && (
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3].map(i => (
                <Star key={i} className={`w-10 h-10 ${i <= stars ? 'fill-white text-white animate-pop-in' : 'text-yellow-600/50'}`} style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          )}
          {outcome.firstClear && <div className="mt-2 inline-block bg-white text-pink-600 text-xs font-black px-3 py-1 rounded-full">はじめて クリア！ つぎの ばしょが ひらいたよ</div>}
          {!outcome.firstClear && outcome.newBest && <div className="mt-2 inline-block bg-white text-pink-600 text-xs font-black px-3 py-1 rounded-full">じこベスト こうしん！</div>}
          {!cleared && <p className="text-gray-200 text-sm font-bold mt-2">じゃんけんで かてる わざを えらぶと つよいよ！</p>}
        </div>

        <div className="p-4 space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-50 border-2 border-blue-200 px-5 py-1.5 rounded-full flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-black text-gray-800">+{outcome.xp} XP</span>
            </div>
          </div>

          {outcome.levelUps.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {outcome.levelUps.map(({ pet, levels }) => (
                <div key={petKey(pet)} className="flex items-center gap-1 bg-yellow-50 border border-yellow-300 rounded-full pl-1 pr-3 py-0.5">
                  <PetImage pet={pet} className="w-8 h-8" />
                  <span className="text-xs font-black text-yellow-700">{displayName(pet)} Lv.{pet.level}{levels > 1 ? ` (+${levels})` : ''} UP!</span>
                </div>
              ))}
            </div>
          )}

          {outcome.rewards.length > 0 && (
            <div className="bg-pink-50 rounded-2xl p-3 border border-pink-100">
              <div className="text-xs font-black text-pink-500 mb-1">もらったもの</div>
              <ul className="text-sm font-bold text-gray-700 space-y-0.5">
                {outcome.rewards.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {cleared && candidates.length > 0 && (
            <div>
              <div className="text-center text-sm font-black text-gray-700 mb-2">どの子を つれて かえる？（1ぴき）</div>
              <div className="grid grid-cols-3 gap-2">
                {candidates.map(pet => {
                  const chosen = recruited === petKey(pet);
                  return (
                    <button key={petKey(pet)} onClick={() => handleRecruit(pet)} disabled={!!recruited}
                      className={`relative rounded-2xl p-2 border-2 flex flex-col items-center transition ${chosen ? 'border-green-400 bg-green-50' : recruited ? 'opacity-40 border-gray-200' : 'border-gray-200 hover:border-pink-300 bg-white'}`}>
                      {pet.shiny && <span className="absolute top-1 left-1 text-[10px] font-black bg-pink-500 text-white px-1.5 rounded-full">キラ</span>}
                      <PetImage pet={pet} className="w-16 h-16" />
                      <div className="text-[11px] font-bold text-gray-700 truncate w-full text-center">{pet.name}</div>
                      <div className="text-[10px] text-yellow-500">{'★'.repeat(pet.rarity)}</div>
                      <div className={`mt-1 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5 ${chosen ? 'bg-green-500 text-white' : 'bg-yellow-300 text-yellow-900'}`}>
                        {chosen ? <><Check className="w-3 h-3" /> なかま！</> : <><UserPlus className="w-3 h-3" /> えらぶ</>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <Button onClick={onRetry} size="lg" className={`w-full ${cleared ? 'bg-gradient-to-r from-orange-400 to-red-500 border-none' : 'bg-gray-700 border-gray-600'}`}>
              <div className="flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /><span>{cleared ? (stars < 3 ? '★3を めざして もういちど' : 'もういちど あそぶ') : 'もういちど ちょうせん'}</span></div>
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={onStageSelect} variant="secondary" size="md" className="w-full">
                <div className="flex items-center justify-center gap-1 text-gray-600"><Map className="w-4 h-4" /><span>ほかの ばしょ</span></div>
              </Button>
              <Button onClick={onExit} variant="secondary" size="md" className="w-full">
                <div className="flex items-center justify-center gap-1 text-gray-600"><Home className="w-4 h-4" /><span>ずかんへ</span></div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
