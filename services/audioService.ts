
/**
 * Web Audio API Sound Engine & Synth BGM Manager
 */

let audioCtx: AudioContext | null = null;
let seMuted = false;
let bgmMuted = false;
let currentBgmInterval: number | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const setMuteSettings = (se: boolean, bgm: boolean) => {
  seMuted = se;
  bgmMuted = bgm;
  if (bgmMuted) {
    stopBgm();
  }
};

/**
 * Sound Effect: Button Click / Pop
 */
export const playClickSound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.08);
};

/**
 * Sound Effect: Level Up Arpeggio
 */
export const playLevelUpSound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + idx * 0.08;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.25, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.25);
  });
};

/**
 * Sound Effect: Attack / Clash
 */
export const playAttackSound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
};

/**
 * Sound Effect: Special Move Cut-in (とくぎ必殺技)
 */
export const playSuperpowerSound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const startTime = now + idx * 0.06;

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.2, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
};

/**
 * Sound Effect: Victory Fanfare
 */
export const playVictorySound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  // Fanfare sequence: G4 -> C5 -> E5 -> G5 -> C6
  const sequence = [
    { freq: 392.00, duration: 0.12, delay: 0 },
    { freq: 523.25, duration: 0.12, delay: 0.12 },
    { freq: 659.25, duration: 0.12, delay: 0.24 },
    { freq: 783.99, duration: 0.25, delay: 0.36 },
    { freq: 1046.50, duration: 0.5, delay: 0.61 },
  ];

  sequence.forEach(note => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + note.delay;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(note.freq, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + note.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.duration);
  });
};

/**
 * Sound Effect: Heart / Care
 */
export const playHeartSound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(587.33, now); // D5
  osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.2);
};

/**
 * Sound Effect: Fusion Magic
 */
export const playFusionSound = () => {
  if (seMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  for (let i = 0; i < 10; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + i * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300 + i * 120, t);
    osc.frequency.exponentialRampToValueAtTime(800 + i * 150, t + 0.15);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }
};

/**
 * Stop any active synth BGM
 */
export const stopBgm = () => {
  if (currentBgmInterval !== null) {
    clearInterval(currentBgmInterval);
    currentBgmInterval = null;
  }
};

/**
 * Start playful synth background music
 */
export const startBgm = (type: 'main' | 'battle' | 'boss' = 'main') => {
  stopBgm();
  if (bgmMuted) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = type === 'boss'
    ? [220, 233.08, 220, 246.94]
    : type === 'battle'
    ? [329.63, 392.00, 440.00, 493.88]
    : [261.63, 329.63, 392.00, 523.25, 440.00, 349.23];

  let noteIndex = 0;
  const stepTime = type === 'boss' ? 250 : type === 'battle' ? 200 : 350;

  currentBgmInterval = window.setInterval(() => {
    if (bgmMuted) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type === 'boss' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(notes[noteIndex % notes.length], now);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (stepTime / 1000) * 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (stepTime / 1000) * 0.9);

      noteIndex++;
    } catch (e) {
      console.error("BGM playback step failed", e);
    }
  }, stepTime);
};
