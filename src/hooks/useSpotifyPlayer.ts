/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect } from 'react';
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
    let res = await fetch('/api/spotify/token');
    // access token cookie lives 1h; swap in a fresh one via the refresh token
    if (res.status === 401 && (await fetch('/api/spotify/refresh', { method: 'POST' })).ok) {
      res = await fetch('/api/spotify/token');
    }
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

// one shared player: the hook is mounted once (FlowstateApp); other components import the controls below
let player: SpotifyPlayer | null = null;

export async function play(contextUri?: string) {
  const { deviceId } = useSpotifyStore.getState();
  if (!deviceId) return;
  await fetch('/api/spotify/play', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId, contextUri }),
  });
}

export async function pause() {
  await player?.pause();
}

export async function resume() {
  await player?.resume();
}

export async function skip() {
  const { deviceId } = useSpotifyStore.getState();
  if (!deviceId) return;
  await fetch('/api/spotify/next', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
}

export function useSpotifyPlayer() {
  const store = useSpotifyStore();

  useEffect(() => {
    if (store.accountTier !== 'premium' || !store.isLoggedIn) return;

    const init = () => {
      player?.disconnect(); // never run two players: play() and pause() would target different devices
      const p = new window.Spotify.Player({
        name: 'Flowstate',
        getOAuthToken: async (cb) => {
          const token = await fetchToken();
          if (token) cb(token);
        },
        volume: 0.5,
      });

      p.addListener('ready', ({ device_id }: { device_id: string }) => {
        store.setDeviceId(device_id);
        store.setSdkReady(true);
      });

      p.addListener('not_ready', () => {
        store.setSdkReady(false);
      });

      p.addListener('player_state_changed', (state: any) => {
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

      p.addListener('authentication_error', () => {
        store.setMusicError('Spotify auth error — try logging in again');
        store.setSdkReady(false);
      });

      p.addListener('account_error', () => {
        store.setAccountTier('free');
        store.setSdkReady(false);
      });

      p.connect();
      player = p;
    };

    // the SDK script only fires onSpotifyWebPlaybackSDKReady once, so load it once and reuse window.Spotify after
    if (window.Spotify) init();
    else {
      window.onSpotifyWebPlaybackSDKReady = init;
      if (!document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      player?.disconnect();
      player = null;
      store.setSdkReady(false);
      store.setDeviceId(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.accountTier, store.isLoggedIn]);

  return { play, pause, resume, skip };
}
