import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { deviceId } = await request.json();

  if (!deviceId || typeof deviceId !== 'string') {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
  }

  const res = await fetch(
    `https://api.spotify.com/v1/me/player/next?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Skip failed' }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
