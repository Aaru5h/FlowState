'use client';
import { useEffect, useRef } from 'react';
import { useTimerStore } from '@/store/timerStore';
import { playChime } from '@/lib/sounds';

export function useTimer() {
  const store = useTimerStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    store.hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (store.isRunning) {
      intervalRef.current = setInterval(() => {
        const ended = useTimerStore.getState().tick();
        if (ended) {
          if (useTimerStore.getState().soundEnabled) playChime();
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const phase = useTimerStore.getState().phase;
            new Notification('Flowstate', {
              body: phase === 'working' ? 'Work session complete! Time for a break.' : 'Break over! Ready to focus?',
            });
          }
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [store.isRunning]);

  return store;
}
