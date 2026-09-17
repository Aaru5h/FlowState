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

export function useSpotifyPlayer() {
  const store = useSpotifyStore();
  const playerRef = useRef<SpotifyPlayer | null>(null);

  useEffect(() => {
    if (store.accountTier !== 'premium' || !store.accessToken) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Flowstate',
        getOAuthToken: (cb) => {
          const token = useSpotifyStore.getState().accessToken;
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
  }, [store.accountTier, store.accessToken]);

  const play = useCallback(async (contextUri?: string) => {
    const { accessToken, deviceId } = useSpotifyStore.getState();
    if (!accessToken || !deviceId) return;
    const body: Record<string, string> = {};
    if (contextUri) body.context_uri = contextUri;
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }, []);

  const pause = useCallback(async () => {
    playerRef.current?.pause();
  }, []);

  const resume = useCallback(async () => {
    playerRef.current?.resume();
  }, []);

  const skip = useCallback(async () => {
    playerRef.current?.nextTrack();
  }, []);

  return { play, pause, resume, skip, player: playerRef };
}
