import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Volume2, VolumeX, Bell } from 'lucide-react';
import { Sound } from '../../services/audio';
import { formatDuration } from '../../utils/calculations';

interface RestTimerProps {
  initialSeconds: number;
  isActive: boolean;
  onFinish?: () => void;
  onClose?: () => void;
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds,
  isActive: propIsActive,
  onFinish,
  onClose,
}) => {
  const [totalTime, setTotalTime] = useState<number>(initialSeconds || 90);
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds || 90);
  const [isRunning, setIsRunning] = useState<boolean>(propIsActive);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);

  const prevInitialSecondsRef = useRef(initialSeconds);

  useEffect(() => {
    if (initialSeconds !== prevInitialSecondsRef.current) {
      prevInitialSecondsRef.current = initialSeconds;
      setTotalTime(initialSeconds);
      setTimeLeft(initialSeconds);
      setIsRunning(propIsActive);
    }
  }, [initialSeconds, propIsActive]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (!soundMuted) {
              Sound.playRestCompletedChime();
            }
            if (onFinish) onFinish();
            setIsRunning(false);
            return 0;
          }

          if (prev <= 4 && !soundMuted) {
            Sound.playCountdownBeep();
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, soundMuted, onFinish]);

  const addTime = (seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
    setTotalTime((prev) => Math.max(prev, timeLeft + seconds));
  };

  const progressPercent = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  return (
    <div
      style={{
        background: 'rgba(18, 21, 30, 0.95)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: 'var(--radius-sm)',
        padding: '8px 12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 12px rgba(16, 185, 129, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: '100%',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Bell size={13} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Timer Recupero
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="btn-ghost"
            style={{ padding: 2 }}
            title={soundMuted ? 'Riattiva suono' : 'Disattiva suono'}
          >
            {soundMuted ? <VolumeX size={14} color="var(--text-muted)" /> : <Volume2 size={14} color="var(--accent-primary)" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-ghost" style={{ padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Timer Display */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div style={{
          fontSize: '1.6rem',
          fontWeight: 800,
          fontFamily: 'var(--font-mono)',
          color: timeLeft === 0 ? 'var(--accent-primary)' : '#fff',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          {formatDuration(timeLeft)}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={() => addTime(-15)}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          >
            -15s
          </button>
          <button
            onClick={() => addTime(30)}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
          >
            +30s
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={isRunning ? 'btn-secondary' : 'btn-primary'}
            style={{ padding: '5px 10px', borderRadius: 'var(--radius-sm)' }}
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} fill="#fff" />}
          </button>
          <button
            onClick={() => {
              setTimeLeft(totalTime);
              setIsRunning(false);
            }}
            className="btn-ghost"
            style={{ padding: 4 }}
            title="Resetta timer"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: 3,
        background: 'rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-full)',
        overflow: 'hidden',
      }}>
        <div
          style={{
            width: `${Math.min(100, Math.max(0, progressPercent))}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #34d399)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
};
