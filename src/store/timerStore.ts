import { create } from 'zustand';
import { SessionPhase, TimerConfig, PRESETS, calcBreak, calcLongBreak, nextPhase } from '@/lib/timer';

interface DayStats {
  date: string;
  completedPomodoros: number;
  totalFocusSeconds: number;
}

interface TimerState {
  phase: SessionPhase;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  config: TimerConfig;
  completedPomodoros: number;
  dayStats: DayStats;
  soundEnabled: boolean;

  setPreset: (key: string) => void;
  setCustomWork: (minutes: number) => void;
  setBreakOverride: (minutes: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  tick: () => boolean; // returns true if phase just ended
  reset: () => void;
  advancePhase: () => void;
  toggleSound: () => void;
  hydrate: () => void;
  persist: () => void;
}

const today = () => new Date().toISOString().slice(0, 10);

const defaultConfig = PRESETS['25-5'];

function loadState(): Partial<TimerState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('flowstate-timer');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed.dayStats?.date !== today()) {
      parsed.dayStats = { date: today(), completedPomodoros: 0, totalFocusSeconds: 0 };
    }
    return parsed;
  } catch {
    return {};
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  phase: 'idle',
  secondsLeft: defaultConfig.workMinutes * 60,
  totalSeconds: defaultConfig.workMinutes * 60,
  isRunning: false,
  config: defaultConfig,
  completedPomodoros: 0,
  dayStats: { date: today(), completedPomodoros: 0, totalFocusSeconds: 0 },
  soundEnabled: true,

  setPreset: (key) => {
    const c = PRESETS[key];
    if (!c) return;
    set({
      config: c,
      phase: 'idle',
      secondsLeft: c.workMinutes * 60,
      totalSeconds: c.workMinutes * 60,
      isRunning: false,
    });
    get().persist();
  },

  setCustomWork: (minutes) => {
    const breakMin = calcBreak(minutes);
    const longBreakMin = calcLongBreak(breakMin);
    const c = { workMinutes: minutes, breakMinutes: breakMin, longBreakMinutes: longBreakMin };
    set({
      config: c,
      phase: 'idle',
      secondsLeft: minutes * 60,
      totalSeconds: minutes * 60,
      isRunning: false,
    });
    get().persist();
  },

  setBreakOverride: (minutes) => {
    const c = { ...get().config, breakMinutes: minutes, longBreakMinutes: calcLongBreak(minutes) };
    set({ config: c });
    get().persist();
  },

  start: () => {
    const { config } = get();
    set({
      phase: 'working',
      secondsLeft: config.workMinutes * 60,
      totalSeconds: config.workMinutes * 60,
      isRunning: true,
    });
    get().persist();
  },

  pause: () => {
    set({ isRunning: false });
    get().persist();
  },

  resume: () => {
    set({ isRunning: true });
    get().persist();
  },

  tick: () => {
    const { secondsLeft, phase } = get();
    if (secondsLeft <= 1) {
      set({ secondsLeft: 0, isRunning: false });
      if (phase === 'working') {
        const stats = get().dayStats;
        set({
          dayStats: {
            ...stats,
            completedPomodoros: stats.completedPomodoros + 1,
            totalFocusSeconds: stats.totalFocusSeconds + get().totalSeconds,
          },
          completedPomodoros: get().completedPomodoros + 1,
        });
      }
      get().persist();
      return true;
    }
    set({ secondsLeft: secondsLeft - 1 });
    return false;
  },

  advancePhase: () => {
    const { phase, completedPomodoros, config } = get();
    const next = nextPhase(phase, completedPomodoros);
    let secs: number;
    if (next === 'working') secs = config.workMinutes * 60;
    else if (next === 'longBreak') secs = config.longBreakMinutes * 60;
    else secs = config.breakMinutes * 60;
    set({ phase: next, secondsLeft: secs, totalSeconds: secs, isRunning: true });
    get().persist();
  },

  reset: () => {
    const { config } = get();
    set({
      phase: 'idle',
      secondsLeft: config.workMinutes * 60,
      totalSeconds: config.workMinutes * 60,
      isRunning: false,
    });
    get().persist();
  },

  toggleSound: () => {
    set({ soundEnabled: !get().soundEnabled });
    get().persist();
  },

  hydrate: () => {
    const saved = loadState();
    if (Object.keys(saved).length > 0) {
      set({ ...saved, isRunning: false });
    }
  },

  persist: () => {
    if (typeof window === 'undefined') return;
    const { phase, secondsLeft, totalSeconds, config, completedPomodoros, dayStats, soundEnabled } = get();
    localStorage.setItem('flowstate-timer', JSON.stringify({
      phase, secondsLeft, totalSeconds, config, completedPomodoros, dayStats, soundEnabled,
    }));
  },
}));
