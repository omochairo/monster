import React, { useState, useMemo, useEffect } from 'react';
import { GeneratedPet } from '../types';
import { Button } from './Button';
import { ArrowLeft, Star, Swords, HelpCircle, ArrowRight, Plus, X, BarChart, Clock, Trophy, Zap, Wand2, Heart } from 'lucide-react';
import { TypeChartModal } from './TypeChartModal';
import { PetDetailModal } from './PetDetailModal';
import { PetCareModal } from './PetCareModal';
import { FusionModal } from './FusionModal';
import { PetImage } from './PetImage';
import { playLevelUpSound } from '../services/audioService';

interface CollectionScreenProps {
  collection: GeneratedPet[];
  onBack: () => void;
  onUpdateCollection?: (newCollection: GeneratedPet[]) => void;
  
  // Battle Props
  initialBattleMode?: boolean; 
  battleTeam?: GeneratedPet[];
  onTogglePet?: (pet: GeneratedPet) => void;
  onStartAdventure?: () => void;
  hasEgg?: boolean;

  // Level Up Props
  recentLevelUps?: string[];
  onClearLevelUps?: () => void;
}

type SortOption = 'newest' | 'rarity' | 'power' | 'level';

export const CollectionScreen: React.FC<CollectionScreenProps> = ({ 
  collection, 
  onBack, 
  onUpdateCollection,
  
  initialBattleMode = false,
  battleTeam = [],
  onTogglePet,
  onStartAdventure,
  hasEgg = false,

  recentLevelUps = [],
  onClearLevelUps
}) => {
  const [isBattleMode, setIsBattleMode] = useState(initialBattleMode);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  // Modal States
  const [showTypeChart, setShowTypeChart] = useState(false);
  const [selectedPet, setSelectedPet] = useState<GeneratedPet | null>(null);
  const [carePet, setCarePet] = useState<GeneratedPet | null>(null);
  const [showFusionModal, setShowFusionModal] = useState(false);
  
  // Handle Level Up Effects
  useEffect(() => {
    if (recentLevelUps.length > 0) {
      playLevelUpSound();
      
      const timer = setTimeout(() => {
        if (onClearLevelUps) onClearLevelUps();
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [recentLevelUps, onClearLevelUps]);

  // Collection Stats for Rank
  const uniquePetsCount = useMemo(() => {
    const uniquePrompts = new Set(collection.map(p => p.imagePrompt));
    return uniquePrompts.size;
  }, [collection]);

  const collectionRank = useMemo(() => {
    if (uniquePetsCount >= 30) return { title: 'レジェンド', color: 'bg-yellow-400 text-yellow-900', icon: '👑' };
    if (uniquePetsCount >= 20) return { title: 'マスター', color: 'bg-purple-500 text-white', icon: '🔮' };
    if (uniquePetsCount >= 10) return { title: 'はかせ', color: 'bg-blue-500 text-white', icon: '🎓' };
    if (uniquePetsCount >= 5) return { title: 'コレクター', color: 'bg-green-500 text-white', icon: '🎒' };
    return { title: 'みならい', color: 'bg-gray-400 text-white', icon: '🥚' };
  }, [uniquePetsCount]);
  
  const nextRankGoal = useMemo(() => {
    if (uniquePetsCount >= 30) return 50;
    if (uniquePetsCount >= 20) return 30;
    if (uniquePetsCount >= 10) return 20;
    if (uniquePetsCount >= 5) return 10;
    return 5;
  }, [uniquePetsCount]);

  const progressPercent = Math.min(100, (uniquePetsCount / nextRankGoal) * 100);

  // Sorting Logic
  const sortedCollection = useMemo(() => {
    const sorted = [...collection];
    switch (sortOption) {
      case 'rarity':
        return sorted.sort((a, b) => b.rarity - a.rarity);
      case 'power':
        return sorted.sort((a, b) => (b.stats?.power || 0) - (a.stats?.power || 0));
      case 'level':
        return sorted.sort((a, b) => (b.level || 1) - (a.level || 1));
      case 'newest':
      default:
        return sorted.sort((a, b) => (b.dateFound || 0) - (a.dateFound || 0));
    }
  }, [collection, sortOption]);

  const toggleBattleMode = () => setIsBattleMode(!isBattleMode);

  const handleUpdatePetInCollection = (updatedPet: GeneratedPet) => {
    const uniqueId = (p: GeneratedPet) => `${p.imagePrompt}-${p.dateFound}`;
    const newCollection = collection.map(p => 
      uniqueId(p) === uniqueId(updatedPet) ? updatedPet : p
    );
    if (onUpdateCollection) {
      onUpdateCollection(newCollection);
    }
  };

  const handleFusionComplete = (newPet: GeneratedPet) => {
    if (onUpdateCollection) {
      onUpdateCollection([...collection, newPet]);
    }
  };

  const getSelectionIndex = (pet: GeneratedPet) => {
    const uniqueId = (p: GeneratedPet) => `${p.imagePrompt}-${p.dateFound}`;
    return battleTeam.findIndex(p => uniqueId(p) === uniqueId(pet));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 md:p-4 animate-fade-in pb-10">
      
      {/* Modals */}
      {showTypeChart && <TypeChartModal onClose={() => setShowTypeChart(false)} />}
      {selectedPet && (
        <PetDetailModal 
          pet={selectedPet} 
          onOpenCare={() => {
            setCarePet(selectedPet);
            setSelectedPet(null);
          }}
          onClose={() => setSelectedPet(null)} 
        />
      )}
      {carePet && (
        <PetCareModal
          pet={carePet}
          onUpdatePet={handleUpdatePetInCollection}
          onClose={() => setCarePet(null)}
        />
      )}
      {showFusionModal && (
        <FusionModal
          collection={collection}
          onFusionComplete={handleFusionComplete}
          onClose={() => setShowFusionModal(false)}
        />
      )}

      {/* HEADER AREA */}
      <div className="bg-white rounded-3xl p-3 md:p-4 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Left Group */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Button variant="secondary" size="sm" onClick={onBack} className="w-10 h-10 p-0 rounded-full flex items-center justify-center shrink-0 border-2 border-gray-100 shadow-sm text-gray-600">
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-lg md:text-2xl font-black text-gray-800 leading-none pt-0.5">
              {isBattleMode ? '準備' : '図鑑'}
            </h2>
            
            {hasEgg && (
              <div className="bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <span className="text-lg">🥚</span>
                <span className="text-xs font-bold text-yellow-600 hidden md:inline">タマゴ所持中</span>
              </div>
            )}
          </div>
          
          {/* Right Group: Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isBattleMode && (
              <Button
                onClick={() => {
                  if (collection.length < 2) {
                    alert("モンスターが 2匹以上あつまると\n「まほうの合成」ができるよ！");
                  } else {
                    setShowFusionModal(true);
                  }
                }}
                variant="outline"
                className={`px-3 h-10 text-sm border-2 flex items-center justify-center gap-1.5 shadow-sm transition ${
                  collection.length >= 2
                    ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-600 hover:bg-purple-100'
                    : 'bg-gray-50 border-gray-200 text-gray-400 opacity-70'
                }`}
                size="sm"
              >
                <Wand2 className="w-4 h-4 text-purple-500" />
                <span className="font-bold hidden sm:inline">まほうの合成</span>
                <span className="font-bold sm:hidden">合成</span>
              </Button>
            )}

            <Button 
              onClick={() => setShowTypeChart(true)}
              variant="outline"
              className="px-3 h-10 text-sm bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1.5 shadow-sm"
              size="sm"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <span className="font-bold hidden sm:inline">属性ヒント</span>
            </Button>
            
            {collection.length > 0 && !isBattleMode && (
              <Button 
                onClick={toggleBattleMode}
                className="px-3 h-10 text-sm bg-gradient-to-r from-orange-400 to-red-500 border-none shadow-orange-200 flex items-center justify-center gap-1.5"
                size="sm"
              >
                <Swords className="w-5 h-5" />
                <span className="font-bold">たんけん</span>
              </Button>
            )}
          </div>
        </div>

        {/* Collection Progress Bar */}
        {!isBattleMode && (
          <div className="bg-gray-50 rounded-xl p-3 mb-2 flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${collectionRank.color} shadow-sm flex items-center gap-1`}>
                  {collectionRank.icon} {collectionRank.title}
                </span>
                <span className="text-xs text-gray-500 font-bold">
                  あつめた種類: {uniquePetsCount}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-bold">
                つぎのランクまで: {nextRankGoal - uniquePetsCount}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-1000" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* BATTLE MODE TEAM PANEL */}
        {isBattleMode && (
          <div className="mt-3 bg-red-50 rounded-2xl p-3 md:p-4 border-2 border-red-100 animate-slide-up relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full">
                <p className="text-sm font-bold text-red-500 mb-2 text-center md:text-left">
                  冒険に行くモンスターを選んでね (あと{3 - battleTeam.length}匹)
                </p>
                <div className="flex justify-center md:justify-start gap-3">
                  {[0, 1, 2].map((i) => {
                    const pet = battleTeam[i];
                    return (
                      <div 
                        key={i} 
                        onClick={() => pet && onTogglePet && onTogglePet(pet)}
                        className={`
                          w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 flex items-center justify-center relative transition-all
                          ${pet ? `bg-white border-${pet.element.color.replace('bg-', '')}` : 'bg-white border-dashed border-red-200 cursor-default'}
                          ${pet ? 'cursor-pointer hover:scale-105 shadow-md' : ''}
                        `}
                      >
                        {pet ? (
                          <>
                            <PetImage src={pet.imageUrl} alt={pet.name} prompt={pet.imagePrompt} className="w-full h-full object-contain p-1" />
                            <div className="absolute -top-2 -right-2 bg-gray-600 text-white rounded-full p-1">
                              <X className="w-3 h-3" />
                            </div>
                          </>
                        ) : (
                          <Plus className="w-6 h-6 text-red-200" />
                        )}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                          {i + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                <Button onClick={toggleBattleMode} variant="secondary" className="flex-1 md:flex-none justify-center bg-white border-gray-200 text-gray-500 text-sm h-12">
                  やめる
                </Button>
                <Button 
                  onClick={onStartAdventure}
                  disabled={battleTeam.length === 0}
                  className={`
                    flex-[2] md:flex-none justify-center shadow-lg transition-all text-base font-bold h-12 px-6
                    ${battleTeam.length > 0 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 border-red-400 animate-pulse-slow shadow-red-200 hover:scale-105' 
                      : 'bg-gray-300 border-gray-300 cursor-not-allowed text-white'}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>出発する！</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* SORT TABS */}
        {!isBattleMode && collection.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button 
              onClick={() => setSortOption('newest')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                sortOption === 'newest' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" /> 最新
            </button>
            <button 
              onClick={() => setSortOption('rarity')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                sortOption === 'rarity' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Star className="w-4 h-4" /> レア度
            </button>
            <button 
              onClick={() => setSortOption('power')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                sortOption === 'power' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <Trophy className="w-4 h-4" /> つよさ
            </button>
            <button 
              onClick={() => setSortOption('level')}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                sortOption === 'level' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <BarChart className="w-4 h-4" /> レベル
            </button>
          </div>
        )}
      </div>

      {/* COLLECTION GRID */}
      {collection.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-gray-300 mx-2">
          <p className="text-xl text-gray-500 font-bold mb-2">まだ モンスターがいません</p>
          <p className="text-gray-400 mb-6 text-sm">ゲームであそんで パートナーをみつけよう！</p>
          <Button onClick={onBack} size="md">トップにもどる</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-1">
          {sortedCollection.map((pet, index) => {
            const uniqueKey = `${pet.imagePrompt}-${pet.dateFound || index}`;
            const isLegendary = pet.rarity === 5;
            const borderColor = isLegendary ? 'border-yellow-400 ring-2 ring-yellow-200 shadow-yellow-100' :
                                pet.rarity === 4 ? 'border-pink-300 shadow-pink-100' : 
                                'border-transparent hover:border-pink-200';
            
            const selectionIndex = getSelectionIndex(pet);
            const isSelected = selectionIndex !== -1;
            const selectionOrder = selectionIndex + 1;

            const currentLevel = pet.level || 1;
            const currentXp = pet.xp || 0;
            const neededXp = 100;
            const xpPercent = Math.min(100, (currentXp / neededXp) * 100);

            const levelBadgeStyle = currentLevel >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 border-yellow-200' :
                                    currentLevel >= 20 ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-200' :
                                    'bg-black/50 border-white/20';

            const isRecentLevelUp = recentLevelUps.includes(uniqueKey);

            return (
              <div 
                key={uniqueKey} 
                onClick={() => {
                  if (isBattleMode && onTogglePet) {
                    onTogglePet(pet);
                  } else {
                    setSelectedPet(pet);
                  }
                }}
                className={`
                  bg-white rounded-2xl p-2.5 md:p-3 shadow-sm transition-all border-2 relative group overflow-hidden
                  ${isSelected ? 'border-red-500 ring-4 ring-red-100 bg-red-50 transform scale-[1.02] z-10' : borderColor}
                  ${isBattleMode ? 'cursor-pointer' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'}
                  ${isBattleMode && !isSelected && battleTeam.length >= 3 ? 'opacity-50 grayscale' : ''}
                  ${isRecentLevelUp ? 'ring-4 ring-yellow-300 animate-pulse' : ''}
                `}
              >
                {/* Level Up Overlay */}
                {isRecentLevelUp && (
                  <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                    <div className="absolute inset-0 bg-yellow-200 opacity-20 animate-ping"></div>
                    <div className="text-2xl font-black text-yellow-500 drop-shadow-md animate-float-up whitespace-nowrap bg-white/80 px-2 rounded-full border-2 border-yellow-400">
                      LEVEL UP!
                    </div>
                  </div>
                )}

                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-2 left-2 z-20 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-lg border-2 border-white shadow-lg animate-pop-in">
                    {selectionOrder}
                  </div>
                )}

                {/* Element Icon Badge */}
                <div className={`absolute top-2 right-2 w-7 h-7 rounded-full ${pet.element?.color || 'bg-gray-200'} flex items-center justify-center text-sm shadow-sm z-10 text-white border-2 border-white`}>
                  {pet.element?.icon || '?'}
                </div>
                
                {/* Level Badge */}
                <div className={`absolute top-2 left-2 z-10 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full border ${levelBadgeStyle}`}>
                  Lv.{currentLevel}
                </div>

                {/* Image Area */}
                <div className={`
                  bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-50 to-gray-100 
                  rounded-xl mb-2 overflow-hidden aspect-square relative
                  ${isLegendary ? 'from-yellow-50 to-orange-50' : ''}
                  ${isSelected ? 'from-red-100 to-orange-100' : ''}
                  ${isRecentLevelUp ? 'from-yellow-100 to-yellow-50' : ''}
                `}>
                  <PetImage src={pet.imageUrl} alt={pet.name} prompt={pet.imagePrompt} className="w-full h-full object-contain p-2 transition-transform group-hover:scale-110 duration-500" />
                  
                  {/* Mini XP Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-200">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300" style={{ width: `${xpPercent}%` }} />
                  </div>
                </div>
                
                {/* Info Area */}
                <div className="text-center">
                  <h3 className="font-bold text-gray-800 text-sm md:text-base truncate px-1 mb-1">
                    {pet.name}
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-0.5 text-xs bg-gray-50 rounded p-1.5 text-gray-500 font-bold">
                    <div className="flex flex-col items-center">
                      <Zap className="w-3 h-3 text-red-400 mb-0.5" />
                      {pet.stats?.power}
                    </div>
                    <div className="flex flex-col items-center border-l border-gray-200">
                      <Trophy className="w-3 h-3 text-blue-400 mb-0.5" />
                      {pet.stats?.speed}
                    </div>
                    <div className="flex flex-col items-center border-l border-gray-200">
                      <Star className="w-3 h-3 text-green-400 mb-0.5" />
                      {pet.stats?.smarts}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};