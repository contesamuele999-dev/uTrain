import React, { useState } from 'react';
import {
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import type { Routine, RoutineDay, RoutineExercise, Exercise } from '../../types/workout';
import { StorageService } from '../../services/storage';

interface RoutineEditorProps {
  initialRoutine?: Routine;
  onSave: (routine: Routine) => void;
  onCancel: () => void;
}

export const RoutineEditor: React.FC<RoutineEditorProps> = ({
  initialRoutine,
  onSave,
  onCancel,
}) => {
  const exercisesLibrary = StorageService.getExercises();

  const [title, setTitle] = useState<string>(initialRoutine?.title || 'Nuova Scheda');
  const [description, setDescription] = useState<string>(initialRoutine?.description || '');
  const [goal, setGoal] = useState<Routine['goal']>(initialRoutine?.goal || 'hypertrophy');
  const [level] = useState<Routine['level']>(initialRoutine?.level || 'intermediate');

  const [days, setDays] = useState<RoutineDay[]>(
    initialRoutine?.days || [
      {
        id: `day-1-${Date.now()}`,
        name: 'Giorno 1: Push (Spinta)',
        exercises: [],
      },
    ]
  );

  const [exerciseModalOpen, setExerciseModalOpen] = useState<{ dayIndex: number } | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');

  const addDay = () => {
    const newDayNum = days.length + 1;
    setDays([
      ...days,
      {
        id: `day-${newDayNum}-${Date.now()}`,
        name: `Giorno ${newDayNum}: Sessione ${String.fromCharCode(64 + newDayNum)}`,
        exercises: [],
      },
    ]);
  };

  const removeDay = (index: number) => {
    if (days.length <= 1) return;
    setDays(days.filter((_, i) => i !== index));
  };

  const updateDayName = (index: number, name: string) => {
    const updated = [...days];
    updated[index].name = name;
    setDays(updated);
  };

  const addExerciseToDay = (dayIndex: number, exercise: Exercise) => {
    const updated = [...days];
    const newRoutineEx: RoutineExercise = {
      id: `ex-item-${Date.now()}-${Math.random()}`,
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      targetRpe: 8,
      targetRestSeconds: 90,
    };
    updated[dayIndex].exercises.push(newRoutineEx);
    setDays(updated);
    setExerciseModalOpen(null);
  };

  const removeExerciseFromDay = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    updated[dayIndex].exercises.splice(exIndex, 1);
    setDays(updated);
  };

  const updateExerciseProperty = (
    dayIndex: number,
    exIndex: number,
    field: keyof RoutineExercise,
    value: number | string | undefined
  ) => {
    const updated = [...days];
    updated[dayIndex].exercises[exIndex] = {
      ...updated[dayIndex].exercises[exIndex],
      [field]: value,
    };
    setDays(updated);
  };

  const moveExercise = (dayIndex: number, exIndex: number, direction: 'up' | 'down') => {
    const updated = [...days];
    const exList = [...updated[dayIndex].exercises];
    const targetIdx = direction === 'up' ? exIndex - 1 : exIndex + 1;
    if (targetIdx < 0 || targetIdx >= exList.length) return;

    const temp = exList[exIndex];
    exList[exIndex] = exList[targetIdx];
    exList[targetIdx] = temp;
    updated[dayIndex].exercises = exList;
    setDays(updated);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const routine: Routine = {
      id: initialRoutine?.id || `routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      goal,
      level,
      days,
      createdAt: initialRoutine?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAiGenerated: initialRoutine?.isAiGenerated || false,
    };

    onSave(routine);
  };

  const filteredExercises = exercisesLibrary.filter((ex) =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
    ex.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="glass-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
            {initialRoutine ? 'Modifica Scheda' : 'Crea Nuova Scheda'}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
            Configura sessioni ed esercizi
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onCancel} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <X size={14} /> Annulla
          </button>
          <button onClick={handleSave} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <Save size={14} /> Salva
          </button>
        </div>
      </div>

      {/* Routine Metadata Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
            Titolo Scheda:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Push Pull Legs"
            style={{ fontSize: '0.86rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
            Descrizione:
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. Focus Ipertrofia"
            style={{ fontSize: '0.86rem' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
            Obiettivo:
          </label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as Routine['goal'])} style={{ fontSize: '0.86rem' }}>
            <option value="hypertrophy">Ipertrofia (Massa)</option>
            <option value="strength">Forza</option>
            <option value="fat_loss">Definizione</option>
            <option value="endurance">Resistenza</option>
            <option value="general_fitness">Fitness Generale</option>
          </select>
        </div>
      </div>

      {/* Days List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Giorni di Allenamento ({days.length})
          </h3>
          <button onClick={addDay} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.76rem' }}>
            <Plus size={13} /> Giorno
          </button>
        </div>

        {days.map((day, dIdx) => (
          <div
            key={day.id}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <input
                type="text"
                value={day.name}
                onChange={(e) => updateDayName(dIdx, e.target.value)}
                style={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: 'var(--accent-primary)',
                  background: 'transparent',
                  border: '1px solid transparent',
                  padding: '2px 4px',
                }}
              />
              {days.length > 1 && (
                <button
                  onClick={() => removeDay(dIdx)}
                  className="btn-ghost"
                  style={{ color: 'var(--accent-danger)', padding: 4 }}
                  title="Elimina giorno"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>

            {/* Exercises in Day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {day.exercises.length === 0 ? (
                <div style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.78rem',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  Nessun esercizio aggiunto.
                </div>
              ) : (
                day.exercises.map((ex, eIdx) => (
                  <div
                    key={ex.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                          <button
                            onClick={() => moveExercise(dIdx, eIdx, 'up')}
                            disabled={eIdx === 0}
                            style={{ background: 'none', border: 'none', color: eIdx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button
                            onClick={() => moveExercise(dIdx, eIdx, 'down')}
                            disabled={eIdx === day.exercises.length - 1}
                            style={{ background: 'none', border: 'none', color: eIdx === day.exercises.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>
                        <strong style={{ color: '#fff', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {eIdx + 1}. {ex.name}
                        </strong>
                      </div>

                      <button
                        onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                        className="btn-ghost"
                        style={{ color: 'var(--accent-danger)', padding: 2 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Exercise targets inputs - 4 compact items */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 4,
                      alignItems: 'center',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Serie</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ex.targetSets}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetSets', parseInt(e.target.value) || 3)}
                          style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Reps Min</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={ex.targetRepsMin}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetRepsMin', parseInt(e.target.value) || 8)}
                          style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Reps Max</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={ex.targetRepsMax}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetRepsMax', parseInt(e.target.value) || 10)}
                          style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Recup (s)</span>
                        <input
                          type="number"
                          step="15"
                          min="0"
                          max="300"
                          value={ex.targetRestSeconds}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetRestSeconds', parseInt(e.target.value) || 90)}
                          style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Exercise Button */}
            <button
              type="button"
              onClick={() => {
                setExerciseSearch('');
                setExerciseModalOpen({ dayIndex: dIdx });
              }}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
            >
              <Plus size={14} /> Aggiungi Esercizio
            </button>
          </div>
        ))}
      </div>

      {/* Exercise Picker Modal */}
      {exerciseModalOpen !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
        }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 480,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={17} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Seleziona Esercizio
                </h3>
              </div>
              <button onClick={() => setExerciseModalOpen(null)} className="btn-ghost" style={{ padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
              <input
                type="text"
                placeholder="Cerca esercizio..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                autoFocus
                style={{ fontSize: '0.85rem', padding: '6px 10px' }}
              />
            </div>

            <div style={{ padding: '8px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToDay(exerciseModalOpen.dayIndex, ex)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      {ex.muscleGroup.toUpperCase()} • {ex.equipment}
                    </div>
                  </div>
                  <Plus size={14} color="var(--accent-primary)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
