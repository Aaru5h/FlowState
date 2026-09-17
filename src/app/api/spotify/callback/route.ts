import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// TODO: Fill SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? '';
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI ?? '';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const codeVerifier = request.nextUrl.searchParams.get('code_verifier');

  if (!code) {
    return NextResponse.redirect(new URL('/?spotify_error=no_code', request.url));
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
  });

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/?spotify_error=token_exchange_failed', request.url));
  }

  const tokens = await tokenRes.json();

  const cookieStore = cookies();
  cookieStore.set('spotify_access_token', tokens.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });

  if (tokens.refresh_token) {
    cookieStore.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
  }

  return NextResponse.redirect(new URL('/?spotify=connected', request.url));
}
