/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect } from 'react';
import { useSpotifyStore } from '@/store/spotifyStore';

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: any) => void;
  }
}

// one shared controller: the hook is mounted once (FlowstateApp); FreePlayerEmbed imports loadPlaylist
let controller: any = null;

export const play = () => controller?.play();
export const pause = () => controller?.pause();
export const loadPlaylist = (playlistId: string) => controller?.loadUri(`spotify:playlist:${playlistId}`);

export function useSpotifyEmbed(containerId: string) {
  const store = useSpotifyStore();

  useEffect(() => {
    if (store.accountTier !== 'free') return;

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
          controller = ctrl;
          store.setEmbedReady(true);
        },
      );
    };

    return () => {
      script.remove();
      controller = null;
      store.setEmbedReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.accountTier, containerId]);

  return { play, pause, loadPlaylist };
}
