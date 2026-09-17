'use client';
import { useState } from 'react';
import { PRESETS } from '@/lib/timer';
import { useTimerStore } from '@/store/timerStore';

export default function TimerControls() {
  const { phase, isRunning, config, start, pause, resume, reset, advancePhase,
          setPreset, setCustomWork, setBreakOverride, completedPomodoros,
          dayStats, soundEnabled, toggleSound } = useTimerStore();
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    const val = parseFloat(customInput);
    if (isNaN(val) || val <= 0) return;
    // support decimal hours: if > 5, treat as minutes; otherwise check if they meant hours
    const minutes = val > 5 ? val : val * 60;
    setCustomWork(minutes);
    setShowCustom(false);
    setCustomInput('');
  };

  const isIdle = phase === 'idle';
  const isEnded = !isRunning && !isIdle && useTimerStore.getState().secondsLeft === 0;

  return (
    <div className="space-y-6 w-full max-w-sm">
      {/* Preset chips */}
      {isIdle && (
        <div className="space-y-3">
          <div className="flex gap-2 justify-center">
            {Object.entries(PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setPreset(key)}
                className={`px-4 py-2 rounded-xl text-sm transition-all ${
                  config.workMinutes === preset.workMinutes && config.breakMinutes === preset.breakMinutes
                    ? 'bg-sage-200 text-sage-800 shadow-sm'
                    : 'bg-white/60 text-stone-500 hover:bg-white/80 border border-stone-200/50'
                }`}
              >
                {preset.workMinutes}/{preset.breakMinutes}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(!showCustom)}
              className="px-4 py-2 rounded-xl text-sm bg-white/60 text-stone-500 
                         hover:bg-white/80 border border-stone-200/50 transition-all"
            >
              Custom
            </button>
          </div>

          {showCustom && (
            <div className="flex gap-2 items-center justify-center">
              <input
                type="number"
                step="0.5"
                min="1"
                placeholder="Minutes (or 1.5 = 90 min)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-48 px-3 py-2 text-sm rounded-xl bg-white/80 border border-stone-200 
                           text-stone-600 placeholder:text-stone-300 focus:outline-none 
                           focus:ring-2 focus:ring-sage-200"
              />
              <button
                onClick={handleCustomSubmit}
                className="px-3 py-2 text-sm rounded-xl bg-sage-100 text-sage-700 
                           hover:bg-sage-200 transition-colors"
              >
                Set
              </button>
            </div>
          )}

          {/* Break preview */}
          <div className="text-center space-y-1">
            <p className="text-xs text-stone-400">
              Break: {config.breakMinutes} min · Long break: {config.longBreakMinutes} min
            </p>
            <div className="flex gap-2 justify-center">
              {[5, 10, 15, 20].map((m) => (
                <button
                  key={m}
                  onClick={() => setBreakOverride(m)}
                  className={`text-xs px-2 py-1 rounded-lg transition-all ${
                    config.breakMinutes === m
                      ? 'bg-lavender-100 text-lavender-700'
                      : 'text-stone-300 hover:text-stone-500'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main action buttons */}
      <div className="flex gap-3 justify-center">
        {isIdle && (
          <button
            onClick={start}
            className="px-8 py-3 rounded-2xl bg-sage-200 text-sage-800 font-medium 
                       hover:bg-sage-300 transition-all shadow-sm text-lg"
          >
            Start Focus
          </button>
        )}

        {isRunning && (
          <button
            onClick={pause}
            className="px-8 py-3 rounded-2xl bg-white/80 text-stone-500 font-medium 
                       hover:bg-white transition-all border border-stone-200/50"
          >
            Pause
          </button>
        )}

        {!isRunning && !isIdle && !isEnded && (
          <button
            onClick={resume}
            className="px-8 py-3 rounded-2xl bg-sage-200 text-sage-800 font-medium 
                       hover:bg-sage-300 transition-all shadow-sm"
          >
            Resume
          </button>
        )}

        {isEnded && (
          <button
            onClick={advancePhase}
            className="px-8 py-3 rounded-2xl bg-lavender-200 text-lavender-800 font-medium 
                       hover:bg-lavender-300 transition-all shadow-sm animate-pulse"
          >
            {phase === 'working' ? 'Start Break' : 'Start Focus'}
          </button>
        )}

        {!isIdle && (
          <button
            onClick={reset}
            className="px-4 py-3 rounded-2xl text-stone-400 hover:text-stone-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Session stats */}
      <div className="flex gap-4 justify-center text-xs text-stone-400">
        <span>Session {(completedPomodoros % 4) + 1}/4</span>
        <span>·</span>
        <span>{dayStats.completedPomodoros} pomodoros today</span>
        <span>·</span>
        <span>{Math.round(dayStats.totalFocusSeconds / 60)} min focused</span>
        <span>·</span>
        <button onClick={toggleSound} className="hover:text-stone-600 transition-colors">
          {soundEnabled ? '🔔' : '🔕'}
        </button>
      </div>
    </div>
  );
}
