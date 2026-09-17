'use client';
import { useCallback, useEffect } from 'react';
import { useSpotifyStore } from '@/store/spotifyStore';
import { generateCodeVerifier, generateCodeChallenge, buildAuthUrl } from '@/lib/spotify';

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ?? '';

function setTempCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=600; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
}

export function useSpotifyAuth() {
  const store = useSpotifyStore();

  const login = useCallback(async () => {
    if (!CLIENT_ID || !REDIRECT_URI) {
      store.setMusicError('Spotify not configured');
      return;
    }
    const verifier = generateCodeVerifier();
    const state = generateCodeVerifier();
    setTempCookie('spotify_code_verifier', verifier);
    setTempCookie('spotify_oauth_state', state);
    const challenge = await generateCodeChallenge(verifier);
    window.location.href = buildAuthUrl(CLIENT_ID, REDIRECT_URI, challenge, state);
  }, [store]);

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/spotify/me');
      if (!res.ok) return;
      const data = await res.json();
      store.setLoggedIn(true);
      store.setAccountTier(data.product === 'premium' ? 'premium' : 'free');
    } catch {
      // not logged in
    }
  }, [store]);

  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/spotify/logout', { method: 'POST' });
    store.logout();
  }, [store]);

  return { login, logout, checkSession };
}
