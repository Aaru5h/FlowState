'use client';
import { useState } from 'react';
import { PRESETS } from '@/lib/timer';
import { useTimerStore } from '@/store/timerStore';

export default function TimerControls() {
  const { phase, isRunning, secondsLeft, config, start, pause, resume, reset, advancePhase,
          setPreset, setCustomWork, setBreakOverride, soundEnabled, toggleSound } = useTimerStore();
  const [customInput, setCustomInput] = useState('');
  const [customUnit, setCustomUnit] = useState('minutes');
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    const val = parseFloat(customInput);
    if (isNaN(val) || val <= 0) return;
    const minutes = customUnit === 'hours' ? val * 60 : val;
    setCustomWork(minutes);
    setShowCustom(false);
    setCustomInput('');
  };

  const isIdle = phase === 'idle';
  const isEnded = !isRunning && !isIdle && secondsLeft === 0;

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
            <form
              onSubmit={(e) => { e.preventDefault(); handleCustomSubmit(); }}
              className="flex gap-2 items-center justify-center"
            >
              <input
                type="number"
                step="0.5"
                min="0.5"
                aria-label="Focus duration"
                placeholder="Focus duration"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-32 px-3 py-2 text-sm rounded-xl bg-white/80 border border-stone-200
                           text-stone-600 placeholder:text-stone-500 focus:outline-none
                           focus:ring-2 focus:ring-sage-200"
              />
              <select aria-label="Duration unit" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)} className="rounded-xl bg-white/80 px-2 py-2 text-sm text-stone-700">
                <option value="minutes">Minutes</option><option value="hours">Hours</option>
              </select>
              <button
                type="submit"
                className="px-3 py-2 text-sm rounded-xl bg-sage-100 text-sage-700
                           hover:bg-sage-200 transition-colors"
              >
                Set
              </button>
            </form>
          )}

          {/* Break preview */}
          <div className="text-center space-y-1">
            <p className="text-xs text-stone-600">
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
                      : 'text-stone-500 hover:text-stone-500'
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
            onClick={() => {
              // ask on a click: browsers ignore or quietly block permission prompts fired on page load
              if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
              start();
            }}
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
                       hover:bg-lavender-300 transition-all shadow-sm"
          >
            {phase === 'working' ? 'Start Break' : 'Start Focus'}
          </button>
        )}

        {!isIdle && (
          <button
            onClick={reset}
            className="px-4 py-3 rounded-2xl text-stone-600 hover:text-stone-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex justify-center">
        <button onClick={toggleSound} aria-pressed={soundEnabled}
          className="text-sm px-3 py-2 rounded-xl text-stone-600 hover:bg-white/70 transition-colors">
          Sound {soundEnabled ? 'on' : 'off'}
        </button>
      </div>
    </div>
  );
}
