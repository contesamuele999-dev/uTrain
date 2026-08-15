import React, { useState } from 'react';
import { Play, Dumbbell, ChevronRight, Sparkles } from 'lucide-react';
import type { Routine, RoutineDay } from '../../types/workout';

interface QuickStartCardProps {
  activeRoutine: Routine | undefined;
  onStartWorkout: (routine: Routine, day: RoutineDay) => void;
  onOpenRoutines: () => void;
  onOpenAIGenerator: () => void;
}

export const QuickStartCard: React.FC<QuickStartCardProps> = ({
  activeRoutine,
  onStartWorkout,
  onOpenRoutines,
  onOpenAIGenerator,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!activeRoutine || activeRoutine.days.length === 0) {
    return (
      <div
        className="glass-card"
        style={{
          padding: '18px 16px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          background: 'linear-gradient(135deg, rgba(18, 21, 30, 0.9) 0%, rgba(27, 32, 46, 0.8) 100%)',
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Dumbbell size={22} color="#10b981" />
        </div>

        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 2 }}>
            Nessuna scheda attiva
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 360 }}>
            Genera una scheda scientifica con l&apos;AI di Gemini in 5 secondi oppure scegline una predefinita.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={onOpenAIGenerator} className="btn-ai" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>
            <Sparkles size={15} /> Crea Scheda con AI
          </button>
          <button onClick={onOpenRoutines} className="btn-secondary" style={{ padding: '7px 12px', fontSize: '0.8rem' }}>
            Sfoglia Schede
          </button>
        </div>
      </div>
    );
  }

  const selectedDay = activeRoutine.days[selectedDayIndex] || activeRoutine.days[0];

  return (
    <div
      className="glass-card glow-card"
      style={{
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="chip chip-green">
            Scheda Attiva
          </span>
          {activeRoutine.isAiGenerated && (
            <span className="chip chip-purple">
              <Sparkles size={11} /> AI
            </span>
          )}
        </div>

        <button
          onClick={onOpenRoutines}
          className="btn-ghost"
          style={{ fontSize: '0.74rem', padding: '2px 6px' }}
        >
          Cambia <ChevronRight size={13} />
        </button>
      </div>

      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 2, color: '#fff' }}>
        {activeRoutine.title}
      </h2>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.3 }}>
        {activeRoutine.description}
      </p>

      {/* Day Selector Chips */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 4,
        }}>
          {activeRoutine.days.map((day, idx) => (
            <button
              key={day.id}
              onClick={() => setSelectedDayIndex(idx)}
              style={{
                background: selectedDayIndex === idx ? 'var(--accent-primary)' : 'var(--bg-input)',
                color: selectedDayIndex === idx ? '#000' : 'var(--text-primary)',
                border: `1px solid ${selectedDayIndex === idx ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '0.78rem',
                fontWeight: selectedDayIndex === idx ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {day.name.split(':')[0] || `Giorno ${idx + 1}`}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Day Preview */}
      <div style={{
        background: 'var(--bg-input)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        marginBottom: 12,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          {selectedDay.name}
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
          {selectedDay.exercises.length} Esercizi: {selectedDay.exercises.map((e) => e.name).slice(0, 3).join(', ')}
          {selectedDay.exercises.length > 3 ? ` + altri ${selectedDay.exercises.length - 3}` : ''}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onStartWorkout(activeRoutine, selectedDay)}
        className="btn-primary"
        style={{
          width: '100%',
          padding: '11px 16px',
          fontSize: '0.92rem',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <Play size={18} fill="#fff" /> Inizia Sessione
      </button>
    </div>
  );
};
