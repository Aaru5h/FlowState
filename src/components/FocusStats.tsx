'use client';
import { useEffect, useState } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { periodStats } from '@/lib/stats';

export default function FocusStats() {
  const history = useTimerStore((state) => state.history);
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const id = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  return (
    <section aria-labelledby="focus-stats-title" className="w-full max-w-lg rounded-2xl bg-white/60 p-5 sm:p-6">
      <h2 id="focus-stats-title" className="text-base font-medium text-stone-700">Your focus, over time</h2>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm text-left tabular-nums">
          <caption className="sr-only">Focus activity for today, this week, and this month</caption>
          <thead className="text-xs text-stone-600">
            <tr><th scope="col" className="pb-3 font-normal">Period</th><th scope="col" className="pb-3 text-right font-normal">Pomodoros</th><th scope="col" className="pb-3 text-right font-normal">Sessions</th><th scope="col" className="pb-3 text-right font-normal">Hours</th></tr>
          </thead>
          <tbody>
            {([['day', 'Today'], ['week', 'This week'], ['month', 'This month']] as const).map(([period, label]) => {
              const stats = periodStats(history, period, now);
              return <tr key={period} className="border-t border-stone-200/70 text-stone-700">
                <th scope="row" className="py-3 font-medium">{label}</th>
                <td className="py-3 text-right">{stats.completedPomodoros}</td>
                <td className="py-3 text-right">{stats.sessions}</td>
                <td className="py-3 text-right">{(stats.totalFocusSeconds / 3600).toFixed(2)}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-stone-600">Pomodoros completed · Focus sessions started · Hours focused, including unfinished sessions. Weeks start Monday.</p>
      {history.length === 0 && <p className="mt-2 text-sm text-sage-800">Start a focus session to build your history.</p>}
      <p className="mt-2 text-xs text-stone-600">Saved on this browser.</p>
    </section>
  );
}
