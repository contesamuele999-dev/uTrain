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
          padding: '24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          background: 'linear-gradient(135deg, rgba(18, 21, 30, 0.9) 0%, rgba(27, 32, 46, 0.8) 100%)',
        }}
      >
        <div style={{
          width: 54,
          height: 54,
          borderRadius: 'var(--radius-full)',
          background: 'rgba(16, 185, 129, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Dumbbell size={28} color="#10b981" />
        </div>

        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>
            Nessuna scheda attiva selezionata
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: 420 }}>
            Genera una scheda scientifica su misura con l&apos;AI di Gemini in 5 secondi oppure scegline una predefinita.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button onClick={onOpenAIGenerator} className="btn-ai">
            <Sparkles size={18} /> Crea Scheda con AI Gemini
          </button>
          <button onClick={onOpenRoutines} className="btn-secondary">
            Sfoglia Schede Esistenti
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
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background Accent Glow */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="chip chip-green">
            Scheda Attiva
          </span>
          {activeRoutine.isAiGenerated && (
            <span className="chip chip-purple">
              <Sparkles size={12} /> AI Designed
            </span>
          )}
        </div>

        <button
          onClick={onOpenRoutines}
          className="btn-ghost"
          style={{ fontSize: '0.8rem', padding: '4px 8px' }}
        >
          Cambia Scheda <ChevronRight size={14} />
        </button>
      </div>

      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4, color: '#fff' }}>
        {activeRoutine.title}
      </h2>
      <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
        {activeRoutine.description}
      </p>

      {/* Day Selector Chips */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
          Seleziona Sessione da eseguire:
        </label>
        <div style={{
          display: 'flex',
          gap: 8,
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
                padding: '8px 12px',
                fontSize: '0.84rem',
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
        background: 'var(--bg-card-hover)',
        borderRadius: 'var(--radius-sm)',
        padding: '12px 14px',
        marginBottom: 16,
        border: '1px solid var(--border-subtle)',
      }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
          {selectedDay.name}
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
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
          padding: '14px 20px',
          fontSize: '1.05rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)',
        }}
      >
        <Play size={22} fill="#fff" /> Inizia Allenamento Ora
      </button>
    </div>
  );
};
