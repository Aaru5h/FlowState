'use client';
import { useSpotifyStore } from '@/store/spotifyStore';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import PlaylistPicker from './PlaylistPicker';
import PremiumPlayerWidget from './PremiumPlayerWidget';
import FreePlayerEmbed from './FreePlayerEmbed';

export default function MusicPanel() {
  const { isLoggedIn, accountTier, musicError } = useSpotifyStore();
  const { login, logout } = useSpotifyAuth();

  if (!isLoggedIn) {
    return (
      <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-stone-200/50 space-y-3">
        <p className="text-sm text-stone-500">Connect Spotify for music while you focus</p>
        <button
          onClick={login}
          className="px-4 py-2 rounded-xl bg-[#1DB954] text-white text-sm font-medium 
                     hover:bg-[#1ed760] transition-colors shadow-sm"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur border border-stone-200/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-600">Music</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            accountTier === 'premium' 
              ? 'bg-amber-100 text-amber-700' 
              : 'bg-stone-100 text-stone-500'
          }`}>
            {accountTier === 'premium' ? 'Premium' : 'Free'}
          </span>
        </div>
        <button
          onClick={logout}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Disconnect
        </button>
      </div>

      {musicError && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{musicError}</p>
      )}

      <PlaylistPicker />

      {accountTier === 'premium' ? <PremiumPlayerWidget /> : <FreePlayerEmbed />}
    </div>
  );
}
