import { create } from 'zustand';

export type AccountTier = 'premium' | 'free' | 'unknown';

interface SpotifyState {
  isLoggedIn: boolean;
  accountTier: AccountTier;
  accessToken: string | null;
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
  setAccessToken: (token: string | null) => void;
  setDeviceId: (id: string | null) => void;
  setSelectedPlaylist: (uri: string | null, id: string | null) => void;
  setCurrentTrack: (track: SpotifyState['currentTrack']) => void;
  setIsPlaying: (val: boolean) => void;
  setSdkReady: (val: boolean) => void;
  setEmbedReady: (val: boolean) => void;
  setMusicError: (msg: string | null) => void;
  logout: () => void;
}

export const useSpotifyStore = create<SpotifyState>((set) => ({
  isLoggedIn: false,
  accountTier: 'unknown',
  accessToken: null,
  deviceId: null,
  selectedPlaylistUri: null,
  selectedPlaylistId: null,
  currentTrack: null,
  isPlaying: false,
  sdkReady: false,
  embedReady: false,
  musicError: null,

  setLoggedIn: (val) => set({ isLoggedIn: val }),
  setAccountTier: (tier) => set({ accountTier: tier }),
  setAccessToken: (token) => set({ accessToken: token }),
  setDeviceId: (id) => set({ deviceId: id }),
  setSelectedPlaylist: (uri, id) => set({ selectedPlaylistUri: uri, selectedPlaylistId: id }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setSdkReady: (val) => set({ sdkReady: val }),
  setEmbedReady: (val) => set({ embedReady: val }),
  setMusicError: (msg) => set({ musicError: msg }),
  logout: () => set({
    isLoggedIn: false, accountTier: 'unknown', accessToken: null,
    deviceId: null, currentTrack: null, isPlaying: false,
    sdkReady: false, embedReady: false, musicError: null,
  }),
}));
