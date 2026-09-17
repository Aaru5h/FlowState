/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useSpotifyStore } from '@/store/spotifyStore';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayer;
    };
  }
}

interface SpotifyPlayer {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
  addListener: (event: string, cb: (data: any) => void) => void;
}

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/spotify/token');
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

export function useSpotifyPlayer() {
  const store = useSpotifyStore();
  const playerRef = useRef<SpotifyPlayer | null>(null);

  useEffect(() => {
    if (store.accountTier !== 'premium' || !store.isLoggedIn) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Flowstate',
        getOAuthToken: async (cb) => {
          const token = await fetchToken();
          if (token) cb(token);
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        store.setDeviceId(device_id);
        store.setSdkReady(true);
      });

      player.addListener('not_ready', () => {
        store.setSdkReady(false);
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        const track = state.track_window?.current_track;
        if (track) {
          store.setCurrentTrack({
            name: track.name,
            artist: track.artists.map((a: { name: string }) => a.name).join(', '),
            albumArt: track.album.images[0]?.url ?? '',
          });
        }
        store.setIsPlaying(!state.paused);
      });

      player.addListener('authentication_error', () => {
        store.setMusicError('Spotify auth error — try logging in again');
        store.setSdkReady(false);
      });

      player.addListener('account_error', () => {
        store.setAccountTier('free');
        store.setSdkReady(false);
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      playerRef.current?.disconnect();
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.accountTier, store.isLoggedIn]);

  const play = useCallback(async (contextUri?: string) => {
    const { deviceId } = useSpotifyStore.getState();
    if (!deviceId) return;
    await fetch('/api/spotify/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, contextUri }),
    });
  }, []);

  const pause = useCallback(async () => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    playerRef.current?.resume();
  }, []);

  const skip = useCallback(async () => {
    const { deviceId } = useSpotifyStore.getState();
    if (!deviceId) return;
    await fetch('/api/spotify/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId }),
    });
  }, []);

  return { play, pause, resume, skip, player: playerRef };
}
