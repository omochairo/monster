import React, { useState, useCallback, useEffect } from 'react';
import { QUESTIONS } from './constants';
import { AppState, GeneratedPet, Option, Stage, AppSettings } from './types';
import { generatePetProfile, generatePetImage, generateRandomPet, getFallbackImageUrl } from './services/geminiService';
import { StartScreen } from './components/StartScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { CollectionScreen } from './components/CollectionScreen';
import { BattleScreen } from './components/BattleScreen';
import { StageSelectScreen } from './components/StageSelectScreen';
import { EggModal } from './components/EggModal';
import { playClickSound, setMuteSettings, startBgm } from './services/audioService';
import { Volume2, VolumeX, Music } from 'lucide-react';

const STORAGE_KEY = 'mystery-pet-collection';
const EGG_STORAGE_KEY = 'mystery-pet-has-egg';
const SETTINGS_STORAGE_KEY = 'mystery-pet-settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<GeneratedPet | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [collection, setCollection] = useState<GeneratedPet[]>([]);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>({
    seEnabled: true,
    bgmEnabled: false,
    speechEnabled: true,
    hiraganaMode: false
  });

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

  // Load state on mount
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
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        setMuteSettings(!parsed.seEnabled, !parsed.bgmEnabled);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const toggleSe = () => {
    const newSettings = { ...settings, seEnabled: !settings.seEnabled };
    setSettings(newSettings);
    setMuteSettings(!newSettings.seEnabled, !newSettings.bgmEnabled);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    if (newSettings.seEnabled) playClickSound();
  };

  const toggleBgm = () => {
    const newSettings = { ...settings, bgmEnabled: !settings.bgmEnabled };
    setSettings(newSettings);
    setMuteSettings(!newSettings.seEnabled, !newSettings.bgmEnabled);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    if (newSettings.bgmEnabled) {
      startBgm('main');
    }
  };

  const updateEggState = (state: boolean) => {
    setHasEgg(state);
    localStorage.setItem(EGG_STORAGE_KEY, String(state));
  };

  const saveToCollection = (pet: GeneratedPet, updateExisting: boolean = false) => {
    setCollection(prev => {
      const index = prev.findIndex(p => p.imagePrompt === pet.imagePrompt);
      let newCollection;
      if (index !== -1) {
        if (updateExisting) {
          newCollection = [...prev];
          newCollection[index] = pet;
        } else {
          return prev;
        }
      } else {
        newCollection = [...prev, { ...pet, dateFound: Date.now(), level: 1, xp: 0, friendship: 0 }];
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
    playClickSound();
    setAppState(AppState.QUIZ);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setErrorMsg("");
  };

  const handleOpenCollection = () => {
    playClickSound();
    setIsBattleModeInitial(false);
    setRecentLevelUps([]);
    setAppState(AppState.COLLECTION);
  };

  const handleBattleFromStart = () => {
    playClickSound();
    if (collection.length === 0) {
      alert("まずは「あたらしく つくる」で\nパートナーを みつけてね！");
      return;
    }
    setIsBattleModeInitial(true);
    setRecentLevelUps([]);
    setAppState(AppState.COLLECTION);
  };

  const handleBackToStart = () => {
    playClickSound();
    setAppState(AppState.START);
  };

  const handleAnswer = useCallback(async (option: Option) => {
    playClickSound();
    const newAnswers = [...answers, option.label];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState(AppState.LOADING);
      try {
        const profile = await generatePetProfile(newAnswers);
        const imageUrl = await generatePetImage(profile.imagePrompt);

        const newPet = {
          ...profile,
          imageUrl,
          level: 1,
          xp: 0,
          friendship: 20
        };

        setResult(newPet);
        saveToCollection(newPet);
        setAppState(AppState.RESULT);
      } catch (e) {
        console.error(e);
        setErrorMsg("ごめんね、うまくペットが見つからなかったみたい。もういちど やってみてね！");
        setAppState(AppState.ERROR);
      }
    }
  }, [answers, currentQuestionIndex]);

  const handleReset = () => {
    playClickSound();
    setAppState(AppState.START);
    setResult(null);
    setAnswers([]);
  };

  // --- Battle Handlers ---
  const handleTeamToggle = (pet: GeneratedPet) => {
    playClickSound();
    setBattleTeam(prev => {
      const uniqueId = (p: GeneratedPet) => `${p.imagePrompt}-${p.dateFound}`;
      const isSelected = prev.some(p => uniqueId(p) === uniqueId(pet));
      if (isSelected) {
        return prev.filter(p => uniqueId(p) !== uniqueId(pet));
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, pet];
    });
  };

  const handleProceedToStageSelect = () => {
    playClickSound();
    if (battleTeam.length === 0) return;
    setAppState(AppState.STAGE_SELECT);
  };

  const handleStageSelection = (stage: Stage, enemy: GeneratedPet) => {
    playClickSound();
    setSelectedStage(stage);
    setPreparedEnemy(enemy);
    setAppState(AppState.BATTLE);
  };

  const handleBattleEnd = async (won: boolean, enemyPet?: GeneratedPet) => {
    const XP_PER_LEVEL = 100;
    const XP_GAIN_WIN = 120;
    const XP_GAIN_LOSS = 60;
    
    const xpAmount = won ? XP_GAIN_WIN : XP_GAIN_LOSS;
    const STAT_CAP = 999;
    const currentLevelUps: string[] = [...recentLevelUps];

    const newCollection = collection.map(pet => {
      const isInTeam = battleTeam.some(
        teamPet => teamPet.imagePrompt === pet.imagePrompt && teamPet.dateFound === pet.dateFound
      );

      if (!isInTeam) return pet;

      let newXp = (pet.xp || 0) + xpAmount;
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

      return {
        ...pet,
        level: newLevel,
        xp: newXp,
        stats: newStats
      };
    });

    updateCollectionList(newCollection);
    setRecentLevelUps(currentLevelUps);

    if (won && enemyPet) {
      saveToCollection({ ...enemyPet, level: 1, xp: 0, friendship: 0 }, false);
    }

    setIsBattleModeInitial(false);
    setAppState(AppState.COLLECTION);
    setBattleTeam([]);
    setSelectedStage(null);
    setPreparedEnemy(null);

    if (hasEgg) {
      try {
        const difficulty = Math.floor(Math.random() * 3) + 1;
        const profile = await generateRandomPet(difficulty, 20);
        const imageUrl = await generatePetImage(profile.imagePrompt);
        const newPet = { ...profile, imageUrl, level: 1, xp: 0, friendship: 30, dateFound: Date.now() };
        
        saveToCollection(newPet, false);
        updateEggState(false);
        setEggModalState({ mode: 'hatched', pet: newPet });
      } catch (e) {
        console.error("Egg Hatch Error", e);
      }
    } else {
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

    updateCollectionList(newCollection);
    setRecentLevelUps(currentLevelUps);

    const updatedTeam = newCollection.filter(pet => 
      battleTeam.some(teamPet => teamPet.imagePrompt === pet.imagePrompt && teamPet.dateFound === pet.dateFound)
    );
    setBattleTeam(updatedTeam);

    try {
      const profile = await generateRandomPet(selectedStage.difficultyLevel, selectedStage.minStats, selectedStage.id);
      const imageUrl = await generatePetImage(profile.imagePrompt);
      
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
      {/* Header with Title and Quick Sound Controls */}
      <header className="p-3 md:p-4 flex justify-between items-center max-w-4xl mx-auto">
        <div className="cursor-pointer text-xl font-black text-pink-400 tracking-widest uppercase opacity-70 hover:opacity-100 transition select-none" onClick={handleBackToStart}>
          おもちゃいろ図鑑
        </div>

        {/* Audio Toggle Controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleSe}
            className={`p-2 rounded-full border transition ${settings.seEnabled ? 'bg-white text-pink-500 border-pink-200 shadow-sm' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
            title="効果音 (SE)"
          >
            {settings.seEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={toggleBgm}
            className={`p-2 rounded-full border transition ${settings.bgmEnabled ? 'bg-pink-500 text-white border-pink-600 shadow-sm animate-pulse' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
            title="BGM"
          >
            <Music className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-2 md:py-6 max-w-4xl relative">
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
            onUpdateCollection={updateCollectionList}
            
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
            key={preparedEnemy.imagePrompt}
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