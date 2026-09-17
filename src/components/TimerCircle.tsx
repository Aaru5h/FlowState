'use client';
import { formatTime } from '@/lib/timer';

interface Props {
  secondsLeft: number;
  totalSeconds: number;
  phase: string;
  isRunning: boolean;
}

const phaseColors: Record<string, { stroke: string; glow: string }> = {
  idle: { stroke: '#b8c5b0', glow: 'rgba(184, 197, 176, 0.3)' },
  working: { stroke: '#a3b899', glow: 'rgba(163, 184, 153, 0.4)' },
  break: { stroke: '#c4b5d4', glow: 'rgba(196, 181, 212, 0.4)' },
  longBreak: { stroke: '#d4c5a0', glow: 'rgba(212, 197, 160, 0.4)' },
};

export default function TimerCircle({ secondsLeft, totalSeconds, phase, isRunning }: Props) {
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const dashOffset = circumference * (1 - progress);
  const colors = phaseColors[phase] || phaseColors.idle;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="320" height="320" className="transform -rotate-90">
        <circle
          cx="160" cy="160" r={radius}
          fill="none"
          stroke="rgba(200, 200, 200, 0.15)"
          strokeWidth="8"
        />
        <circle
          cx="160" cy="160" r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: 'stroke-dashoffset 1s linear',
            filter: `drop-shadow(0 0 12px ${colors.glow})`,
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-6xl font-light tracking-wider text-stone-700">
          {formatTime(secondsLeft)}
        </span>
        <span className="text-sm text-stone-400 mt-2 capitalize">
          {phase === 'idle' ? 'Ready' : phase === 'longBreak' ? 'Long Break' : phase}
        </span>
        {isRunning && (
          <span className="mt-1 w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        )}
      </div>
    </div>
  );
}
