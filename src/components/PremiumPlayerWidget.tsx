'use client';
import Image from "next/image";
import { useSpotifyStore } from '@/store/spotifyStore';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

export default function PremiumPlayerWidget() {
  const { currentTrack, isPlaying, sdkReady } = useSpotifyStore();
  const { pause, resume, skip } = useSpotifyPlayer();

  if (!sdkReady) {
    return <p className="text-sm text-stone-400">Connecting to Spotify...</p>;
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50/80 backdrop-blur">
      {currentTrack?.albumArt && (
        <Image
          src={currentTrack.albumArt}
          alt="Album art"
          width={48} height={48} className="w-12 h-12 rounded-lg shadow-sm"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-700 truncate">
          {currentTrack?.name ?? 'No track'}
        </p>
        <p className="text-xs text-stone-400 truncate">
          {currentTrack?.artist ?? ''}
        </p>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => (isPlaying ? pause() : resume())}
          className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center 
                     justify-center transition-colors text-stone-600"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={skip}
          className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center 
                     justify-center transition-colors text-stone-600"
        >
          ⏭
        </button>
      </div>
    </div>
  );
}
