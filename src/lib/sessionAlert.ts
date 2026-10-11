import { pause as pausePremium } from '@/hooks/useSpotifyPlayer';
import { pause as pauseEmbed } from '@/hooks/useSpotifyEmbed';
import { playChime } from '@/lib/sounds';

export async function alertSessionEnd(soundEnabled: boolean) {
  // Pause both controllers: either can be active during a player fallback.
  try { pauseEmbed(); } catch { /* Still attempt the Premium player. */ }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      pausePremium(),
      new Promise<void>((resolve) => { timeout = setTimeout(resolve, 1500); }),
    ]);
  } catch {
    // A disconnected Spotify player must not suppress the alarm.
  } finally {
    if (timeout) clearTimeout(timeout);
  }
  if (soundEnabled) await playChime();
}
