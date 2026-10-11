import { create } from 'zustand';
import { prepareAlarm } from '@/lib/sounds';
import { SessionPhase, TimerConfig, PRESETS, calcBreak, calcLongBreak, nextPhase } from '@/lib/timer';

import { DayStats, dateKey, updateDay, recordFocus } from '@/lib/stats';

interface TimerState {
  phase: SessionPhase;
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  endsAt: number | null; // wall-clock ms when the running phase ends
  config: TimerConfig;
  completedPomodoros: number;
  history: DayStats[];
  soundEnabled: boolean;

  setPreset: (key: string) => void;
  setCustomWork: (minutes: number) => void;
  setBreakOverride: (minutes: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  tick: () => boolean; // recomputes secondsLeft from endsAt; true if phase just ended
  reset: () => void;
  advancePhase: () => void;
  toggleSound: () => void;
  hydrate: () => void;
  persist: () => void;
}

// local YYYY-MM-DD, so stats roll over at the user's midnight, not UTC's
const today = dateKey;
const endsIn = (secs: number) => Date.now() + secs * 1000;

const defaultConfig = PRESETS['25-5'];

function loadState(): Partial<TimerState> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('flowstate-timer');
    if (!raw) return {};
    const p = JSON.parse(raw);
    const result: Partial<TimerState> = {};
    if (typeof p.phase === 'string' && ['idle', 'working', 'break', 'longBreak'].includes(p.phase)) result.phase = p.phase;
    if (typeof p.secondsLeft === 'number' && p.secondsLeft >= 0) result.secondsLeft = p.secondsLeft;
    if (typeof p.totalSeconds === 'number' && p.totalSeconds > 0) result.totalSeconds = p.totalSeconds;
    if (typeof p.completedPomodoros === 'number') result.completedPomodoros = p.completedPomodoros;
    if (typeof p.soundEnabled === 'boolean') result.soundEnabled = p.soundEnabled;
    if (typeof p.endsAt === 'number') { result.endsAt = p.endsAt; result.isRunning = true; }
    if (p.config && typeof p.config.workMinutes === 'number' && typeof p.config.breakMinutes === 'number' && typeof p.config.longBreakMinutes === 'number') {
      result.config = { workMinutes: p.config.workMinutes, breakMinutes: p.config.breakMinutes, longBreakMinutes: p.config.longBreakMinutes };
    }
    const entries = Array.isArray(p.history) ? p.history : p.dayStats ? [p.dayStats] : [];
    result.history = entries.filter((day: DayStats) =>
      /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
      Number.isFinite(day.completedPomodoros) && day.completedPomodoros >= 0 &&
      Number.isFinite(day.totalFocusSeconds) && day.totalFocusSeconds >= 0
    ).map((day: DayStats) => ({
      date: day.date, completedPomodoros: day.completedPomodoros,
      totalFocusSeconds: day.totalFocusSeconds,
      sessions: Number.isFinite(day.sessions) && day.sessions >= 0 ? day.sessions : day.completedPomodoros,
    }));
    return result;
  } catch {
    return {};
  }
}

export const useTimerStore = create<TimerState>((set, get) => ({
  phase: 'idle',
  secondsLeft: defaultConfig.workMinutes * 60,
  totalSeconds: defaultConfig.workMinutes * 60,
  isRunning: false,
  endsAt: null,
  config: defaultConfig,
  completedPomodoros: 0,
  history: [],
  soundEnabled: true,

  setPreset: (key) => {
    get().tick();
    const c = PRESETS[key];
    if (!c) return;
    set({
      config: c,
      phase: 'idle',
      secondsLeft: c.workMinutes * 60,
      totalSeconds: c.workMinutes * 60,
      isRunning: false,
      endsAt: null,
    });
    get().persist();
  },

  setCustomWork: (minutes) => {
    get().tick();
    minutes = Math.max(1, Math.round(minutes)); // 1.1h * 60 = 66.00000000000001
    const breakMin = calcBreak(minutes);
    const longBreakMin = calcLongBreak(breakMin);
    const c = { workMinutes: minutes, breakMinutes: breakMin, longBreakMinutes: longBreakMin };
    set({
      config: c,
      phase: 'idle',
      secondsLeft: minutes * 60,
      totalSeconds: minutes * 60,
      isRunning: false,
      endsAt: null,
    });
    get().persist();
  },

  setBreakOverride: (minutes) => {
    const c = { ...get().config, breakMinutes: minutes, longBreakMinutes: calcLongBreak(minutes) };
    set({ config: c });
    get().persist();
  },

  start: () => {
    prepareAlarm();
    const { config } = get();
    set({
      history: updateDay(get().history, today(), { sessions: 1 }),
      phase: 'working',
      secondsLeft: config.workMinutes * 60,
      totalSeconds: config.workMinutes * 60,
      isRunning: true,
      endsAt: endsIn(config.workMinutes * 60),
    });
    get().persist();
  },

  pause: () => {
    get().tick();
    set({ isRunning: false, endsAt: null });
    get().persist();
  },

  resume: () => {
    prepareAlarm();
    set({ isRunning: true, endsAt: endsIn(get().secondsLeft) });
    get().persist();
  },

  // Derive from the wall clock — background tabs throttle setInterval to ~1/min
  tick: () => {
    const { endsAt, isRunning, phase, secondsLeft: previous, history } = get();
    if (!isRunning || endsAt === null) return false;
    const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
    let updatedHistory = history;
    if (phase === 'working' && secondsLeft < previous) {
      updatedHistory = recordFocus(history, endsAt - previous * 1000, endsAt - secondsLeft * 1000);
    }
    if (secondsLeft === 0) {
      if (phase === 'working') {
        updatedHistory = updateDay(updatedHistory, dateKey(new Date(endsAt)), { completedPomodoros: 1 });
      }
      set({ secondsLeft: 0, isRunning: false, endsAt: null, history: updatedHistory,
        completedPomodoros: get().completedPomodoros + (phase === 'working' ? 1 : 0) });
      get().persist();
      return true;
    }
    if (secondsLeft !== previous) {
      set({ secondsLeft, history: updatedHistory });
      get().persist();
    }
    return false;
  },

  advancePhase: () => {
    prepareAlarm();
    const { phase, completedPomodoros, config } = get();
    const next = nextPhase(phase, completedPomodoros);
    let secs: number;
    if (next === 'working') secs = config.workMinutes * 60;
    else if (next === 'longBreak') secs = config.longBreakMinutes * 60;
    else secs = config.breakMinutes * 60;
    set({ history: next === 'working' ? updateDay(get().history, today(), { sessions: 1 }) : get().history, phase: next, secondsLeft: secs, totalSeconds: secs, isRunning: true, endsAt: endsIn(secs) });
    get().persist();
  },

  reset: () => {
    get().tick();
    const { config } = get();
    set({
      phase: 'idle',
      secondsLeft: config.workMinutes * 60,
      totalSeconds: config.workMinutes * 60,
      isRunning: false,
      endsAt: null,
    });
    get().persist();
  },

  toggleSound: () => {
    set({ soundEnabled: !get().soundEnabled });
    get().persist();
  },

  hydrate: () => {
    const saved = loadState();
    if (Object.keys(saved).length > 0) set(saved);
  },

  persist: () => {
    if (typeof window === 'undefined') return;
    const { phase, secondsLeft, totalSeconds, endsAt, config, completedPomodoros, history, soundEnabled } = get();
    localStorage.setItem('flowstate-timer', JSON.stringify({
      phase, secondsLeft, totalSeconds, endsAt, config, completedPomodoros, history, soundEnabled,
    }));
  },
}));
