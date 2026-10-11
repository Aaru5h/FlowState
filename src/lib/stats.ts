export interface DayStats {
  date: string;
  completedPomodoros: number;
  sessions: number;
  totalFocusSeconds: number;
}

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function emptyDay(date = dateKey()): DayStats {
  return { date, completedPomodoros: 0, sessions: 0, totalFocusSeconds: 0 };
}

export function updateDay(history: DayStats[], date: string, changes: Partial<Omit<DayStats, 'date'>>): DayStats[] {
  const day = history.find((item) => item.date === date) ?? emptyDay(date);
  const updated = { ...day };
  for (const key of ['sessions', 'completedPomodoros', 'totalFocusSeconds'] as const) {
    updated[key] += changes[key] ?? 0;
  }
  return [...history.filter((item) => item.date !== date), updated].sort((a, b) => a.date.localeCompare(b.date));
}

// Split focus time at local midnight, including a timer restored on another day.
export function recordFocus(history: DayStats[], start: number, end: number): DayStats[] {
  let result = history;
  while (start < end) {
    const midnight = new Date(start);
    midnight.setHours(24, 0, 0, 0);
    const boundary = Math.min(end, midnight.getTime());
    result = updateDay(result, dateKey(new Date(start)), { totalFocusSeconds: (boundary - start) / 1000 });
    start = boundary;
  }
  return result;
}

export function periodStats(history: DayStats[], period: 'day' | 'week' | 'month', now = new Date()): DayStats {
  const start = new Date(now);
  if (period === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  if (period === 'month') start.setDate(1);
  const first = dateKey(start);
  const last = dateKey(now);
  return history.filter((day) => day.date >= first && day.date <= last).reduce((total, day) => ({
    date: last,
    sessions: total.sessions + day.sessions,
    completedPomodoros: total.completedPomodoros + day.completedPomodoros,
    totalFocusSeconds: total.totalFocusSeconds + day.totalFocusSeconds,
  }), emptyDay(last));
}
