/**
 * JATAYU 2.0 — Web Audio Early Warning Synthesizer (Demo Alert Tone)
 * Provides a synthetic audio alert when risk crosses the threshold.
 * Respects browser autoplay restrictions and user muting.
 */

let audioCtx: AudioContext | null = null;

export function playDemoEarlyWarningTone(muted: boolean = false): void {
  if (muted || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Frequency alternation between 580Hz and 780Hz (tactical warning tone)
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.setValueAtTime(780, now + 0.25);
    osc.frequency.setValueAtTime(580, now + 0.50);
    osc.frequency.setValueAtTime(780, now + 0.75);

    // Soft volume envelope to avoid harsh popping
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain.gain.setValueAtTime(0.15, now + 0.85);
    gain.gain.linearRampToValueAtTime(0.0, now + 1.10);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 1.15);
  } catch (err) {
    // Autoplay prevented or not allowed; fail silently
    console.warn('[JATAYU Audio] Demo audio alert prevented or unsupported:', err);
  }
}
