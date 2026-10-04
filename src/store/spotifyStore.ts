import { create } from 'zustand';
import { CURATED_PLAYLISTS } from '@/lib/spotify';

export type AccountTier = 'premium' | 'free' | 'unknown';

interface SpotifyState {
  isLoggedIn: boolean;
  accountTier: AccountTier;
  deviceId: string | null;
  selectedPlaylistUri: string | null;
  selectedPlaylistId: string | null;
  currentTrack: {
    name: string;
    artist: string;
    albumArt: string;
  } | null;
  isPlaying: boolean;
  sdkReady: boolean;
  embedReady: boolean;
  musicError: string | null;

  setLoggedIn: (val: boolean) => void;
  setAccountTier: (tier: AccountTier) => void;
  setDeviceId: (id: string | null) => void;
  setSelectedPlaylist: (uri: string | null, id: string | null) => void;
  setCurrentTrack: (track: SpotifyState['currentTrack']) => void;
  setIsPlaying: (val: boolean) => void;
  setSdkReady: (val: boolean) => void;
  setEmbedReady: (val: boolean) => void;
  setMusicError: (msg: string | null) => void;
  logout: () => void;
}

// last picked playlist, else Lofi Beats (otherwise Premium plays whatever the account last played)
function loadPlaylist(): { uri: string; id: string } {
  try {
    const saved = JSON.parse(localStorage.getItem('flowstate-playlist') ?? 'null');
    if (typeof saved?.uri === 'string' && typeof saved?.id === 'string') return saved;
  } catch {}
  return CURATED_PLAYLISTS[0];
}
const initialPlaylist = typeof window === 'undefined' ? CURATED_PLAYLISTS[0] : loadPlaylist();

export const useSpotifyStore = create<SpotifyState>((set) => ({
  isLoggedIn: false,
  accountTier: 'unknown',
  deviceId: null,
  selectedPlaylistUri: initialPlaylist.uri,
  selectedPlaylistId: initialPlaylist.id,
  currentTrack: null,
  isPlaying: false,
  sdkReady: false,
  embedReady: false,
  musicError: null,

  setLoggedIn: (val) => set({ isLoggedIn: val }),
  setAccountTier: (tier) => set({ accountTier: tier }),
  setDeviceId: (id) => set({ deviceId: id }),
  setSelectedPlaylist: (uri, id) => {
    set({ selectedPlaylistUri: uri, selectedPlaylistId: id });
    try { localStorage.setItem('flowstate-playlist', JSON.stringify({ uri, id })); } catch {}
  },
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setSdkReady: (val) => set({ sdkReady: val }),
  setEmbedReady: (val) => set({ embedReady: val }),
  setMusicError: (msg) => set({ musicError: msg }),
  logout: () => set({
    isLoggedIn: false, accountTier: 'unknown',
    deviceId: null, currentTrack: null, isPlaying: false,
    sdkReady: false, embedReady: false, musicError: null,
  }),
}));
