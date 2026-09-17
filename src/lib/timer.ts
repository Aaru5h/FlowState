export type SessionPhase = 'idle' | 'working' | 'break' | 'longBreak';

export interface TimerConfig {
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
}

export const PRESETS: Record<string, TimerConfig> = {
  '25-5': { workMinutes: 25, breakMinutes: 5, longBreakMinutes: 10 },
  '50-10': { workMinutes: 50, breakMinutes: 10, longBreakMinutes: 20 },
  '90-15': { workMinutes: 90, breakMinutes: 15, longBreakMinutes: 30 },
};

export function calcBreak(workMinutes: number): number {
  const raw = workMinutes / 5;
  const rounded = Math.round(raw / 5) * 5;
  return Math.max(5, Math.min(30, rounded));
}

export function calcLongBreak(breakMinutes: number): number {
  return Math.min(60, breakMinutes * 2);
}

export function nextPhase(current: SessionPhase, completedPomodoros: number): SessionPhase {
  if (current === 'idle' || current === 'break' || current === 'longBreak') return 'working';
  if ((completedPomodoros + 1) % 4 === 0) return 'longBreak';
  return 'break';
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
