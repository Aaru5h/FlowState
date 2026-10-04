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
let iframeApi: any = null;

export const play = () => controller?.play();
export const pause = () => controller?.pause();
export const loadPlaylist = (playlistId: string) => controller?.loadUri(`spotify:playlist:${playlistId}`);

export function useSpotifyEmbed(containerId: string) {
  const store = useSpotifyStore();

  useEffect(() => {
    if (store.accountTier !== 'free') return;

    const init = (IFrameAPI: any) => {
      iframeApi = IFrameAPI;
      const container = document.getElementById(containerId);
      if (!container) return;

      const playlistId = useSpotifyStore.getState().selectedPlaylistId ?? '0vvXsWCC9xrXsKd4FyS8kM';
      // createController replaces the element it's given; hand it a child so React's div stays put
      const target = document.createElement('div');
      container.replaceChildren(target);
      IFrameAPI.createController(
        target,
        {
          uri: `spotify:playlist:${playlistId}`,
          width: '100%',
          height: 152,
        },
        (ctrl: any) => {
          controller = ctrl;
          store.setEmbedReady(true);
          // ponytail: Spotify serves ~30s previews when the iframe can't see a logged-in session; we can only tell the user
          ctrl.addListener('playback_update', (e: any) => {
            const d = e?.data?.duration;
            if (d > 0 && d <= 31000) {
              store.setMusicError('Only 30s previews are playing — log in at open.spotify.com in this browser (Safari: turn off "Prevent cross-site tracking"), then reload.');
            }
          });
        },
      );
    };

    // the iframe API fires onSpotifyIframeApiReady only once per page; reuse it after
    if (iframeApi) init(iframeApi);
    else {
      window.onSpotifyIframeApiReady = init;
      if (!document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]')) {
        const script = document.createElement('script');
        script.src = 'https://open.spotify.com/embed/iframe-api/v1';
        script.async = true;
        document.body.appendChild(script);
      }
    }

    return () => {
      controller?.destroy();
      controller = null;
      store.setEmbedReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.accountTier, containerId]);

  return { play, pause, loadPlaylist };
}
