'use client';
import { useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { playChime } from '@/lib/sounds';

export function useTimer() {
  const store = useTimerStore();

  useEffect(() => {
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!store.isRunning) return;
    const onTick = () => {
      const ended = useTimerStore.getState().tick();
      if (!ended) return;
      if (useTimerStore.getState().soundEnabled) playChime();
      if ('Notification' in window && Notification.permission === 'granted') {
        const phase = useTimerStore.getState().phase;
        new Notification('Flowstate', {
          body: phase === 'working' ? 'Work session complete! Time for a break.' : 'Break over! Ready to focus?',
        });
      }
    };
    onTick(); // catch up immediately (e.g. restored from a reload)
    const id = setInterval(onTick, 1000);
    // throttled background intervals can lag up to ~1 min; refresh the moment the tab is shown
    document.addEventListener('visibilitychange', onTick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onTick);
    };
  }, [store.isRunning]);

  return store;
}
