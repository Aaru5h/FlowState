'use client';
import { useSpotifyStore } from '@/store/spotifyStore';
import { loadPlaylist } from '@/hooks/useSpotifyEmbed';
import { useEffect } from 'react';

const CONTAINER_ID = 'spotify-embed-container';

export default function FreePlayerEmbed() {
  const { embedReady, selectedPlaylistId } = useSpotifyStore();

  useEffect(() => {
    if (embedReady && selectedPlaylistId) {
      loadPlaylist(selectedPlaylistId);
    }
  }, [embedReady, selectedPlaylistId]);

  return (
    <div className="rounded-xl overflow-hidden">
      <div id={CONTAINER_ID} />
      {!embedReady && (
        <p className="text-sm text-stone-400 p-3">Loading Spotify player...</p>
      )}
    </div>
  )
}