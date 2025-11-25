import React, { useState, useCallback, useEffect } from 'react';
import { QUESTIONS } from './constants';
import { AppState, GeneratedPet, Option, Stage } from './types';
import { generatePetProfile, generatePetImage, generateRandomPet, getFallbackImageUrl } from './services/geminiService';
import { StartScreen } from './components/StartScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { CollectionScreen } from './components/CollectionScreen';
import { BattleScreen } from './components/BattleScreen';
import { StageSelectScreen } from './components/StageSelectScreen';
import { EggModal } from './components/EggModal';

const STORAGE_KEY = 'mystery-pet-collection';
const EGG_STORAGE_KEY = 'mystery-pet-has-egg';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<GeneratedPet | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [collection, setCollection] = useState<GeneratedPet[]>([]);
  
  // Battle State
  const [battleTeam, setBattleTeam] = useState<GeneratedPet[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [isBattleModeInitial, setIsBattleModeInitial] = useState(false);
  const [preparedEnemy, setPreparedEnemy] = useState<GeneratedPet | null>(null);

  // Level Up Tracking
  const [recentLevelUps, setRecentLevelUps] = useState<string[]>([]);

  // Egg State
  const [hasEgg, setHasEgg] = useState(false);
  const [eggModalState, setEggModalState] = useState<{ mode: 'found' | 'hatched', pet?: GeneratedPet } | null>(null);

  // Load collection and egg state on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setCollection(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse collection", e);
      }
    }
    const savedEgg = localStorage.getItem(EGG_STORAGE_KEY);
    if (savedEgg === 'true') {
        setHasEgg(true);
    }
  }, []);

  const updateEggState = (state: boolean) => {
      setHasEgg(state);
      localStorage.setItem(EGG_STORAGE_KEY, String(state));
  };

  // Save pet to collection (and save collection to storage)
  const saveToCollection = (pet: GeneratedPet, updateExisting: boolean = false) => {
    setCollection(prev => {
      // Check for duplicates based on name and imagePrompt
      const index = prev.findIndex(p => p.imagePrompt === pet.imagePrompt);
      
      let newCollection;
      if (index !== -1) {
        if (updateExisting) {
            // Update existing pet (e.g. stats, level)
            newCollection = [...prev];
            newCollection[index] = pet;
        } else {
            return prev; // Do nothing if exists and not updating
        }
      } else {
        // Add new
        newCollection = [...prev, { ...pet, dateFound: Date.now(), level: 1, xp: 0 }];
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCollection));
      return newCollection;
    });
  };

  const updateCollectionList = (newCollection: GeneratedPet[]) => {
      setCollection(newCollection);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCollection));
  };

  const handleStart = () => {
    setAppState(AppState.QUIZ);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setErrorMsg("");
  };

  const handleOpenCollection = () => {
    setIsBattleModeInitial(false);
    setRecentLevelUps([]); // Clear when just opening manually
    setAppState(AppState.COLLECTION);
  };

  // Direct Battle Entry from Start Screen
  const handleBattleFromStart = () => {
    if (collection.length === 0) {
        alert("まずは「あたらしく つくる」で\nパートナーを みつけてね！");
        return;
    }
    setIsBattleModeInitial(true);
    setRecentLevelUps([]);
    setAppState(AppState.COLLECTION);
  };

  const handleBackToStart = () => {
    setAppState(AppState.START);
  };

  const handleAnswer = useCallback(async (option: Option) => {
    const newAnswers = [...answers, option.label];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz finished, start generation
      setAppState(AppState.LOADING);
      try {
        // Step 1: Generate Text Profile (Local Logic)
        const profile = await generatePetProfile(newAnswers);
        
        // Step 2: Generate Image (DiceBear API)
        const imageUrl = await generatePetImage(profile.imagePrompt);

        const newPet = {
          ...profile,
          imageUrl,
          level: 1,
          xp: 0
        };

        setResult(newPet);
        saveToCollection(newPet); // Save immediately
        setAppState(AppState.RESULT);
      } catch (e) {
        console.error(e);
        setErrorMsg("ごめんね、うまくペットが見つからなかったみたい。もういちど やってみてね！");
        setAppState(AppState.ERROR);
      }
    }
  }, [answers, currentQuestionIndex]);

  const handleReset = () => {
    setAppState(AppState.START);
    setResult(null);
    setAnswers([]);
  };

  // --- Battle Handlers ---
  
  // Toggle pet selection for team (Max 3)
  const handleTeamToggle = (pet: GeneratedPet) => {
    setBattleTeam(prev => {
        // Identify unique pet (using dateFound or fallback to prompt+name)
        const uniqueId = (p: GeneratedPet) => `${p.imagePrompt}-${p.dateFound}`;
        
        const isSelected = prev.some(p => uniqueId(p) === uniqueId(pet));
        
        if (isSelected) {
            // Remove
            return prev.filter(p => uniqueId(p) !== uniqueId(pet));
        }
        
        if (prev.length >= 3) {
            // Max reached
            return prev;
        }
        
        // Add
        return [...prev, pet];
    });
  };

  const handleProceedToStageSelect = () => {
    if (battleTeam.length === 0) return;
    setAppState(AppState.STAGE_SELECT);
  };

  const handleStageSelection = (stage: Stage, enemy: GeneratedPet) => {
    setSelectedStage(stage);
    setPreparedEnemy(enemy);
    setAppState(AppState.BATTLE);
  };

  const handleBattleEnd = async (won: boolean, enemyPet?: GeneratedPet) => {
    // 1. Grant XP to Team (Fixed 100XP / 120XP / 60XP logic)
    const XP_PER_LEVEL = 100;
    const XP_GAIN_WIN = 120;
    const XP_GAIN_LOSS = 60;
    
    const xpAmount = won ? XP_GAIN_WIN : XP_GAIN_LOSS;
    const STAT_CAP = 999;

    const currentLevelUps: string[] = [...recentLevelUps];

    const newCollection = collection.map(pet => {
        // Check if pet was in the battle team
        const isInTeam = battleTeam.some(
            teamPet => teamPet.imagePrompt === pet.imagePrompt && teamPet.dateFound === pet.dateFound
        );

        if (!isInTeam) return pet;

        // Level Up Logic
        let newXp = (pet.xp || 0) + xpAmount;
        let newLevel = pet.level || 1;
        let newStats = { ...pet.stats };
        
        const oldLevel = pet.level || 1;

        // Handle multi-level ups
        while (newXp >= XP_PER_LEVEL) {
            newXp -= XP_PER_LEVEL;
            newLevel += 1;
            // Boost Stats (Clamp at 999)
            newStats.power = Math.min(STAT_CAP, newStats.power + 5);
            newStats.speed = Math.min(STAT_CAP, newStats.speed + 5);
            newStats.smarts = Math.min(STAT_CAP, newStats.smarts + 5);
        }

        if (newLevel > oldLevel) {
            currentLevelUps.push(`${pet.imagePrompt}-${pet.dateFound}`);
        }

        return {
            ...pet,
            level: newLevel,
            xp: newXp,
            stats: newStats
        };
    });

    updateCollectionList(newCollection);
    setRecentLevelUps(currentLevelUps);

    // 2. Recruit Enemy if Won
    if (won && enemyPet) {
      saveToCollection({ ...enemyPet, level: 1, xp: 0 }, false);
    }

    // 3. Return to collection
    setIsBattleModeInitial(false);
    setAppState(AppState.COLLECTION);
    setBattleTeam([]); // Reset team
    setSelectedStage(null);
    setPreparedEnemy(null);

    // 4. Egg Logic
    if (hasEgg) {
        // Hatch Egg
        try {
            // Generate random pet for hatching (random level 1-3 difficulty)
            const difficulty = Math.floor(Math.random() * 3) + 1;
            const profile = await generateRandomPet(difficulty, 20);
            const imageUrl = await generatePetImage(profile.imagePrompt);
            const newPet = { ...profile, imageUrl, level: 1, xp: 0, dateFound: Date.now() };
            
            saveToCollection(newPet, false);
            updateEggState(false); // Egg used
            setEggModalState({ mode: 'hatched', pet: newPet });
        } catch (e) {
            console.error("Egg Hatch Error", e);
        }
    } else {
        // Find Egg
        updateEggState(true);
        setEggModalState({ mode: 'found' });
    }
  };

  const handleNextBattle = async () => {
    if (!selectedStage) return;

    const XP_PER_LEVEL = 100;
    const XP_GAIN_WIN = 120;
    const STAT_CAP = 999;
    
    const currentLevelUps: string[] = [...recentLevelUps];

    const newCollection = collection.map(pet => {
        const isInTeam = battleTeam.some(teamPet => teamPet.imagePrompt === pet.imagePrompt && teamPet.dateFound === pet.dateFound);
        if (!isInTeam) return pet;
        
        let newXp = (pet.xp || 0) + XP_GAIN_WIN;
        let newLevel = pet.level || 1;
        let newStats = { ...pet.stats };
        
        const oldLevel = pet.level || 1;

        while (newXp >= XP_PER_LEVEL) {
            newXp -= XP_PER_LEVEL;
            newLevel += 1;
            newStats.power = Math.min(STAT_CAP, newStats.power + 5);
            newStats.speed = Math.min(STAT_CAP, newStats.speed + 5);
            newStats.smarts = Math.min(STAT_CAP, newStats.smarts + 5);
        }

        if (newLevel > oldLevel) {
            currentLevelUps.push(`${pet.imagePrompt}-${pet.dateFound}`);
        }

        return { ...pet, level: newLevel, xp: newXp, stats: newStats };
    });
    // Update local state and storage
    updateCollectionList(newCollection);
    setRecentLevelUps(currentLevelUps);

    // Update the active battle team references so they show new stats
    const updatedTeam = newCollection.filter(pet => 
        battleTeam.some(teamPet => teamPet.imagePrompt === pet.imagePrompt && teamPet.dateFound === pet.dateFound)
    );
    setBattleTeam(updatedTeam);


    // Prepare Next Enemy
    try {
        const profile = await generateRandomPet(selectedStage.difficultyLevel, selectedStage.minStats, selectedStage.id);
        const imageUrl = await generatePetImage(profile.imagePrompt);
        
        // Preload
        const img = new Image();
        img.src = imageUrl;
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setPreparedEnemy({ ...profile, imageUrl });
        };
        img.onerror = () => {
            const safeUrl = getFallbackImageUrl(profile.imagePrompt);
            setPreparedEnemy({ ...profile, imageUrl: safeUrl });
        };
    } catch (e) {
        console.error("Next battle error", e);
    }
  };

  const handleRecruit = (enemyPet: GeneratedPet) => {
      saveToCollection({ ...enemyPet, level: 1, xp: 0 });
      alert(`${enemyPet.name} を仲間にした！`);
  };

  const handleClearLevelUps = () => {
      setRecentLevelUps([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 font-sans text-gray-800">
        {/* Simple Header */}
      <header className="p-4 flex justify-center cursor-pointer" onClick={handleBackToStart}>
         <div className="text-xl font-black text-pink-400 tracking-widest uppercase opacity-50 select-none">
            おもちゃいろ図鑑
         </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8 max-w-4xl relative">
        {/* EGG MODAL */}
        {eggModalState && (
            <EggModal 
                mode={eggModalState.mode} 
                pet={eggModalState.pet} 
                onClose={() => setEggModalState(null)} 
            />
        )}

        {appState === AppState.START && (
          <StartScreen 
            onStart={handleStart} 
            onOpenCollection={handleOpenCollection}
            onStartBattle={handleBattleFromStart}
            collectionCount={collection.length}
          />
        )}

        {appState === AppState.QUIZ && (
          <QuestionScreen
            question={QUESTIONS[currentQuestionIndex]}
            onAnswer={handleAnswer}
            currentStepIndex={currentQuestionIndex}
            totalSteps={QUESTIONS.length}
          />
        )}

        {appState === AppState.LOADING && (
          <LoadingScreen />
        )}

        {appState === AppState.RESULT && result && (
          <ResultScreen pet={result} onReset={handleReset} />
        )}

        {appState === AppState.COLLECTION && (
          <CollectionScreen 
            collection={collection} 
            onBack={handleBackToStart} 
            
            // Battle Props
            initialBattleMode={isBattleModeInitial}
            battleTeam={battleTeam}
            onTogglePet={handleTeamToggle}
            onStartAdventure={handleProceedToStageSelect}
            hasEgg={hasEgg}

            // Level Up Props
            recentLevelUps={recentLevelUps}
            onClearLevelUps={handleClearLevelUps}
          />
        )}

        {appState === AppState.STAGE_SELECT && battleTeam.length > 0 && (
          <StageSelectScreen 
            playerTeam={battleTeam}
            collectionCount={collection.length}
            onSelectStage={handleStageSelection}
            onBack={() => setAppState(AppState.COLLECTION)}
          />
        )}

        {appState === AppState.BATTLE && battleTeam.length > 0 && selectedStage && preparedEnemy && (
          <BattleScreen
             key={preparedEnemy.imagePrompt} // Force re-render on new enemy
             playerTeam={battleTeam}
             stage={selectedStage}
             initialEnemy={preparedEnemy}
             onBattleEnd={handleBattleEnd}
             onBack={() => setAppState(AppState.STAGE_SELECT)}
             onNextBattle={handleNextBattle}
             onRecruit={handleRecruit}
          />
        )}

        {appState === AppState.ERROR && (
           <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
             <div className="text-6xl mb-4">😢</div>
             <p className="text-xl font-bold text-gray-700 mb-6">{errorMsg}</p>
             <button 
               onClick={handleReset}
               className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition"
             >
               トップにもどる
             </button>
           </div>
        )}
      </main>
    </div>
  );
};

export default App;