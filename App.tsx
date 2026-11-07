import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { QUESTIONS } from './constants';
import { AppState, GeneratedPet, Option, Stage, AppSettings } from './types';
import { generatePetProfile, generateEggPet } from './services/geminiService';
import { StartScreen } from './components/StartScreen';
import { QuestionScreen } from './components/QuestionScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { CollectionScreen } from './components/CollectionScreen';
import { BattleScreen, StageRunResult } from './components/BattleScreen';
import { StageSelectScreen } from './components/StageSelectScreen';
import { StageResultModal, StageOutcome } from './components/StageResultModal';
import { EvolveModal } from './components/EvolveModal';
import { EggModal } from './components/EggModal';
import { DailyModal } from './components/DailyModal';
import { playClickSound, setMuteSettings, startBgm } from './services/audioService';
import { gainXp, normalizePet, petKey } from './services/growth';
import { starsFor, xpForLoss } from './services/battle';
import { isBossPrompt, speciesOf } from './services/species';
import {
  EGG_INFO, EggTier, PlayerProgress, Reward, SnackType, SNACKS, StampResult,
  applyReward, claimDailyStamp, claimMission, ensureTodayMissions, eggFromStageClear, loadProgress,
  recordEvent, registerPetting, rewardLabel, saveProgress, warmEgg,
} from './services/progress';
import { Volume2, VolumeX, Music } from 'lucide-react';

const STORAGE_KEY = 'mystery-pet-collection';
const SETTINGS_STORAGE_KEY = 'mystery-pet-settings';
const SNACK_TYPES: SnackType[] = ['apple', 'candy', 'cake'];

type Celebration =
  | { kind: 'evolve'; pet: GeneratedPet }
  | { kind: 'egg_found'; tier: EggTier }
  | { kind: 'hatch'; pet: GeneratedPet; tier: EggTier };

const loadCollection = (): GeneratedPet[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return (JSON.parse(saved) as GeneratedPet[]).map(normalizePet);
  } catch (e) {
    console.error('Failed to parse collection', e);
  }
  return [];
};

// Species found so far (bosses are not part of the zukan).
export const foundSpecies = (collection: GeneratedPet[]) => {
  const found = new Map<number, { shiny: boolean }>();
  collection.forEach(p => {
    if (isBossPrompt(p.imagePrompt)) return;
    const no = speciesOf(p).no;
    found.set(no, { shiny: (found.get(no)?.shiny || false) || !!p.shiny });
  });
  return found;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.START);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{ pet: GeneratedPet; isNewSpecies: boolean } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [collection, setCollection] = useState<GeneratedPet[]>(loadCollection);
  const [progress, setProgress] = useState<PlayerProgress>(() => ensureTodayMissions(loadProgress()));

  const [settings, setSettings] = useState<AppSettings>({ seEnabled: true, bgmEnabled: false, speechEnabled: true, hiraganaMode: false });

  // Adventure
  const [battleTeam, setBattleTeam] = useState<GeneratedPet[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [battleKey, setBattleKey] = useState(0);
  const [isBattleModeInitial, setIsBattleModeInitial] = useState(false);
  const [outcome, setOutcome] = useState<StageOutcome | null>(null);
  const [celebrations, setCelebrations] = useState<Celebration[]>([]);
  const [afterOutcome, setAfterOutcome] = useState<Celebration[]>([]);
  const [recentLevelUps, setRecentLevelUps] = useState<string[]>([]);

  // Daily
  const [stampResult, setStampResult] = useState<StampResult | null>(null);
  const [showDaily, setShowDaily] = useState(false);

  const persistCollection = (next: GeneratedPet[]) => {
    setCollection(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save collection', e);
    }
  };

  const persistProgress = (next: PlayerProgress) => {
    setProgress(next);
    saveProgress(next);
  };

  // Mount: settings and the once-a-day stamp.
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        const parsed = { ...settings, ...JSON.parse(savedSettings) };
        setSettings(parsed);
        setMuteSettings(!parsed.seEnabled, !parsed.bgmEnabled);
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    const stamp = claimDailyStamp(progress);
    if (stamp.stamped) {
      persistProgress(stamp.progress);
      setStampResult(stamp);
      setShowDaily(true);
    } else {
      saveProgress(progress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const species = useMemo(() => foundSpecies(collection), [collection]);

  const saveSettings = (next: AppSettings) => {
    setSettings(next);
    setMuteSettings(!next.seEnabled, !next.bgmEnabled);
    try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const toggleSe = () => {
    const next = { ...settings, seEnabled: !settings.seEnabled };
    saveSettings(next);
    if (next.seEnabled) playClickSound();
  };

  const toggleBgm = () => {
    const next = { ...settings, bgmEnabled: !settings.bgmEnabled };
    saveSettings(next);
    if (next.bgmEnabled) startBgm('main');
  };

  // Adds a pet unless the same individual is already saved. Returns the collection to keep chaining.
  const addPet = (list: GeneratedPet[], pet: GeneratedPet): GeneratedPet[] => {
    if (list.some(p => p.imagePrompt === pet.imagePrompt)) return list;
    return [...list, normalizePet({ ...pet, dateFound: pet.dateFound || Date.now() })];
  };

  // --- Quiz ---
  const handleStart = () => {
    playClickSound();
    setAppState(AppState.QUIZ);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setErrorMsg('');
  };

  const handleAnswer = useCallback(async (option: Option) => {
    playClickSound();
    const newAnswers = [...answers, option.id];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }
    setAppState(AppState.LOADING);
    try {
      const pet = { ...(await generatePetProfile(newAnswers)), dateFound: Date.now() };
      setResult({ pet, isNewSpecies: !foundSpecies(collection).has(speciesOf(pet).no) });
      persistCollection(addPet(collection, pet));
      setAppState(AppState.RESULT);
    } catch (e) {
      console.error(e);
      setErrorMsg('ごめんね、うまくペットが見つからなかったみたい。もういちど やってみてね！');
      setAppState(AppState.ERROR);
    }
  }, [answers, currentQuestionIndex, collection]);

  const handleReset = () => {
    playClickSound();
    setAppState(AppState.START);
    setResult(null);
    setAnswers([]);
  };

  // --- Navigation ---
  const handleOpenCollection = () => {
    playClickSound();
    setIsBattleModeInitial(false);
    setRecentLevelUps([]);
    setAppState(AppState.COLLECTION);
  };

  const handleBattleFromStart = () => {
    playClickSound();
    if (collection.length === 0) {
      alert('まずは「あたらしく つくる」で\nパートナーを みつけてね！');
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

  const handleTeamToggle = (pet: GeneratedPet) => {
    playClickSound();
    setBattleTeam(prev => {
      const isSelected = prev.some(p => petKey(p) === petKey(pet));
      if (isSelected) return prev.filter(p => petKey(p) !== petKey(pet));
      if (prev.length >= 3) return prev;
      return [...prev, pet];
    });
  };

  const handleProceedToStageSelect = () => {
    playClickSound();
    if (battleTeam.length === 0) return;
    setAppState(AppState.STAGE_SELECT);
  };

  // Keep the team in sync with the latest saved pets (levels, stats) before each run.
  const refreshTeam = (list: GeneratedPet[]) =>
    battleTeam.map(t => list.find(p => petKey(p) === petKey(t)) || t);

  const startStage = (stage: Stage) => {
    playClickSound();
    setBattleTeam(refreshTeam(collection));
    setSelectedStage(stage);
    setOutcome(null);
    setBattleKey(k => k + 1);
    setAppState(AppState.BATTLE);
  };

  // --- Stage end: XP, evolution, stars, rewards, eggs ---
  const handleStageEnd = (run: StageRunResult) => {
    const stage = selectedStage;
    if (!stage) return;
    const teamKeys = battleTeam.map(petKey);
    const stars = run.cleared ? starsFor(run.faintedKeys.length) : 0;
    const xp = run.xp + (run.cleared ? stage.difficultyLevel * 20 : xpForLoss(stage.difficultyLevel));

    const evolved: GeneratedPet[] = [];
    const levelUps: StageOutcome['levelUps'] = [];
    let nextCollection = collection.map(p => {
      if (!teamKeys.includes(petKey(p))) return p;
      const r = gainXp(p, xp);
      if (r.levelsGained > 0) levelUps.push({ pet: r.pet, levels: r.levelsGained });
      if (r.evolvedTo) evolved.push(r.pet);
      return r.pet;
    });

    let p = progress;
    for (let i = 0; i < run.jankenWins; i++) p = recordEvent(p, { type: 'janken_win' });
    for (let i = 0; i < run.specials; i++) p = recordEvent(p, { type: 'special' });
    p = { ...p, stats: { ...p.stats, battlesWon: p.stats.battlesWon + run.defeated.length } };

    const rewards: string[] = [];
    const after: Celebration[] = [];
    const prevBest = p.stageStars[stage.id] || 0;
    if (run.cleared) {
      p = { ...p, stageStars: { ...p.stageStars, [stage.id]: Math.max(prevBest, stars) } };
      p = recordEvent(p, { type: 'stage_clear', elementIds: battleTeam.map(t => t.element.id), stars });

      // Snacks: one per star, two more the first time.
      const snackCount = stars + (prevBest === 0 ? 2 : 0);
      const gained: Partial<Record<SnackType, number>> = {};
      for (let i = 0; i < snackCount; i++) {
        const s = SNACK_TYPES[Math.floor(Math.random() * SNACK_TYPES.length)];
        gained[s] = (gained[s] || 0) + 1;
      }
      (Object.keys(gained) as SnackType[]).forEach(s => {
        const reward: Reward = { kind: 'snack', snack: s, amount: gained[s]! };
        p = applyReward(p, reward);
        rewards.push(rewardLabel(reward));
      });

      // Eggs: warm the one we carry (more for ★3); if none, find a new one.
      if (p.egg) {
        const warmed = { ...warmEgg(p, stars >= 3 ? 2 : 1) };
        if (warmed.hatchTier) {
          const info = EGG_INFO[warmed.hatchTier];
          const baby = generateEggPet(info.minRarity, info.shinyChance);
          nextCollection = addPet(nextCollection, baby);
          after.push({ kind: 'hatch', pet: baby, tier: warmed.hatchTier });
          if (baby.shiny) warmed.progress = { ...warmed.progress, stats: { ...warmed.progress.stats, shinyFound: warmed.progress.stats.shinyFound + 1 } };
        } else if (warmed.progress.egg) {
          rewards.push(`${EGG_INFO[warmed.progress.egg.tier].emoji} タマゴが あたたまった（${warmed.progress.egg.warmth}/${EGG_INFO[warmed.progress.egg.tier].need}）`);
        }
        p = warmed.progress;
      }
      if (!p.egg && !after.some(c => c.kind === 'hatch')) {
        const tier = eggFromStageClear(stars, stage.difficultyLevel);
        p = applyReward(p, { kind: 'egg', tier });
        after.push({ kind: 'egg_found', tier });
        rewards.push(`${EGG_INFO[tier].emoji} ${EGG_INFO[tier].label} を みつけた！`);
      }
    }

    persistCollection(nextCollection);
    persistProgress(p);
    setBattleTeam(refreshTeam(nextCollection));
    setRecentLevelUps(levelUps.map(l => petKey(l.pet)));
    setAfterOutcome(after);
    setCelebrations(evolved.map(pet => ({ kind: 'evolve' as const, pet })));
    setOutcome({
      stage,
      cleared: run.cleared,
      stars,
      firstClear: run.cleared && prevBest === 0,
      newBest: run.cleared && stars > prevBest,
      xp,
      levelUps,
      rewards,
      candidates: run.defeated,
    });
  };

  const handleRecruit = (enemy: GeneratedPet) => {
    const pet = normalizePet({ ...enemy, level: 1, xp: 0, friendship: 10, isBoss: false, dateFound: Date.now() });
    persistCollection(addPet(collection, pet));
    let p = recordEvent(progress, { type: 'recruit' });
    if (pet.shiny) p = { ...p, stats: { ...p.stats, shinyFound: p.stats.shinyFound + 1 } };
    persistProgress(p);
  };

  const closeOutcome = (next: () => void) => {
    setOutcome(null);
    setCelebrations(afterOutcome);
    setAfterOutcome([]);
    next();
  };

  // --- Care: petting is free (capped per day), snacks are items ---
  const updatePet = (pet: GeneratedPet) => {
    persistCollection(collection.map(p => (petKey(p) === petKey(pet) ? pet : p)));
  };

  const handlePetting = (pet: GeneratedPet): { pet: GeneratedPet; counted: boolean } => {
    const r = registerPetting(progress);
    if (!r.counted) return { pet, counted: false };
    const updated = { ...pet, friendship: Math.min(100, (pet.friendship || 0) + 4) };
    updatePet(updated);
    persistProgress(r.progress);
    return { pet: updated, counted: true };
  };

  const handleFeed = (pet: GeneratedPet, snack: SnackType): GeneratedPet | null => {
    if (progress.snacks[snack] <= 0) return null;
    const stat = SNACKS[snack].stat;
    const updated = {
      ...pet,
      friendship: Math.min(100, (pet.friendship || 0) + 8),
      stats: { ...pet.stats, [stat]: Math.min(999, pet.stats[stat] + 2) },
      lastFed: Date.now(),
    };
    updatePet(updated);
    persistProgress(recordEvent({ ...progress, snacks: { ...progress.snacks, [snack]: progress.snacks[snack] - 1 } }, { type: 'feed' }));
    return updated;
  };

  const handleFusionComplete = (pet: GeneratedPet) => {
    persistCollection(addPet(collection, pet));
  };

  const handleClaimMission = (id: string) => {
    playClickSound();
    persistProgress(claimMission(progress, id));
  };

  const currentCelebration = celebrations[0];
  const popCelebration = () => setCelebrations(c => c.slice(1));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-blue-100 font-sans text-gray-800">
      <header className="p-3 md:p-4 flex justify-between items-center max-w-4xl mx-auto">
        <div className="cursor-pointer text-xl font-black text-pink-400 tracking-widest opacity-70 hover:opacity-100 transition select-none" onClick={appState === AppState.BATTLE ? undefined : handleBackToStart}>
          おもちゃいろ図鑑
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSe} title="効果音 (SE)"
            className={`p-2 rounded-full border transition ${settings.seEnabled ? 'bg-white text-pink-500 border-pink-200 shadow-sm' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
            {settings.seEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={toggleBgm} title="BGM"
            className={`p-2 rounded-full border transition ${settings.bgmEnabled ? 'bg-pink-500 text-white border-pink-600 shadow-sm animate-pulse' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
            <Music className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container mx-auto px-2 md:px-4 py-2 md:py-6 max-w-4xl relative">
        {/* Celebrations first, then the stage result */}
        {currentCelebration?.kind === 'evolve' && <EvolveModal key={petKey(currentCelebration.pet)} pet={currentCelebration.pet} onClose={popCelebration} />}
        {currentCelebration?.kind === 'egg_found' && <EggModal mode="found" tier={currentCelebration.tier} onClose={popCelebration} />}
        {currentCelebration?.kind === 'hatch' && <EggModal mode="hatched" tier={currentCelebration.tier} pet={currentCelebration.pet} onClose={popCelebration} />}
        {!currentCelebration && outcome && (
          <StageResultModal
            outcome={outcome}
            onRecruit={handleRecruit}
            onRetry={() => closeOutcome(() => startStage(outcome.stage))}
            onStageSelect={() => closeOutcome(() => setAppState(AppState.STAGE_SELECT))}
            onExit={() => closeOutcome(() => { setIsBattleModeInitial(false); setBattleTeam([]); setAppState(AppState.COLLECTION); })}
          />
        )}
        {showDaily && (
          <DailyModal
            progress={progress}
            stampResult={stampResult}
            onClaimMission={handleClaimMission}
            onClose={() => { setShowDaily(false); setStampResult(null); }}
          />
        )}

        {appState === AppState.START && (
          <StartScreen
            onStart={handleStart}
            onOpenCollection={handleOpenCollection}
            onStartBattle={handleBattleFromStart}
            onOpenDaily={() => { playClickSound(); setShowDaily(true); }}
            collectionCount={collection.length}
            speciesCount={species.size}
            progress={progress}
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

        {appState === AppState.LOADING && <LoadingScreen />}

        {appState === AppState.RESULT && result && (
          <ResultScreen pet={result.pet} isNewSpecies={result.isNewSpecies} onReset={handleReset} />
        )}

        {appState === AppState.COLLECTION && (
          <CollectionScreen
            collection={collection}
            onBack={handleBackToStart}
            initialBattleMode={isBattleModeInitial}
            battleTeam={battleTeam}
            onTogglePet={handleTeamToggle}
            onStartAdventure={handleProceedToStageSelect}
            progress={progress}
            species={species}
            onPet={handlePetting}
            onFeed={handleFeed}
            onFusionComplete={handleFusionComplete}
            recentLevelUps={recentLevelUps}
            onClearLevelUps={() => setRecentLevelUps([])}
          />
        )}

        {appState === AppState.STAGE_SELECT && battleTeam.length > 0 && (
          <StageSelectScreen
            playerTeam={battleTeam}
            stageStars={progress.stageStars}
            speciesCount={species.size}
            onSelectStage={startStage}
            onBack={() => setAppState(AppState.COLLECTION)}
          />
        )}

        {appState === AppState.BATTLE && battleTeam.length > 0 && selectedStage && (
          <BattleScreen
            key={battleKey}
            playerTeam={battleTeam}
            stage={selectedStage}
            onStageEnd={handleStageEnd}
            onEscape={() => setAppState(AppState.STAGE_SELECT)}
          />
        )}

        {appState === AppState.ERROR && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
            <div className="text-6xl mb-4">😢</div>
            <p className="text-xl font-bold text-gray-700 mb-6">{errorMsg}</p>
            <button onClick={handleReset} className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-700 transition">
              トップにもどる
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
