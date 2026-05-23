// src/features/tasks/components/FocusTimerBar.jsx
//
// Pomodoro-style focus timer — floating bar di atas kanban board.
// Muncul saat user klik "Start Focus" pada task In Progress.
//
// States: focus (25 min) → break (5 min) → focus → ...
// Saves elapsed minutes ke parent via onSessionComplete callback.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, SkipForward, Timer, Coffee } from 'lucide-react';
import Swal from 'sweetalert2';

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const FOCUS_SECONDS = FOCUS_MINUTES * 60;
const BREAK_SECONDS = BREAK_MINUTES * 60;

// Simple chime via Web Audio API (no audio file needed)
const playChime = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 830;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch {
    /* Audio not supported */
  }
};

const swalToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  background: '#1A1F27',
  color: '#F3F4F6',
});

const FocusTimerBar = ({ task, onSessionComplete, onStop }) => {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_SECONDS);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const intervalRef = useRef(null);

  // Track latest callback refs to avoid stale closures
  const onSessionCompleteRef = useRef(onSessionComplete);
  const onStopRef = useRef(onStop);
  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);
  useEffect(() => {
    onStopRef.current = onStop;
  }, [onStop]);

  // Reset when active task changes
  useEffect(() => {
    setMode('focus');
    setTimeLeft(FOCUS_SECONDS);
    setIsPaused(false);
    setSessionCount(1);
  }, [task?.id]);

  // Countdown interval
  useEffect(() => {
    if (isPaused || !task) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          playChime();

          if (mode === 'focus') {
            onSessionCompleteRef.current?.(task, FOCUS_MINUTES);
            swalToast.fire({
              icon: 'success',
              title: `Fokus #${sessionCount} selesai! Istirahat ${BREAK_MINUTES} menit.`,
            });
            setMode('break');
            return BREAK_SECONDS;
          } else {
            swalToast.fire({
              icon: 'info',
              title: 'Istirahat selesai! Siap fokus lagi?',
            });
            setSessionCount((c) => c + 1);
            setMode('focus');
            return FOCUS_SECONDS;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isPaused, mode, task, sessionCount]);

  const handlePauseToggle = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  const handleStop = useCallback(() => {
    clearInterval(intervalRef.current);
    // Save partial focus time
    if (mode === 'focus') {
      const elapsedSeconds = FOCUS_SECONDS - timeLeft;
      const elapsedMinutes = Math.round(elapsedSeconds / 60);
      if (elapsedMinutes > 0) {
        onSessionCompleteRef.current?.(task, elapsedMinutes);
      }
    }
    onStopRef.current?.();
  }, [mode, timeLeft, task]);

  const handleSkipBreak = useCallback(() => {
    clearInterval(intervalRef.current);
    setSessionCount((c) => c + 1);
    setMode('focus');
    setTimeLeft(FOCUS_SECONDS);
    setIsPaused(false);
  }, []);

  if (!task) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const totalDuration = mode === 'focus' ? FOCUS_SECONDS : BREAK_SECONDS;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;
  const isFocus = mode === 'focus';

  return (
    <div
      className={`bg-[#111317] border rounded-2xl p-4 mb-6 transition-colors ${
        isFocus ? 'border-emerald-500/30' : 'border-amber-500/30'
      }`}
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Status & Task name */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`p-2.5 rounded-xl flex-shrink-0 ${
              isFocus ? 'bg-emerald-500/15' : 'bg-amber-500/15'
            }`}
          >
            {isFocus ? (
              <Timer size={18} className="text-emerald-400" />
            ) : (
              <Coffee size={18} className="text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <div
              className={`text-[10px] uppercase font-bold tracking-widest ${
                isFocus ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {isFocus ? `Fokus #${sessionCount}` : 'Istirahat'}
              {isPaused && (
                <span className="ml-2 text-[#7E8796] animate-pulse">
                  · PAUSED
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-[#F3F4F6] truncate max-w-[280px]">
              {task.title}
            </div>
          </div>
        </div>

        {/* Center: Timer display */}
        <div className="flex-shrink-0">
          <div
            className={`text-3xl font-mono font-bold tabular-nums ${
              isFocus ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {String(minutes).padStart(2, '0')}:
            {String(seconds).padStart(2, '0')}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isFocus ? (
            <>
              <button
                onClick={handlePauseToggle}
                className={`p-2 rounded-lg transition-colors ${
                  isPaused
                    ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'
                    : 'bg-[#1A1F27] text-[#C8CFDA] hover:bg-[#2A2F39]'
                }`}
                title={isPaused ? 'Lanjutkan' : 'Jeda'}
              >
                {isPaused ? <Play size={16} /> : <Pause size={16} />}
              </button>
              <button
                onClick={handleStop}
                className="p-2 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
                title="Berhenti & Simpan"
              >
                <Square size={16} />
              </button>
            </>
          ) : (
            <button
              onClick={handleSkipBreak}
              className="px-3 py-2 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <SkipForward size={14} /> Skip
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-[#2A2F39] rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-1.5 rounded-full transition-all duration-1000 ease-linear ${
            isFocus ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default FocusTimerBar;
