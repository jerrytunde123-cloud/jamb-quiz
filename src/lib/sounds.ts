/**
 * Zero-dependency Web Audio synthesiser for interactive quiz feedback.
 * Synthesises soft, pleasing tones directly in the browser with 0kB asset download.
 */

const STORAGE_KEY = "quiz_sound_enabled";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = window.localStorage.getItem(STORAGE_KEY);
  return val === null ? true : val === "true";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, String(enabled));
}

let ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx || ctx.state === "closed") {
    ctx = new AudioCtx();
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/** Soft pop tone when selecting an option */
export function playSelectSound(): void {
  if (!isSoundEnabled()) return;
  const ac = getAudioContext();
  if (!ac) return;

  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    const now = ac.currentTime;

    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.05);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Ignore audio errors gracefully
  }
}

/** Ticking pulse when timer hits final 15 seconds */
export function playTickSound(): void {
  if (!isSoundEnabled()) return;
  const ac = getAudioContext();
  if (!ac) return;

  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = "sine";
    const now = ac.currentTime;

    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  } catch {
    // Ignore
  }
}

/** Ascending celebratory fanfare chord on high score submit */
export function playCelebrationSound(): void {
  if (!isSoundEnabled()) return;
  const ac = getAudioContext();
  if (!ac) return;

  try {
    const now = ac.currentTime;
    // C5, E5, G5, C6 notes
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = now + idx * 0.08;

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch {
    // Ignore
  }
}

/** Friendly finish chord on moderate score */
export function playFinishSound(): void {
  if (!isSoundEnabled()) return;
  const ac = getAudioContext();
  if (!ac) return;

  try {
    const now = ac.currentTime;
    const notes = [440, 554.37, 659.25];

    notes.forEach((freq, idx) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = now + idx * 0.07;

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.09, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(start);
      osc.stop(start + 0.28);
    });
  } catch {
    // Ignore
  }
}
