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
    const currentWeight = Number(set.weight) || 0;
    const nextWeight = Math.max(0, Math.round((currentWeight + delta) * 100) / 100);
    onUpdate({ ...set, weight: nextWeight });
  };

  const handleRepsChange = (delta: number) => {
    const currentReps = Number(set.reps) || 0;
    const nextReps = Math.max(0, currentReps + delta);
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
        gridTemplateColumns: '26px 1fr 1fr 34px 22px',
        alignItems: 'center',
        gap: 4,
        padding: '6px',
        background: set.completed ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-input)',
        border: `1px solid ${set.completed ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-subtle)'}`,
        borderRadius: 'var(--radius-sm)',
        transition: 'all 0.15s ease',
        width: '100%',
        minWidth: 0,
      }}
    >
      {/* Set Number / Type Button */}
      <button
        type="button"
        onClick={cycleSetType}
        title="Tipo serie (1/W/D/F)"
        style={{
          width: 26,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          background: typeInfo.bg,
          color: typeInfo.color,
          border: '1px solid var(--border-subtle)',
          fontWeight: 800,
          fontSize: '0.74rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          padding: 0,
        }}
      >
        {typeInfo.label}
      </button>

      {/* Weight Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={() => handleWeightChange(-2.5)}
            className="btn-ghost"
            style={{ padding: 0, width: 20, height: 26, fontSize: '0.72rem', flexShrink: 0 }}
          >
            -
          </button>
          <input
            type="number"
            step="0.5"
            min="0"
            value={set.weight !== undefined && set.weight !== null ? set.weight : ''}
            placeholder="0"
            onChange={(e) => {
              const val = e.target.value;
              onUpdate({
                ...set,
                weight: val === '' ? ('' as unknown as number) : (parseFloat(val) || 0),
              });
            }}
            onBlur={() => {
              if (typeof set.weight === 'string' || Number.isNaN(set.weight)) {
                onUpdate({ ...set, weight: parseFloat(String(set.weight)) || 0 });
              }
            }}
            style={{
              padding: '2px 4px',
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.86rem',
              minWidth: 0,
              width: '100%',
            }}
          />
          <button
            type="button"
            onClick={() => handleWeightChange(2.5)}
            className="btn-ghost"
            style={{ padding: 0, width: 20, height: 26, fontSize: '0.72rem', flexShrink: 0 }}
          >
            +
          </button>
        </div>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {previousLogSet ? `${previousLogSet.weight}k` : 'kg'}
        </span>
      </div>

      {/* Reps Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <button
            type="button"
            onClick={() => handleRepsChange(-1)}
            className="btn-ghost"
            style={{ padding: 0, width: 20, height: 26, fontSize: '0.72rem', flexShrink: 0 }}
          >
            -
          </button>
          <input
            type="number"
            min="0"
            value={set.reps !== undefined && set.reps !== null ? set.reps : ''}
            placeholder="0"
            onChange={(e) => {
              const val = e.target.value;
              onUpdate({
                ...set,
                reps: val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0),
              });
            }}
            onBlur={() => {
              if (typeof set.reps === 'string' || Number.isNaN(set.reps)) {
                onUpdate({ ...set, reps: parseInt(String(set.reps), 10) || 0 });
              }
            }}
            style={{
              padding: '2px 4px',
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.86rem',
              minWidth: 0,
              width: '100%',
            }}
          />
          <button
            type="button"
            onClick={() => handleRepsChange(1)}
            className="btn-ghost"
            style={{ padding: 0, width: 20, height: 26, fontSize: '0.72rem', flexShrink: 0 }}
          >
            +
          </button>
        </div>
        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {previousLogSet ? `${previousLogSet.reps}r` : 'reps'}
        </span>
      </div>

      {/* Complete Checkbox */}
      <button
        type="button"
        onClick={onToggleComplete}
        style={{
          width: 34,
          height: 28,
          borderRadius: 'var(--radius-sm)',
          background: set.completed ? 'var(--accent-primary)' : 'var(--bg-card-hover)',
          color: set.completed ? '#000' : 'var(--text-muted)',
          border: `1px solid ${set.completed ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: set.completed ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
          transition: 'all 0.15s ease',
          padding: 0,
        }}
      >
        <Check size={16} strokeWidth={3} />
      </button>

      {/* Delete Set */}
      <button
        type="button"
        onClick={onDelete}
        className="btn-ghost"
        style={{ color: 'var(--text-muted)', padding: 0, width: 22, height: 28 }}
        title="Rimuovi serie"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
