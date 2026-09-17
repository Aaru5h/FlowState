'use client';
import { useState } from 'react';
import { CURATED_PLAYLISTS, parsePlaylistUrl } from '@/lib/spotify';
import { useSpotifyStore } from '@/store/spotifyStore';

export default function PlaylistPicker() {
  const { selectedPlaylistId, setSelectedPlaylist } = useSpotifyStore();
  const [customUrl, setCustomUrl] = useState('');
  const [customError, setCustomError] = useState('');

  const handleCustom = () => {
    const parsed = parsePlaylistUrl(customUrl);
    if (!parsed) {
      setCustomError('Invalid Spotify playlist URL');
      return;
    }
    setCustomError('');
    setSelectedPlaylist(parsed.uri, parsed.id);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-stone-500 font-medium">Pick a playlist</p>
      <div className="flex flex-wrap gap-2">
        {CURATED_PLAYLISTS.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPlaylist(p.uri, p.id)}
            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
              selectedPlaylistId === p.id
                ? 'bg-sage-200 text-sage-800 shadow-sm'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Paste a Spotify playlist link..."
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-stone-50 border border-stone-200 
                     text-stone-600 placeholder:text-stone-300 focus:outline-none focus:ring-2 
                     focus:ring-sage-200 focus:border-transparent"
        />
        <button
          onClick={handleCustom}
          className="px-3 py-1.5 text-sm rounded-lg bg-stone-100 text-stone-500 
                     hover:bg-stone-200 transition-colors"
        >
          Use
        </button>
      </div>
      {customError && <p className="text-xs text-red-400">{customError}</p>}
    </div>
  );
}
