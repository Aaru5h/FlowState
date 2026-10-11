// Unlock audio on a timer button click, then reuse it when the timer finishes.
let audioContext: AudioContext | null = null;

export function prepareAlarm() {
  try {
    if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
  } catch {
    // The visible completion state remains available when audio is unavailable.
  }
}

export async function playChime() {
  prepareAlarm();
  const ctx = audioContext;
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    // Three clear two-tone pulses, independent of Spotify playback.
    const start = ctx.currentTime;
    for (let pulse = 0; pulse < 3; pulse++) {
      for (let note = 0; note < 2; note++) {
        const at = start + pulse * 0.9 + note * 0.22;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = note === 0 ? 660 : 880;
        gain.gain.setValueAtTime(0, at);
        gain.gain.linearRampToValueAtTime(0.3, at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.35);
        osc.start(at);
        osc.stop(at + 0.36);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      }
    }
  } catch {
    // Audio restrictions should not prevent the timer completing.
  }
}
