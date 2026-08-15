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
} from 'lucide-react';
import type { Routine, RoutineDay } from '../../types/workout';
import { StorageService } from '../../services/storage';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Le Mie Schede ({routines.length})
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Gestisci i tuoi split di allenamento o genera una nuova programmazione scientifica con l&apos;AI
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onOpenAIGenerator} className="btn-ai" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
            <Sparkles size={16} /> Genera con AI Gemini
          </button>
          <button onClick={onCreateManualRoutine} className="btn-secondary" style={{ padding: '9px 16px', fontSize: '0.85rem' }}>
            <Plus size={16} /> Nuova Scheda Manuale
          </button>
        </div>
      </div>

      {/* Routine Cards Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {routines.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <CalendarDays size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>Nessuna scheda presente</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              Crea la tua prima scheda personalizzata oppure usa l&apos;AI per generarla su misura in 5 secondi.
            </p>
            <button onClick={onOpenAIGenerator} className="btn-ai">
              <Sparkles size={18} /> Genera Scheda con Gemini AI
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
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  borderLeft: isActive ? '4px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                }}
              >
                {/* Header Card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <h2
                      onClick={() => setExpandedRoutineId(isExpanded ? null : routine.id)}
                      style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0, cursor: 'pointer' }}
                    >
                      {routine.title}
                    </h2>
                    {isActive && (
                      <span className="chip chip-green" style={{ fontSize: '0.72rem' }}>
                        <CheckCircle size={12} /> Scheda Attiva
                      </span>
                    )}
                    {routine.isAiGenerated && (
                      <span className="chip chip-purple" style={{ fontSize: '0.72rem' }}>
                        <Sparkles size={12} /> AI Gemini
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {!isActive && (
                      <button
                        onClick={() => onSelectActiveRoutine(routine.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        Imposta come Attiva
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDuplicate(routine, e)}
                      className="btn-ghost"
                      style={{ padding: 6 }}
                      title="Duplica scheda"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => onEditRoutine(routine)}
                      className="btn-ghost"
                      style={{ padding: 6 }}
                      title="Modifica scheda"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(routine.id, e)}
                      className="btn-ghost"
                      style={{ color: 'var(--accent-danger)', padding: 6 }}
                      title="Elimina scheda"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {routine.description && (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {routine.description}
                  </p>
                )}

                {/* Days Breakdown Accordion */}
                {isExpanded && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Sessioni ({routine.days.length} Giorni):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
                      {routine.days.map((day) => (
                        <div
                          key={day.id}
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '12px 14px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6 }}>
                              {day.name}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {day.exercises.map((ex, eIdx) => (
                                <div
                                  key={ex.id}
                                  style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <span>{eIdx + 1}. {ex.name}</span>
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                                    {ex.targetSets}×{ex.targetRepsMin}-{ex.targetRepsMax}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => onStartWorkout(routine, day)}
                            className="btn-primary"
                            style={{ width: '100%', padding: '8px 12px', fontSize: '0.84rem' }}
                          >
                            <Play size={16} /> Esegui questo Giorno
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
