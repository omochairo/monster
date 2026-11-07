import React, { useEffect, useState, useRef } from 'react';
import { GeneratedPet, Stage } from '../types';
import { Button } from './Button';
import { calculateTypeMultiplier } from '../services/geminiService';
import { ArrowRight, Zap, Sparkles, Lock } from 'lucide-react';
import { PetImage } from './PetImage';
import { BattleResultModal } from './BattleResultModal';
import { playAttackSound, playSuperpowerSound, playVictorySound, startBgm, stopBgm } from '../services/audioService';
import { triggerConfetti } from '../services/confetti';

interface BattleScreenProps {
  playerTeam: GeneratedPet[];
  stage: Stage;
  initialEnemy: GeneratedPet;
  onBattleEnd: (won: boolean, enemyPet?: GeneratedPet) => void;
  onBack: () => void;
  onNextBattle?: () => void;
  onRecruit?: (enemyPet: GeneratedPet) => void;
}

type BattlePhase = 'intro' | 'countdown' | 'clash' | 'impact' | 'round_result' | 'final_result';

export const BattleScreen: React.FC<BattleScreenProps> = ({ 
  playerTeam, 
  stage, 
  initialEnemy, 
  onBattleEnd, 
  onBack,
  onNextBattle,
  onRecruit
}) => {
  const [enemyPet] = useState<GeneratedPet>(initialEnemy);
  const [activePet, setActivePet] = useState<GeneratedPet | null>(null);
  
  const [phase, setPhase] = useState<BattlePhase>('intro');
  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState({ player: 0, enemy: 0 });
  const scoresRef = useRef({ player: 0, enemy: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  
  // Battle state for animation
  const [playerDamage, setPlayerDamage] = useState<string | null>(null);
  const [enemyDamage, setEnemyDamage] = useState<string | null>(null);
  const [roundWinner, setRoundWinner] = useState<'player' | 'enemy' | null>(null);
  const [typeEffectiveness, setTypeEffectiveness] = useState<string | null>(null);

  // Special Move (とくぎ) State - Starts at 0% and charges during battle
  const [specialGauge, setSpecialGauge] = useState(0);
  const [isSuperpowerActive, setIsSuperpowerActive] = useState(false);
  const [showCutIn, setShowCutIn] = useState(false);

  // Recruitment state
  const [hasRecruited, setHasRecruited] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Start BGM on mount
  useEffect(() => {
    startBgm(stage.difficultyLevel >= 5 ? 'boss' : 'battle');
    return () => stopBgm();
  }, [stage]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleChooseFighter = (pet: GeneratedPet) => {
    setActivePet(pet);
    setSpecialGauge(0); // Starts at 0%
    scoresRef.current = { player: 0, enemy: 0 };
    setScores({ player: 0, enemy: 0 });
    setLogs(["バトル スタート！", `ゆけっ！ ${pet.name}！`, `あいては ${enemyPet?.name} だ！`]);
    setPhase('countdown');
    setTimeout(() => {
      runRound(1, pet, false);
    }, 1500);
  };

  const triggerSuperpower = () => {
    if (specialGauge < 100 || !activePet || isSuperpowerActive) return;
    setIsSuperpowerActive(true);
    setSpecialGauge(0);
    setShowCutIn(true);
    playSuperpowerSound();
    addLog(`✨ 【必殺とくぎセット！】${activePet.superpower}`);

    setTimeout(() => {
      setShowCutIn(false);
    }, 1800);
  };

  const handleRetry = () => {
    setPhase('intro');
    setCurrentRound(1);
    scoresRef.current = { player: 0, enemy: 0 };
    setScores({ player: 0, enemy: 0 });
    setLogs([]);
    setActivePet(null);
    setHasRecruited(false);
    setSpecialGauge(0);
    setIsSuperpowerActive(false);
  };

  const runRound = (round: number, currentFighter: GeneratedPet, useSuperpower: boolean) => {
    if (!enemyPet || !currentFighter) return;
    
    try {
      setCurrentRound(round);
      setPhase('clash');
      setPlayerDamage(null);
      setEnemyDamage(null);
      setRoundWinner(null);
      setTypeEffectiveness(null);

      let playerBase = 0;
      let enemyBase = 0;
      let statLabel = "";

      if (round === 1) {
        playerBase = currentFighter.stats.power;
        enemyBase = enemyPet.stats.power;
        statLabel = "パワー";
      } else if (round === 2) {
        playerBase = currentFighter.stats.speed;
        enemyBase = enemyPet.stats.speed;
        statLabel = "スピード";
      } else {
        playerBase = currentFighter.stats.smarts;
        enemyBase = enemyPet.stats.smarts;
        statLabel = "かしこさ";
      }
      
      setTimeout(() => addLog(`--- ラウンド ${round} (${statLabel}) ---`), 100);

      setTimeout(() => {
        const playerMult = calculateTypeMultiplier(currentFighter.element.id, enemyPet.element.id);
        const enemyMult = calculateTypeMultiplier(enemyPet.element.id, currentFighter.element.id);
        
        const getVariance = () => (0.8 + Math.random() * 0.4);
        const isCrit = () => Math.random() > 0.85;
        const playerCrit = isCrit() || isSuperpowerActive;
        const enemyCrit = isCrit();

        const superpowerBonus = isSuperpowerActive ? 2.5 : 1.0;

        const playerTotal = Math.floor(playerBase * playerMult * getVariance() * (playerCrit ? 1.5 : 1) * superpowerBonus);
        const enemyTotal = Math.floor(enemyBase * enemyMult * getVariance() * (enemyCrit ? 1.5 : 1));

        setPhase('impact');
        playAttackSound();
        setPlayerDamage(playerTotal.toString());
        setEnemyDamage(enemyTotal.toString());
        
        if (isSuperpowerActive) setTypeEffectiveness(`✨ 必殺技！${currentFighter.superpower} ✨`);
        else if (playerMult > 1.2) setTypeEffectiveness("こうかは バツグンだ！");
        else if (playerMult < 0.9) setTypeEffectiveness("こうかは いまひとつ...");
        else if (playerCrit) setTypeEffectiveness("クリティカルヒット！");
        else setTypeEffectiveness("");

        setTimeout(() => {
          if (isSuperpowerActive) addLog(`🌟 【必殺技】${currentFighter.superpower} が 炸裂！`);
          else if (playerCrit) addLog(`⚡ キミの クリティカルヒット！`);
          if (playerMult > 1.2) addLog(`🔥 あいての 弱点をついた！`);
          addLog(`👊 キミのこうげき: ${playerTotal}`);
          addLog(`🛡️ あいてのこうげき: ${enemyTotal}`);

          const pWin = playerTotal >= enemyTotal;
          setRoundWinner(pWin ? 'player' : 'enemy');

          if (pWin) {
            scoresRef.current.player += 1;
            setScores({ ...scoresRef.current });
            addLog(`>> 🏆 キミの かち！`);
          } else {
            scoresRef.current.enemy += 1;
            setScores({ ...scoresRef.current });
            addLog(`>> 💀 あいての かち...`);
          }

          // Refill Special Gauge per round (+50% so it hits 100% by Round 2/3)
          setSpecialGauge(g => Math.min(100, g + 50));
          setIsSuperpowerActive(false);

          setTimeout(() => {
            if (round < 3) {
              runRound(round + 1, currentFighter, false);
            } else {
              setPhase('final_result');
              addLog("--- けっちゃく ---");

              if (scoresRef.current.player >= scoresRef.current.enemy) {
                playVictorySound();
                triggerConfetti(4000);
              }
            }
          }, 2500); 
        }, 300); 

      }, 800); 

    } catch (error) {
      console.error("Battle Error:", error);
      addLog("エラーが発生しました。");
      setPhase('final_result');
    }
  };

  const playerWonMatch = scores.player > scores.enemy;

  const handleRecruitClick = () => {
    if (onRecruit && enemyPet) {
      onRecruit(enemyPet);
      setHasRecruited(true);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-2 md:p-4 flex flex-col items-center min-h-[90vh] overflow-hidden relative rounded-xl bg-gradient-to-b ${stage.bgGradient}`}>
      
      {/* --- CUT-IN OVERLAY (SUPERPOWER) --- */}
      {showCutIn && activePet && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
          <div className="text-yellow-300 font-black text-3xl md:text-5xl animate-bounce mb-4 text-center drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]">
            【 必殺とくぎ 発動！！ 】
          </div>
          <div className="w-56 h-56 relative animate-pop-in">
            <PetImage src={activePet.imageUrl} prompt={activePet.imagePrompt} alt={activePet.name} className="w-full h-full object-contain drop-shadow-2xl animate-pulse" />
          </div>
          <div className="text-white font-black text-xl md:text-2xl bg-pink-600 px-6 py-2 rounded-full mt-4 border-2 border-yellow-300 animate-slide-up shadow-2xl text-center max-w-md mx-4">
            {activePet.superpower}
          </div>
        </div>
      )}

      {/* --- HEADER SCOREBOARD --- */}
      <div className="w-full bg-gray-900 text-white p-3 rounded-2xl shadow-lg flex justify-between items-center mb-3 z-20 relative border-2 border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < scores.player ? 'bg-yellow-400 animate-pulse' : 'bg-gray-600'}`}></div>
            ))}
          </div>
          <span className="font-bold text-sm">YOU</span>
        </div>

        <div className="bg-gray-800 px-4 py-1 rounded-full border border-gray-600 font-mono text-lg tracking-widest text-pink-400 font-black">
          {phase === 'intro' ? 'TACTICS' : phase === 'final_result' ? 'FINISH!' : `ROUND ${currentRound}`}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">ENEMY</span>
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < scores.enemy ? 'bg-red-500 animate-pulse' : 'bg-gray-600'}`}></div>
            ))}
          </div>
        </div>
      </div>

      {/* --- ALWAYS VISIBLE SPECIAL GAUGE & BUTTON (DURING BATTLE) --- */}
      {phase !== 'intro' && phase !== 'final_result' && activePet && (
        <div className="w-full bg-gray-900/90 backdrop-blur rounded-2xl p-2.5 mb-3 border-2 border-yellow-400/70 flex items-center justify-between gap-3 z-30 shadow-xl">
          <div className="flex-1 flex items-center gap-2 px-1">
            <Zap className={`w-5 h-5 ${specialGauge >= 100 ? 'text-yellow-400 animate-bounce' : 'text-gray-500'}`} />
            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
              <div className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 transition-all duration-500 rounded-full" style={{ width: `${specialGauge}%` }} />
            </div>
            <span className="text-xs font-black text-yellow-300 w-10 text-right">{specialGauge}%</span>
          </div>

          <button
            onClick={triggerSuperpower}
            disabled={specialGauge < 100 || isSuperpowerActive}
            className={`px-4 py-2 rounded-full font-black text-xs md:text-sm border-2 shadow-lg transition-all ${
              isSuperpowerActive
                ? 'bg-purple-600 text-white border-purple-300 animate-pulse cursor-default'
                : specialGauge >= 100
                ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-gray-900 border-white animate-bounce hover:scale-105 active:scale-95 shadow-yellow-400/50 cursor-pointer'
                : 'bg-gray-800 text-gray-400 border-gray-700 cursor-not-allowed opacity-75'
            }`}
          >
            {isSuperpowerActive ? (
              <span>✨ とくぎ発動中！</span>
            ) : specialGauge >= 100 ? (
              <span><Sparkles className="w-4 h-4 inline mr-1" /> とくぎ発動！</span>
            ) : (
              <span><Lock className="w-3.5 h-3.5 inline mr-1 text-gray-500" /> ため中 ({specialGauge}%)</span>
            )}
          </button>
        </div>
      )}

      {/* --- BATTLE ARENA --- */}
      <div className="flex-1 w-full flex flex-col relative mb-4">
        
        {/* CENTER EFFECT */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          {phase === 'clash' && <div className="text-6xl">⚔️</div>}
          {phase === 'impact' && <div className="text-8xl animate-shake drop-shadow-2xl">💥</div>}
          {phase === 'countdown' && <div className="text-6xl font-black text-pink-500 animate-ping">GO!</div>}
          {phase === 'intro' && <div className="text-2xl font-black text-white bg-black/50 px-4 py-1 rounded-full">VS</div>}
        </div>

        {/* PLAYERS CONTAINER */}
        <div className="flex justify-between items-center w-full px-4 h-48 md:h-64">
          
          {/* --- PLAYER --- */}
          <div className={`flex flex-col items-center w-5/12 transition-all duration-300 relative ${phase === 'clash' ? 'animate-attack-right' : ''}`}>
            {phase !== 'intro' && activePet && (
              <>
                {playerDamage && (
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-4xl font-black text-yellow-400 drop-shadow-md animate-bounce z-40 whitespace-nowrap" style={{ textShadow: '2px 2px 0 #000' }}>
                    {playerDamage}
                  </div>
                )}
                <div className={`
                  bg-white rounded-2xl p-2 border-4 relative shadow-xl transition-all
                  ${activePet.element.id === 'fire' ? 'border-red-400 bg-red-50' : 
                    activePet.element.id === 'water' ? 'border-blue-400 bg-blue-50' : 
                    'border-pink-400 bg-pink-50'}
                  ${phase === 'impact' && roundWinner === 'enemy' ? 'animate-damage' : ''}
                `}>
                  <PetImage src={activePet.imageUrl} className="w-24 h-24 md:w-32 md:h-32 object-contain" alt="Player" prompt={activePet.imagePrompt} />
                </div>
                <div className="mt-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full border border-white font-bold">
                  {activePet.name}
                </div>
              </>
            )}
            {phase === 'intro' && (
              <div className="w-full text-center text-white/80 font-bold text-sm animate-pulse">
                <ArrowRight className="inline mr-1" />
                えらんでね
              </div>
            )}
          </div>

          {/* --- ENEMY --- */}
          <div className={`flex flex-col items-center w-5/12 transition-all duration-300 relative ${phase === 'clash' ? 'animate-attack-left' : ''}`}>
            {enemyDamage && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-4xl font-black text-red-500 drop-shadow-md animate-bounce z-40 whitespace-nowrap" style={{ textShadow: '2px 2px 0 #fff' }}>
                {enemyDamage}
              </div>
            )}
            <div className={`
              bg-white rounded-2xl p-2 border-4 relative shadow-xl transition-all
              ${enemyPet.element.id === 'fire' ? 'border-red-400 bg-red-50' : 
                enemyPet.element.id === 'water' ? 'border-blue-400 bg-blue-50' : 
                'border-gray-400 bg-gray-50'}
              ${phase === 'impact' && roundWinner === 'player' ? 'animate-damage' : ''}
            `}>
              <PetImage src={enemyPet.imageUrl} className="w-24 h-24 md:w-32 md:h-32 object-contain transform scale-x-[-1]" alt="Enemy" prompt={enemyPet.imagePrompt} />
            </div>
            <div className="mt-2 bg-gray-800 text-white text-xs px-3 py-1 rounded-full border border-white font-bold flex items-center gap-1">
              <span className={`w-3 h-3 rounded-full ${enemyPet.element.color}`}></span>
              {enemyPet.name}
            </div>
          </div>

        </div>

        {/* TYPE EFFECTIVENESS */}
        <div className="h-10 flex justify-center items-center mt-2">
          {typeEffectiveness && phase === 'impact' && (
            <div className="bg-yellow-400 text-yellow-900 font-black px-4 py-2 rounded-full shadow-lg animate-bounce text-sm md:text-base border-2 border-yellow-200">
              {typeEffectiveness}
            </div>
          )}
        </div>
      </div>

      {/* --- SELECTION AREA (INTRO PHASE) --- */}
      {phase === 'intro' && (
        <div className="w-full bg-white/90 backdrop-blur rounded-t-3xl p-4 shadow-2xl border-t-4 border-yellow-400 animate-slide-up mt-auto z-50">
          <div className="text-center mb-4">
            <h3 className="text-lg font-black text-gray-800">だれと たたかう？</h3>
            <p className="text-xs text-gray-500 font-bold">あいては 「{enemyPet.element.label}」 タイプだよ！</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {playerTeam.map((pet, idx) => {
              const multiplier = calculateTypeMultiplier(pet.element.id, enemyPet.element.id);
              const isStrong = multiplier > 1.0;
              const isWeak = multiplier < 1.0;

              return (
                <button 
                  key={idx}
                  onClick={() => handleChooseFighter(pet)}
                  className={`
                    relative flex flex-col items-center bg-white rounded-xl p-2 border-2 transition-transform active:scale-95
                    ${isStrong ? 'border-red-400 bg-red-50 ring-2 ring-red-200' : 'border-gray-200 hover:border-blue-300'}
                  `}
                >
                  {isStrong && (
                    <div className="absolute -top-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                      おすすめ！
                    </div>
                  )}
                  {isWeak && (
                    <div className="absolute -top-3 bg-blue-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      ちゅうい
                    </div>
                  )}
                  <PetImage src={pet.imageUrl} className="w-12 h-12 object-contain mb-1" alt={pet.name} prompt={pet.imagePrompt} />
                  <div className="text-[10px] font-bold text-gray-700 truncate w-full text-center">{pet.name}</div>
                  <div className={`mt-1 w-4 h-4 rounded-full ${pet.element.color} flex items-center justify-center text-[10px] text-white`}>
                    {pet.element.icon}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --- BATTLE LOG --- */}
      {phase !== 'intro' && (
        <div className="w-full bg-white/90 backdrop-blur rounded-xl p-3 mb-4 flex-1 overflow-y-auto max-h-[150px] border border-white/50 shadow-inner">
          <ul className="space-y-1">
            {logs.map((log, i) => (
              <li key={i} className="text-sm font-medium text-gray-700 border-b border-gray-200 last:border-0 pb-1 last:pb-0">
                {log}
              </li>
            ))}
            <div ref={logsEndRef} />
          </ul>
        </div>
      )}

      {/* --- RESULT MODAL --- */}
      {phase === 'final_result' && (
        <BattleResultModal 
          result={playerWonMatch ? 'win' : 'lose'}
          enemyPet={enemyPet}
          xpGained={playerWonMatch ? 50 : 20}
          isRecruited={hasRecruited}
          onRecruit={handleRecruitClick}
          onNextBattle={onNextBattle}
          onRetry={!playerWonMatch ? handleRetry : undefined}
          onExit={() => onBattleEnd(playerWonMatch, hasRecruited ? undefined : enemyPet)}
        />
      )}
      
      {phase === 'intro' && (
        <div className="absolute top-4 left-4 z-50">
          <Button onClick={onBack} variant="secondary" size="sm" className="bg-white/80 backdrop-blur">
            にげる
          </Button>
        </div>
      )}

    </div>
  );
};
