export const CURATED_PLAYLISTS = [
  { name: 'Lofi Beats', uri: 'spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM', id: '0vvXsWCC9xrXsKd4FyS8kM' },
  { name: 'Peaceful Piano', uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO', id: '37i9dQZF1DX4sWSpwq3LiO' },
  { name: 'Chill Vibes', uri: 'spotify:playlist:37i9dQZF1DX3rxVfibe1L0', id: '37i9dQZF1DX3rxVfibe1L0' },
];

export function parsePlaylistUrl(url: string): { id: string; uri: string } | null {
  const match = url.match(/playlist[/:]([a-zA-Z0-9]+)/);
  if (!match) return null;
  return { id: match[1], uri: `spotify:playlist:${match[1]}` };
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(64);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...Array.from(array)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function buildAuthUrl(clientId: string, redirectUri: string, codeChallenge: string): string {
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state',
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
  });

  return `https://accounts.spotify.com/authorize?${params}`;
}
