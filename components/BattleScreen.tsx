import React, { useEffect, useRef, useState } from 'react';
import { GeneratedPet, Stage } from '../types';
import { calculateTypeMultiplier, generateEnemy } from '../services/geminiService';
import {
  ENEMY_HP_SCALE, Fighter, Move, MOVE_ORDER, MOVES, chooseEnemyMove, counterOf, damageOf, makeFighter, resolveTurn, xpForEnemy,
} from '../services/battle';
import { BRAVE_FRIENDSHIP, displayName, petKey } from '../services/growth';
import { Sparkles, Heart, Crown, LogOut } from 'lucide-react';
import { PetImage } from './PetImage';
import { playAttackSound, playClickSound, playSuperpowerSound, playVictorySound, startBgm, stopBgm } from '../services/audioService';

export interface StageRunResult {
  cleared: boolean;
  defeated: GeneratedPet[];
  faintedKeys: string[];
  xp: number;
  jankenWins: number;
  specials: number;
}

interface BattleScreenProps {
  playerTeam: GeneratedPet[];
  stage: Stage;
  onStageEnd: (result: StageRunResult) => void;
  onEscape: () => void;
}

type Phase = 'pick' | 'turn' | 'resolving' | 'switch' | 'wave_clear' | 'done';

interface TurnFx {
  dealt: number;
  taken: number;
  tone: 'win' | 'lose' | 'draw' | 'special';
  playerMove?: Move;
  enemyMove: Move;
}

const newEnemy = (stage: Stage, wave: number): Fighter => {
  const pet = generateEnemy(stage, wave);
  return makeFighter(pet, pet.isBoss ? ENEMY_HP_SCALE.boss : ENEMY_HP_SCALE.normal);
};

const HpBar: React.FC<{ hp: number; max: number }> = ({ hp, max }) => {
  const pct = Math.max(0, Math.round((hp / max) * 100));
  const color = pct > 50 ? 'from-green-400 to-emerald-500' : pct > 20 ? 'from-yellow-400 to-amber-500' : 'from-red-500 to-pink-500';
  return (
    <div className="w-full">
      <div className="h-3 bg-gray-800/40 rounded-full overflow-hidden border border-white/70">
        <div className={`h-full bg-gradient-to-r ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] font-black text-white text-right" style={{ textShadow: '1px 1px 0 #000' }}>{hp} / {max}</div>
    </div>
  );
};

export const BattleScreen: React.FC<BattleScreenProps> = ({ playerTeam, stage, onStageEnd, onEscape }) => {
  const [team, setTeam] = useState<Fighter[]>(() => playerTeam.map(p => makeFighter(p)));
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [wave, setWave] = useState(0);
  const [enemy, setEnemy] = useState<Fighter>(() => newEnemy(stage, 0));
  const [intent, setIntent] = useState<Move>(() => chooseEnemyMove(enemy.pet, Math.random));
  const [intentHidden, setIntentHidden] = useState(() => Math.random() < stage.hideIntentChance);
  const [phase, setPhase] = useState<Phase>('pick');
  const [gauge, setGauge] = useState(0);
  const [fx, setFx] = useState<TurnFx | null>(null);
  const [message, setMessage] = useState(`${displayName(enemy.pet)} が あらわれた！`);
  const [showCutIn, setShowCutIn] = useState(false);

  // Run totals live in a ref: they are read inside timers and must never be stale.
  const runRef = useRef({ defeated: [] as GeneratedPet[], xp: 0, jankenWins: 0, specials: 0 });
  const timers = useRef<number[]>([]);
  // Locks the turn synchronously so a double tap cannot resolve it twice.
  const acting = useRef(false);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  // Leaving the screen stops music and every pending timer.
  useEffect(() => {
    startBgm(stage.difficultyLevel >= 5 ? 'boss' : 'battle');
    return () => {
      stopBgm();
      timers.current.forEach(t => clearTimeout(t));
    };
  }, [stage]);

  const active = activeIdx !== null ? team[activeIdx] : null;

  const rollIntent = (pet: GeneratedPet) => {
    setIntent(chooseEnemyMove(pet, Math.random));
    setIntentHidden(Math.random() < stage.hideIntentChance);
  };

  const finish = (cleared: boolean, finalTeam: Fighter[]) => {
    setPhase('done');
    if (cleared) playVictorySound();
    const run = runRef.current;
    const faintedKeys = finalTeam.filter(f => f.hp <= 0).map(f => petKey(f.pet));
    later(() => onStageEnd({ cleared, defeated: run.defeated, faintedKeys, xp: run.xp, jankenWins: run.jankenWins, specials: run.specials }), 1400);
  };

  const handlePick = (idx: number) => {
    if (team[idx].hp <= 0) return;
    playClickSound();
    setActiveIdx(idx);
    setFx(null);
    setPhase('turn');
    setMessage(`ゆけっ！ ${displayName(team[idx].pet)}！`);
  };

  // Enemy defeated: next wave, or the stage is cleared.
  const afterEnemyDown = (currentTeam: Fighter[], downed: Fighter) => {
    runRef.current.defeated.push(downed.pet);
    runRef.current.xp += xpForEnemy(stage.difficultyLevel, !!downed.pet.isBoss);
    if (wave + 1 >= stage.waves) {
      setMessage(`${displayName(downed.pet)} を たおした！ ステージ クリア！`);
      finish(true, currentTeam);
      return;
    }
    setPhase('wave_clear');
    setMessage(`${displayName(downed.pet)} を たおした！`);
    later(() => {
      const nextWave = wave + 1;
      const next = newEnemy(stage, nextWave);
      setWave(nextWave);
      setEnemy(next);
      rollIntent(next.pet);
      setFx(null);
      setPhase('turn');
      setMessage(next.pet.isBoss ? `ボスの ${displayName(next.pet)} が あらわれた！` : `${displayName(next.pet)} が あらわれた！`);
    }, 1600);
  };

  // Our fighter fell: pick another, or the run is lost.
  const afterPlayerDown = (currentTeam: Fighter[]) => {
    if (currentTeam.every(f => f.hp <= 0)) {
      setMessage('みんな たおれちゃった…');
      finish(false, currentTeam);
      return;
    }
    setPhase('switch');
    setMessage('たおれちゃった！ つぎは だれに する？');
  };

  const handleMove = (move: Move, special = false) => {
    if (acting.current || phase !== 'turn' || activeIdx === null || !active) return;
    if (special && gauge < 100) return;
    acting.current = true;
    if (special) {
      setShowCutIn(true);
      playSuperpowerSound();
      later(() => setShowCutIn(false), 1500);
      runRef.current.specials += 1;
    } else {
      playClickSound();
    }
    const out = resolveTurn(active, enemy, move, intent, special);
    if (!special && out.result === 'win') runRef.current.jankenWins += 1;

    const nextTeam = team.map((f, i) => (i === activeIdx ? out.player : f));
    const typeNote = out.typeMult > 1.2 ? ' こうかは バツグン！' : out.typeMult < 0.9 ? ' こうかは いまひとつ…' : '';
    const text = special
      ? `✨ ひっさつ！ ${active.pet.superpower}`
      : out.result === 'win' ? `じゃんけん かち！${typeNote}` : out.result === 'lose' ? `じゃんけん まけ…${typeNote}` : `あいこ！${typeNote}`;

    setPhase('resolving');
    later(() => {
      playAttackSound();
      setFx({ dealt: out.dealt, taken: out.taken, tone: special ? 'special' : out.result, playerMove: special ? undefined : move, enemyMove: intent });
      setTeam(nextTeam);
      setEnemy(out.enemy);
      setGauge(g => Math.min(100, (special ? 0 : g) + out.gaugeGain));
      setMessage(out.braveSaved ? `${displayName(active.pet)} は なかよしパワーで ふんばった！` : text);
    }, special ? 1500 : 450);

    later(() => {
      acting.current = false;
      if (out.enemy.hp <= 0) return afterEnemyDown(nextTeam, out.enemy);
      if (out.player.hp <= 0) return afterPlayerDown(nextTeam);
      rollIntent(out.enemy.pet);
      setFx(null);
      setPhase('turn');
      setMessage('つぎの わざを えらんでね');
    }, special ? 3000 : 1900);
  };

  // Switching uses the turn; the incoming monster guards and takes half damage.
  const handleSwitch = (idx: number) => {
    if (idx === activeIdx || team[idx].hp <= 0) return;
    if (phase === 'switch') {
      handlePick(idx);
      rollIntent(enemy.pet);
      return;
    }
    if (acting.current || phase !== 'turn') return;
    acting.current = true;
    playClickSound();
    const incoming = team[idx];
    const taken = Math.max(0, Math.min(incoming.hp - 1, damageOf(enemy.pet, intent, incoming.pet, 0.5, Math.random)));
    const nextTeam = team.map((f, i) => (i === idx ? { ...f, hp: f.hp - taken } : f));
    setActiveIdx(idx);
    setPhase('resolving');
    setMessage(`こうたい！ ${displayName(incoming.pet)} が みを まもった！`);
    later(() => {
      playAttackSound();
      setTeam(nextTeam);
      setFx({ dealt: 0, taken, tone: 'draw', enemyMove: intent });
    }, 450);
    later(() => {
      acting.current = false;
      rollIntent(enemy.pet);
      setFx(null);
      setPhase('turn');
      setMessage('つぎの わざを えらんでね');
    }, 1700);
  };

  const hintMove = !intentHidden ? counterOf(intent) : null;
  const canAct = phase === 'turn';
  const choosing = phase === 'pick' || phase === 'switch';

  return (
    <div className={`w-full max-w-2xl mx-auto p-2 md:p-4 flex flex-col min-h-[85vh] relative rounded-2xl bg-gradient-to-b ${stage.bgGradient} overflow-hidden`}>
      {showCutIn && active && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center animate-fade-in pointer-events-none">
          <div className="text-yellow-300 font-black text-3xl md:text-5xl animate-bounce mb-4 text-center drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]">
            【 ひっさつ とくぎ！！ 】
          </div>
          <div className="w-56 h-56 animate-pop-in">
            <PetImage pet={active.pet} className="w-full h-full drop-shadow-2xl animate-pulse" />
          </div>
          <div className="text-white font-black text-lg md:text-2xl bg-pink-600 px-6 py-2 rounded-full mt-4 border-2 border-yellow-300 animate-slide-up shadow-2xl text-center max-w-md mx-4">
            {active.pet.superpower}
          </div>
        </div>
      )}

      {/* Top bar: stage, wave dots, escape */}
      <div className="flex items-center justify-between bg-gray-900/85 text-white rounded-2xl px-3 py-2 mb-2 shadow-lg gap-2">
        <div className="font-black text-sm truncate">{stage.emoji} {stage.name}</div>
        <div className="flex items-center gap-1.5" aria-label={`${wave + 1} せんめ / ${stage.waves}`}>
          {Array.from({ length: stage.waves }, (_, i) => (
            <div key={i} className={`flex items-center justify-center rounded-full ${i === stage.waves - 1 ? 'w-6 h-6' : 'w-4 h-4'} ${i < wave ? 'bg-yellow-400' : i === wave ? 'bg-pink-500 animate-pulse' : 'bg-gray-600'}`}>
              {i === stage.waves - 1 && <Crown className="w-3.5 h-3.5 text-white" />}
            </div>
          ))}
        </div>
        <button onClick={onEscape} disabled={phase === 'resolving' || phase === 'done'} className="text-xs font-bold bg-white/15 hover:bg-white/25 px-2 py-1 rounded-full flex items-center gap-1 disabled:opacity-40 shrink-0">
          <LogOut className="w-3 h-3" /> にげる
        </button>
      </div>

      {/* Enemy */}
      <div className="flex items-start justify-end gap-3 px-2">
        <div className="flex-1 max-w-[58%] pt-2 space-y-1">
          <div className="flex items-center gap-1 justify-end">
            {enemy.pet.isBoss && <span className="text-[10px] font-black bg-red-600 text-white px-2 rounded-full shrink-0">ボス</span>}
            <span className={`w-5 h-5 rounded-full ${enemy.pet.element.color} text-[11px] flex items-center justify-center shrink-0`}>{enemy.pet.element.icon}</span>
            <span className="font-black text-white text-sm truncate" style={{ textShadow: '1px 1px 0 #000' }}>{displayName(enemy.pet)}</span>
          </div>
          <HpBar hp={enemy.hp} max={enemy.maxHp} />
          {(phase === 'turn' || phase === 'resolving' || choosing) && enemy.hp > 0 && (
            <div className="flex justify-end">
              <div className="bg-white rounded-2xl px-3 py-1 shadow-md border-2 border-gray-800 text-sm font-black text-gray-800">
                {intentHidden ? 'つぎの わざは …？' : <>つぎは <span className="text-xl align-middle">{MOVES[intent].hand}</span> {MOVES[intent].label}！</>}
              </div>
            </div>
          )}
        </div>
        <div className={`relative w-28 h-28 md:w-36 md:h-36 shrink-0 ${fx && fx.dealt > 0 ? 'animate-damage' : ''} ${enemy.hp <= 0 ? 'opacity-30 grayscale transition-all duration-700' : ''}`}>
          <PetImage pet={enemy.pet} className="w-full h-full drop-shadow-xl transform scale-x-[-1]" />
          {fx && fx.dealt > 0 && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-4xl font-black text-yellow-300 animate-float-up" style={{ textShadow: '2px 2px 0 #000' }}>-{fx.dealt}</div>
          )}
          {fx && <div className="absolute -left-5 top-8 text-4xl animate-pop-in">{MOVES[fx.enemyMove].hand}</div>}
        </div>
      </div>

      {/* Center message */}
      <div className="min-h-[3rem] flex items-center justify-center my-1 px-2">
        <div className={`px-4 py-1.5 rounded-full font-black text-sm md:text-base shadow-lg border-2 text-center ${
          fx?.tone === 'win' ? 'bg-yellow-300 text-yellow-900 border-yellow-100 animate-bounce' :
          fx?.tone === 'special' ? 'bg-pink-500 text-white border-yellow-300 animate-bounce' :
          fx?.tone === 'lose' ? 'bg-blue-200 text-blue-900 border-white' : 'bg-white/90 text-gray-800 border-white'
        }`}>
          {message}
        </div>
      </div>

      {/* Player */}
      <div className="flex items-end gap-3 px-2 mb-2">
        <div className={`relative w-28 h-28 md:w-36 md:h-36 shrink-0 ${fx && fx.taken > 0 ? 'animate-damage' : ''}`}>
          {active && !choosing ? (
            <>
              <PetImage pet={active.pet} className="w-full h-full drop-shadow-xl" />
              {fx && fx.taken > 0 && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-4xl font-black text-red-400 animate-float-up" style={{ textShadow: '2px 2px 0 #fff' }}>-{fx.taken}</div>
              )}
              {fx?.playerMove && <div className="absolute -right-5 top-8 text-4xl animate-pop-in">{MOVES[fx.playerMove].hand}</div>}
            </>
          ) : (
            <div className="w-full h-full rounded-full bg-white/40 border-4 border-dashed border-white flex items-center justify-center text-3xl text-white font-black">？</div>
          )}
        </div>
        {active && !choosing && (
          <div className="flex-1 max-w-[58%] space-y-1 pb-2">
            <div className="flex items-center gap-1">
              <span className={`w-5 h-5 rounded-full ${active.pet.element.color} text-[11px] flex items-center justify-center shrink-0`}>{active.pet.element.icon}</span>
              <span className="font-black text-white text-sm truncate" style={{ textShadow: '1px 1px 0 #000' }}>{displayName(active.pet)}</span>
              <span className="text-[10px] font-bold text-white shrink-0" style={{ textShadow: '1px 1px 0 #000' }}>Lv.{active.pet.level || 1}</span>
              {(active.pet.friendship || 0) >= BRAVE_FRIENDSHIP && !active.braveUsed && (
                <Heart className="w-4 h-4 fill-pink-500 text-pink-200 animate-pulse shrink-0" aria-label="なかよしパワー" />
              )}
            </div>
            <HpBar hp={active.hp} max={active.maxHp} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-auto bg-white/90 backdrop-blur rounded-3xl p-3 shadow-2xl border-t-4 border-yellow-400 space-y-3">
        {choosing ? (
          <div>
            <p className="text-center font-black text-gray-800 mb-1">{phase === 'pick' ? 'だれから たたかう？' : 'つぎは だれに する？'}</p>
            <p className="text-center text-xs font-bold text-gray-500 mb-3">あいては 「{enemy.pet.element.icon}{enemy.pet.element.label}」 タイプ</p>
            <div className="grid grid-cols-3 gap-2">
              {team.map((f, idx) => {
                const mult = calculateTypeMultiplier(f.pet.element.id, enemy.pet.element.id);
                const down = f.hp <= 0;
                return (
                  <button key={petKey(f.pet)} onClick={() => (phase === 'pick' ? handlePick(idx) : handleSwitch(idx))} disabled={down}
                    className={`relative flex flex-col items-center bg-white rounded-xl p-2 border-2 transition-transform active:scale-95 ${down ? 'opacity-40 grayscale' : mult > 1 ? 'border-red-400 ring-2 ring-red-200' : 'border-gray-200'}`}>
                    {!down && mult > 1 && <div className="absolute -top-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">つよいよ！</div>}
                    {!down && mult < 1 && <div className="absolute -top-3 bg-blue-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">にがて</div>}
                    <PetImage pet={f.pet} className="w-14 h-14" />
                    <div className="text-[11px] font-bold text-gray-700 truncate w-full text-center">{displayName(f.pet)}</div>
                    <div className="w-full mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-400" style={{ width: `${(f.hp / f.maxHp) * 100}%` }} /></div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            {/* Special gauge */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                <div className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-pink-500 transition-all duration-500" style={{ width: `${gauge}%` }} />
              </div>
              <button onClick={() => handleMove('power', true)} disabled={!canAct || gauge < 100}
                className={`px-3 py-1.5 rounded-full font-black text-xs border-2 shadow transition-all whitespace-nowrap ${gauge >= 100 && canAct ? 'bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-500 text-gray-900 border-white animate-bounce' : 'bg-gray-200 text-gray-400 border-gray-200'}`}>
                <Sparkles className="w-3.5 h-3.5 inline mr-0.5" /> {gauge >= 100 ? 'とくぎ！' : `ため ${gauge}%`}
              </button>
            </div>

            {/* Janken move buttons */}
            <div className="grid grid-cols-3 gap-2">
              {MOVE_ORDER.map(m => (
                <button key={m} onClick={() => handleMove(m)} disabled={!canAct} aria-label={`${MOVES[m].hand} ${MOVES[m].label}`}
                  className={`relative rounded-2xl py-2 bg-gradient-to-b ${MOVES[m].button} text-white font-black shadow-lg border-b-4 border-black/20 active:translate-y-0.5 transition disabled:opacity-50`}>
                  {hintMove === m && canAct && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-300 text-yellow-900 text-[10px] px-2 rounded-full border border-white animate-bounce whitespace-nowrap">かてる！</div>}
                  <div className="text-3xl leading-none">{MOVES[m].hand}</div>
                  <div className="text-xs">{MOVES[m].label}</div>
                  <div className="text-[10px] opacity-90">{active?.pet.stats[m]}</div>
                </button>
              ))}
            </div>

            {/* Bench: tap to switch (uses the turn) */}
            {team.length > 1 && (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-[10px] font-bold text-gray-500">こうたい:</span>
                {team.map((f, idx) => idx === activeIdx ? null : (
                  <button key={petKey(f.pet)} onClick={() => handleSwitch(idx)} disabled={!canAct || f.hp <= 0} aria-label={`${displayName(f.pet)} に こうたい`}
                    className={`w-11 h-11 rounded-full bg-white border-2 border-gray-200 p-0.5 relative ${f.hp <= 0 ? 'opacity-30 grayscale' : 'hover:border-pink-300'}`}>
                    <PetImage pet={f.pet} className="w-full h-full" />
                    <div className="absolute -bottom-1 left-1 right-1 h-1 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-green-400" style={{ width: `${(f.hp / f.maxHp) * 100}%` }} /></div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
