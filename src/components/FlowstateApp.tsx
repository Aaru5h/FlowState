'use client';
import { useEffect } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useSpotifyEmbed } from '@/hooks/useSpotifyEmbed';
import { usePlaybackSync } from '@/hooks/usePlaybackSync';
import TimerCircle from './TimerCircle';
import TimerControls from './TimerControls';
import MusicPanel from './MusicPanel';

export default function FlowstateApp() {
  const timer = useTimer();
  const premium = useSpotifyPlayer();
  const embed = useSpotifyEmbed('spotify-embed-container');

  usePlaybackSync(premium.play, premium.pause, premium.resume, embed.play, embed.pause);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-sage-50 to-lavender-50 
                    flex flex-col items-center justify-center p-6 gap-8">
      {/* Header */}
      <h1 className="text-2xl font-light text-stone-500 tracking-widest">FLOWSTATE</h1>

      {/* Timer */}
      <TimerCircle
        secondsLeft={timer.secondsLeft}
        totalSeconds={timer.totalSeconds}
        phase={timer.phase}
        isRunning={timer.isRunning}
      />

      {/* Controls */}
      <TimerControls />

      {/* Music */}
      <div className="w-full max-w-sm">
        <MusicPanel />
      </div>
    </div>
  );
}
