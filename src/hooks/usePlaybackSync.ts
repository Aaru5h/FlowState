'use client';
import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { useSpotifyStore } from '@/store/spotifyStore';

export function usePlaybackSync(
  premiumPlay: (uri?: string) => Promise<void>,
  premiumPause: () => Promise<void>,
  premiumResume: () => Promise<void>,
  embedPlay: () => void,
  embedPause: () => void,
) {
  const prevPhaseRef = useRef<string>('idle');
  const prevRunningRef = useRef<boolean>(false);

  useEffect(() => {
    const unsub = useTimerStore.subscribe((state) => {
      const phaseChanged = state.phase !== prevPhaseRef.current;
      const runningChanged = state.isRunning !== prevRunningRef.current;
      prevPhaseRef.current = state.phase;
      prevRunningRef.current = state.isRunning;

      if (!phaseChanged && !runningChanged) return;

      const spotify = useSpotifyStore.getState();
      if (!spotify.isLoggedIn) return;
      const isPremium = spotify.accountTier === 'premium' && spotify.sdkReady;
      const isFree = spotify.accountTier === 'free' && spotify.embedReady;

      if (state.phase === 'working' && state.isRunning) {
        if (phaseChanged) {
          // new focus session: start the playlist
          if (isPremium) premiumPlay(spotify.selectedPlaylistUri ?? undefined);
          else if (isFree) embedPlay();
        } else {
          // resumed mid-session: continue where it left off
          if (isPremium) premiumResume();
          else if (isFree) embedPlay();
        }
      } else if (state.phase !== 'idle' || phaseChanged) {
        // paused, session ended, break, or reset
        if (isPremium) premiumPause();
        else if (isFree) embedPause();
      }
    });
    // picking a playlist mid-focus switches the music now, not next session (free embed reloads in FreePlayerEmbed)
    const unsubPlaylist = useSpotifyStore.subscribe((spotify, prev) => {
      if (spotify.selectedPlaylistUri === prev.selectedPlaylistUri || !spotify.selectedPlaylistUri) return;
      const { phase, isRunning } = useTimerStore.getState();
      if (phase === 'working' && isRunning && spotify.accountTier === 'premium' && spotify.sdkReady) {
        premiumPlay(spotify.selectedPlaylistUri);
      }
    });
    return () => {
      unsub();
      unsubPlaylist();
    };
  }, [premiumPlay, premiumPause, premiumResume, embedPlay, embedPause]);
}
