/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useSpotifyStore } from '@/store/spotifyStore';

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: any) => void;
  }
}

export function useSpotifyEmbed(containerId: string) {
  const store = useSpotifyStore();
  const controllerRef = useRef<any>(null);

  useEffect(() => {
    if (store.accountTier !== 'free' || store.sdkReady) return;

    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
      const container = document.getElementById(containerId);
      if (!container) return;

      const playlistId = useSpotifyStore.getState().selectedPlaylistId ?? '0vvXsWCC9xrXsKd4FyS8kM';
      IFrameAPI.createController(
        container,
        {
          uri: `spotify:playlist:${playlistId}`,
          width: '100%',
          height: 152,
        },
        (ctrl: any) => {
          controllerRef.current = ctrl;
          store.setEmbedReady(true);
        },
      );
    };

    return () => {
      script.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.accountTier, containerId]);

  const play = useCallback(() => {
    controllerRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    controllerRef.current?.pause();
  }, []);

  const loadPlaylist = useCallback((playlistId: string) => {
    controllerRef.current?.loadUri(`spotify:playlist:${playlistId}`);
  }, []);

  return { play, pause, loadPlaylist, controller: controllerRef };
}
