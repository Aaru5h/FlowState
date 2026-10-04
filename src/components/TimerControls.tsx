'use client';
import { useEffect, useState } from 'react';
import { PRESETS } from '@/lib/timer';
import { useTimerStore } from '@/store/timerStore';
import { DND_SHORTCUT, dndSupported, setDnd } from '@/lib/dnd';

export default function TimerControls() {
  const { phase, isRunning, secondsLeft, config, start, pause, resume, reset, advancePhase,
          setPreset, setCustomWork, setBreakOverride, completedPomodoros,
          dayStats, soundEnabled, toggleSound, deepFocus, toggleDeepFocus } = useTimerStore();
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [canDnd, setCanDnd] = useState(false);
  useEffect(() => setCanDnd(dndSupported()), []); // after mount: no navigator during SSR

  // Deep Focus Sprint: DnD on while a focus session runs, off when it pauses/resets.
  // A session that finishes needs no call: the shortcut set DnD to end at the same time.
  const withDnd = (action: () => void) => () => {
    const before = useTimerStore.getState();
    const wasFocusing = before.phase === 'working' && before.isRunning;
    action();
    const s = useTimerStore.getState();
    if (!s.deepFocus || !dndSupported()) return;
    const focusing = s.phase === 'working' && s.isRunning;
    if (focusing) setDnd(s.secondsLeft / 60);
    else if (wasFocusing) setDnd(0);
  };

  const handleToggleDeepFocus = () => {
    toggleDeepFocus();
    const s = useTimerStore.getState();
    if (s.phase === 'working' && s.isRunning) setDnd(s.deepFocus ? s.secondsLeft / 60 : 0);
  };

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
                min="1"
                placeholder="Minutes (or 1.5 = 90 min)"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="w-48 px-3 py-2 text-sm rounded-xl bg-white/80 border border-stone-200 
                           text-stone-600 placeholder:text-stone-300 focus:outline-none 
                           focus:ring-2 focus:ring-sage-200"
              />
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
            onClick={() => {
              // ask on a click: browsers ignore or quietly block permission prompts fired on page load
              if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
              withDnd(start)();
            }}
            className="px-8 py-3 rounded-2xl bg-sage-200 text-sage-800 font-medium 
                       hover:bg-sage-300 transition-all shadow-sm text-lg"
          >
            Start Focus
          </button>
        )}

        {isRunning && (
          <button
            onClick={withDnd(pause)}
            className="px-8 py-3 rounded-2xl bg-white/80 text-stone-500 font-medium 
                       hover:bg-white transition-all border border-stone-200/50"
          >
            Pause
          </button>
        )}

        {!isRunning && !isIdle && !isEnded && (
          <button
            onClick={withDnd(resume)}
            className="px-8 py-3 rounded-2xl bg-sage-200 text-sage-800 font-medium 
                       hover:bg-sage-300 transition-all shadow-sm"
          >
            Resume
          </button>
        )}

        {isEnded && (
          <button
            onClick={withDnd(advancePhase)}
            className="px-8 py-3 rounded-2xl bg-lavender-200 text-lavender-800 font-medium 
                       hover:bg-lavender-300 transition-all shadow-sm animate-pulse"
          >
            {phase === 'working' ? 'Start Break' : 'Start Focus'}
          </button>
        )}

        {!isIdle && (
          <button
            onClick={withDnd(reset)}
            className="px-4 py-3 rounded-2xl text-stone-400 hover:text-stone-600 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {canDnd && (
        <div className="text-center space-y-2">
          <button
            onClick={handleToggleDeepFocus}
            aria-pressed={deepFocus}
            className={`px-4 py-2 rounded-xl text-sm transition-all ${
              deepFocus
                ? 'bg-lavender-100 text-lavender-700 shadow-sm'
                : 'bg-white/60 text-stone-500 hover:bg-white/80 border border-stone-200/50'
            }`}
          >
            🌙 Deep Focus Sprint · {deepFocus ? 'On' : 'Off'}
          </button>
          <p className="text-xs text-stone-400">
            {deepFocus ? 'Do Not Disturb turns on for each focus session' : 'Silence notifications while you focus'}
            {' · '}
            <button onClick={() => setShowSetup(!showSetup)} className="underline hover:text-stone-600">
              {showSetup ? 'Hide setup' : 'Setup'}
            </button>
          </p>
          {showSetup && (
            <ol className="text-left text-xs text-stone-500 bg-white/60 rounded-xl p-3 space-y-1 list-decimal list-inside">
              <li>Open the Shortcuts app and make a new shortcut named <b>{DND_SHORTCUT}</b>.</li>
              <li>In its details, turn on receiving <b>Text</b> input.</li>
              <li>Add <b>If</b>: Shortcut Input <i>is</i> 0 → <b>Set Focus</b>: turn Do Not Disturb <i>Off</i>.</li>
              <li>Otherwise → <b>Adjust Date</b>: add Shortcut Input minutes to Current Date → <b>Set Focus</b>: turn Do Not Disturb <i>On</i> until <i>Time</i> = Adjusted Date.</li>
              <li>The first time, your browser asks to open Shortcuts. Tick “Always allow”.</li>
            </ol>
          )}
        </div>
      )}

      {/* Session stats */}
      <div className="flex gap-4 justify-center text-xs text-stone-400">
        <span>Session {(completedPomodoros % 4) + 1}/4</span>
        <span>·</span>
        <span>{dayStats.completedPomodoros} pomodoro{dayStats.completedPomodoros === 1 ? '' : 's'} today</span>
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
