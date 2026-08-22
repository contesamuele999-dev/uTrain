import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Sparkles,
  Play,
  Edit2,
  Trash2,
  CheckCircle,
  Copy,
  Timer,
  Layers,
} from 'lucide-react';
import type { Routine, RoutineDay } from '../../types/workout';
import { StorageService } from '../../services/storage';
import { countActualExercises } from '../../utils/calculations';

interface RoutineListProps {
  routines: Routine[];
  activeRoutineId?: string;
  onSelectActiveRoutine: (routineId: string) => void;
  onStartWorkout: (routine: Routine, day: RoutineDay) => void;
  onEditRoutine: (routine: Routine) => void;
  onOpenAIGenerator: () => void;
  onCreateManualRoutine: () => void;
}

export const RoutineList: React.FC<RoutineListProps> = ({
  routines,
  activeRoutineId,
  onSelectActiveRoutine,
  onStartWorkout,
  onEditRoutine,
  onOpenAIGenerator,
  onCreateManualRoutine,
}) => {
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(
    activeRoutineId || (routines.length > 0 ? routines[0].id : null)
  );

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questa scheda di allenamento?')) {
      StorageService.deleteRoutine(id);
    }
  };

  const handleDuplicate = (routine: Routine, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: Routine = {
      ...routine,
      id: `routine-${Date.now()}`,
      title: `${routine.title} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveRoutine(duplicated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Le Mie Schede ({routines.length})
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Gestisci i tuoi split o creane uno su misura con l&apos;AI
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={onOpenAIGenerator} className="btn-ai" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <Sparkles size={14} /> Genera AI
          </button>
          <button onClick={onCreateManualRoutine} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <Plus size={14} /> Nuova Scheda
          </button>
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {routines.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px 16px', textAlign: 'center' }}>
            <CalendarDays size={36} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Nessuna scheda presente</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Crea la tua prima scheda personalizzata oppure usa l&apos;AI in 5 secondi.
            </p>
            <button onClick={onOpenAIGenerator} className="btn-ai" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              <Sparkles size={15} /> Genera con Gemini AI
            </button>
          </div>
        ) : (
          routines.map((routine) => {
            const isActive = routine.id === activeRoutineId;
            const isExpanded = expandedRoutineId === routine.id;

            return (
              <div
                key={routine.id}
                className={`glass-card ${isActive ? 'glow-card' : ''}`}
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  borderLeft: isActive ? '3px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h2
                        onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                        style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, cursor: 'pointer' }}
                      >
                        {routine.title}
                      </h2>
                      {isActive && (
                        <span className="chip chip-green" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          <CheckCircle size={10} /> Attiva
                        </span>
                      )}
                      {routine.isAiGenerated && (
                        <span className="chip chip-purple" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                          <Sparkles size={10} /> AI
                        </span>
                      )}
                    </div>

                    {routine.description && (
                      <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                        {routine.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    {!isActive && (
                      <button
                        onClick={() => onSelectActiveRoutine(routine.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        Attiva
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDuplicate(routine, e)}
                      className="btn-ghost"
                      style={{ padding: '4px 6px' }}
                      title="Duplica scheda"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => onEditRoutine(routine)}
                      className="btn-ghost"
                      style={{ padding: '4px 6px' }}
                      title="Modifica scheda"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(routine.id, e)}
                      className="btn-ghost"
                      style={{ color: 'var(--accent-danger)', padding: '4px 6px' }}
                      title="Elimina scheda"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Days Breakdown Accordion */}
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Sessioni ({routine.days.length} Giorni):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
                      {routine.days.map((day) => (
                        <div
                          key={day.id}
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 8,
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                                {day.name}
                              </div>
                              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', padding: '1px 6px', borderRadius: 4 }}>
                                {countActualExercises(day.exercises)} {countActualExercises(day.exercises) === 1 ? 'es.' : 'es.'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {(() => {
                                let actualCounter = 0;
                                return day.exercises.map((ex) => {
                                  if (ex.isGroupHeader) {
                                    const typeLabel = ex.groupType === 'superset' ? 'SUPERSET' : (ex.groupType === 'circuit' ? 'CIRCUITO' : (ex.groupType === 'warmup' ? 'WARM-UP' : (ex.groupType === 'finisher' ? 'FINISHER' : 'GRUPPO')));
                                    return (
                                      <div
                                        key={ex.id}
                                        style={{
                                          fontSize: '0.74rem',
                                          color: '#c4b5fd',
                                          background: 'rgba(139, 92, 246, 0.12)',
                                          border: '1px solid rgba(139, 92, 246, 0.35)',
                                          borderRadius: 4,
                                          padding: '3px 8px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: 6,
                                          margin: '4px 0 2px 0',
                                        }}
                                      >
                                        <span style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Layers size={11} /> {ex.name}
                                        </span>
                                        <span style={{ fontSize: '0.62rem', background: 'rgba(139, 92, 246, 0.25)', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>
                                          {typeLabel}
                                        </span>
                                      </div>
                                    );
                                  }

                                  if (ex.isRestPause) {
                                    const durationLabel = ex.restDurationSeconds
                                      ? (ex.restDurationSeconds >= 60 ? `${Math.round(ex.restDurationSeconds / 60 * 10) / 10} min` : `${ex.restDurationSeconds}s`)
                                      : '2 min';
                                    return (
                                      <div
                                        key={ex.id}
                                        style={{
                                          fontSize: '0.72rem',
                                          color: '#fbbf24',
                                          background: 'rgba(245, 158, 11, 0.1)',
                                          border: '1px dashed rgba(245, 158, 11, 0.3)',
                                          borderRadius: 4,
                                          padding: '2px 6px',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          gap: 6,
                                          margin: '2px 0',
                                        }}
                                      >
                                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          <Timer size={11} /> {ex.name} {ex.notes ? `(${ex.notes})` : ''}
                                        </span>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                          {durationLabel}
                                        </span>
                                      </div>
                                    );
                                  }

                                  actualCounter++;
                                  return (
                                    <div
                                      key={ex.id}
                                      style={{
                                        fontSize: '0.76rem',
                                        color: 'var(--text-primary)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 6,
                                        paddingLeft: ex.groupId || ex.groupName ? '8px' : '0px',
                                        borderLeft: ex.groupId || ex.groupName ? '2px solid rgba(139, 92, 246, 0.4)' : 'none',
                                      }}
                                    >
                                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {actualCounter}. {ex.name}
                                        {ex.groupName && (
                                          <span style={{ fontSize: '0.62rem', color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.15)', padding: '0 4px', borderRadius: 3 }}>
                                            {ex.groupName}
                                          </span>
                                        )}
                                      </span>
                                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>
                                        {ex.targetSets}×{ex.targetRepsMin}-{ex.targetRepsMax}
                                      </span>
                                    </div>
                                  );
                                });
                              })()}
                            </div>
                          </div>

                          <button
                            onClick={() => onStartWorkout(routine, day)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '7px 10px', fontSize: '0.78rem' }}
                          >
                            <Play size={14} /> Esegui questo Giorno
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
