import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import type { CompletedSet, SetType } from '../../types/workout';

interface SetRowProps {
  set: CompletedSet;
  previousLogSet?: { weight: number; reps: number };
  onUpdate: (updatedSet: CompletedSet) => void;
  onDelete: () => void;
  onToggleComplete: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  previousLogSet,
  onUpdate,
  onDelete,
  onToggleComplete,
}) => {
  const handleWeightChange = (delta: number) => {
    const nextWeight = Math.max(0, Math.round((set.weight + delta) * 100) / 100);
    onUpdate({ ...set, weight: nextWeight });
  };

  const handleRepsChange = (delta: number) => {
    const nextReps = Math.max(0, set.reps + delta);
    onUpdate({ ...set, reps: nextReps });
  };

  const cycleSetType = () => {
    const types: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
    const currIdx = types.indexOf(set.type);
    const nextType = types[(currIdx + 1) % types.length];
    onUpdate({ ...set, type: nextType });
  };

  const typeLabels: Record<SetType, { label: string; color: string; bg: string }> = {
    normal: { label: `${set.setNumber}`, color: '#fff', bg: 'var(--bg-input)' },
    warmup: { label: 'W', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' },
    drop: { label: 'D', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' },
    failure: { label: 'F', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
  };

  const typeInfo = typeLabels[set.type] || typeLabels.normal;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1.1fr 1.1fr 50px 32px',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        background: set.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
        border: `1px solid ${set.completed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-sm)',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Set Number / Type Button */}
      <button
        type="button"
        onClick={cycleSetType}
        title="Tocca per cambiare tipo serie (Normale / Riscaldamento / Drop / Cedimento)"
        style={{
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-sm)',
          background: typeInfo.bg,
          color: typeInfo.color,
          border: '1px solid var(--border-subtle)',
          fontWeight: 800,
          fontSize: '0.82rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
        }}
      >
        {typeInfo.label}
      </button>

      {/* Weight Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            type="button"
            onClick={() => handleWeightChange(-2.5)}
            className="btn-ghost"
            style={{ padding: '2px 4px', fontSize: '0.72rem', height: 26 }}
          >
            -
          </button>
          <input
            type="number"
            step="0.5"
            min="0"
            value={set.weight || ''}
            placeholder="0"
            onChange={(e) => onUpdate({ ...set, weight: parseFloat(e.target.value) || 0 })}
            style={{
              padding: '4px 6px',
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="button"
            onClick={() => handleWeightChange(2.5)}
            className="btn-ghost"
            style={{ padding: '2px 4px', fontSize: '0.72rem', height: 26 }}
          >
            +
          </button>
        </div>
        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {previousLogSet ? `Prec: ${previousLogSet.weight}kg` : 'kg'}
        </span>
      </div>

      {/* Reps Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            type="button"
            onClick={() => handleRepsChange(-1)}
            className="btn-ghost"
            style={{ padding: '2px 4px', fontSize: '0.72rem', height: 26 }}
          >
            -
          </button>
          <input
            type="number"
            min="0"
            value={set.reps || ''}
            placeholder="0"
            onChange={(e) => onUpdate({ ...set, reps: parseInt(e.target.value) || 0 })}
            style={{
              padding: '4px 6px',
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
            }}
          />
          <button
            type="button"
            onClick={() => handleRepsChange(1)}
            className="btn-ghost"
            style={{ padding: '2px 4px', fontSize: '0.72rem', height: 26 }}
          >
            +
          </button>
        </div>
        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          {previousLogSet ? `Prec: ${previousLogSet.reps} rip` : 'ripetizioni'}
        </span>
      </div>

      {/* Complete Checkbox */}
      <button
        type="button"
        onClick={onToggleComplete}
        style={{
          width: 42,
          height: 34,
          borderRadius: 'var(--radius-sm)',
          background: set.completed ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
          color: set.completed ? '#000' : 'var(--text-muted)',
          border: `1px solid ${set.completed ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: set.completed ? '0 0 12px rgba(16, 185, 129, 0.4)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <Check size={20} strokeWidth={3} />
      </button>

      {/* Delete Set */}
      <button
        type="button"
        onClick={onDelete}
        className="btn-ghost"
        style={{ color: 'var(--text-muted)', padding: 4 }}
        title="Rimuovi serie"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
};
