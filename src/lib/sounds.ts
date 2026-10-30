// Unlock audio on a timer button click, then reuse it when the timer finishes.
let audioContext: AudioContext | null = null;
let alarmSource: AudioBufferSourceNode | null = null;
let alarmGain: GainNode | null = null;

export function prepareAlarm() {
  try {
    if (!audioContext || audioContext.state === 'closed') audioContext = new AudioContext();
    if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
  } catch {
    // The visible completion state remains available when audio is unavailable.
  }
}

export async function playAlarm() {
  prepareAlarm();
  const ctx = audioContext;
  if (!ctx || alarmSource) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    const sampleRate = ctx.sampleRate;
    const cycleSeconds = 1.8;
    const buffer = ctx.createBuffer(1, Math.ceil(sampleRate * cycleSeconds), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      const pulseTime = time % 0.6;
      if (pulseTime < 0.42) {
        const attack = Math.min(1, pulseTime / 0.015);
        const release = Math.min(1, (0.42 - pulseTime) / 0.06);
        const envelope = Math.max(0, Math.min(attack, release));
        const frequency = time % 1.2 < 0.6 ? 740 : 960;
        data[i] = Math.sin(2 * Math.PI * frequency * time) * envelope;
      }
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0.72;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    alarmSource = source;
    alarmGain = gain;
  } catch {
    // Audio restrictions should not prevent the timer completing.
  }
}

export function stopAlarm() {
  try { alarmSource?.stop(); } catch { /* The source may already be stopped. */ }
  alarmSource?.disconnect();
  alarmGain?.disconnect();
  alarmSource = null;
  alarmGain = null;
}
