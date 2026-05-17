import { useGameStore } from '../store/gameStore';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Dynamically synthesizes chiptune sound waves using oscillator nodes.
 */
function playSynthTone(
  freqs: number[], 
  durations: number[], 
  type: OscillatorType = 'square', 
  volume: number = 0.05
) {
  const isMuted = useGameStore.getState().isSoundMuted;
  if (isMuted) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    let startTime = now;
    
    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const duration = durations[index];
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Satisfying exponential retro decay envelope
      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
      
      startTime += duration * 0.85; // Slight overlap for smooth transitions
    });
  } catch (error) {
    console.warn('Audio synthesis failed (user must interact first):', error);
  }
}

export const soundEffects = {
  playSelect: () => {
    playSynthTone([600], [0.08], 'square', 0.02);
  },
  
  playEat: () => {
    // Satisfying chiptune coin bounce blip
    playSynthTone([523.25, 659.25, 783.99], [0.05, 0.05, 0.12], 'square', 0.03);
  },
  
  playGameOver: () => {
    // Dramatic descending chiptune minor scale
    playSynthTone([392.00, 349.23, 311.13, 246.94], [0.12, 0.12, 0.12, 0.35], 'sawtooth', 0.04);
  },
  
  playCheckIn: () => {
    // Uplifting arpeggio chime
    playSynthTone([523.25, 659.25, 783.99, 1046.50], [0.08, 0.08, 0.08, 0.22], 'triangle', 0.05);
  },
  
  playHighscore: () => {
    // Glorious retro celebration fanfare
    playSynthTone(
      [523.25, 523.25, 523.25, 523.25, 659.25, 587.33, 659.25, 783.99], 
      [0.08, 0.08, 0.08, 0.12, 0.12, 0.08, 0.08, 0.30], 
      'square', 
      0.03
    );
  }
};
