import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(request: NextRequest) {
  const cookieStore = cookies();
  const accessToken = cookieStore.get('spotify_access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { deviceId, contextUri } = await request.json();

  if (!deviceId || typeof deviceId !== 'string') {
    return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
  }

  const body: Record<string, string> = {};
  if (contextUri && typeof contextUri === 'string') {
    body.context_uri = contextUri;
  }

  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Playback failed' }, { status: res.status });
  }

  return NextResponse.json({ ok: true });
}
