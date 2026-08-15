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
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: '#fff' }}>
            {initialRoutine ? 'Modifica Scheda' : 'Crea Nuova Scheda'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Configura i giorni di allenamento, gli esercizi target e i recuperi
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} className="btn-secondary">
            <X size={18} /> Annulla
          </button>
          <button onClick={handleSave} className="btn-primary">
            <Save size={18} /> Salva Scheda
          </button>
        </div>
      </div>

      {/* Routine Metadata Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            Titolo Scheda:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Push Pull Legs - Focus Ipertrofia"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            Descrizione breve:
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Es. Split su 4 giorni per aumento massa muscolare"
          />
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
            Obiettivo:
          </label>
          <select value={goal} onChange={(e) => setGoal(e.target.value as Routine['goal'])}>
            <option value="hypertrophy">Ipertrofia (Massa)</option>
            <option value="strength">Forza</option>
            <option value="fat_loss">Definizione</option>
            <option value="endurance">Resistenza</option>
            <option value="general_fitness">Fitness Generale</option>
          </select>
        </div>
      </div>

      {/* Days List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Giorni di Allenamento ({days.length})
          </h3>
          <button onClick={addDay} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
            <Plus size={16} /> Aggiungi Giorno
          </button>
        </div>

        {days.map((day, dIdx) => (
          <div
            key={day.id}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <input
                type="text"
                value={day.name}
                onChange={(e) => updateDayName(dIdx, e.target.value)}
                style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: 'var(--accent-primary)',
                  background: 'transparent',
                  border: '1px solid transparent',
                  padding: '4px 8px',
                }}
              />
              {days.length > 1 && (
                <button
                  onClick={() => removeDay(dIdx)}
                  className="btn-ghost"
                  style={{ color: 'var(--accent-danger)', padding: 6 }}
                  title="Elimina giorno"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Exercises in Day */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {day.exercises.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}>
                  Nessun esercizio aggiunto a questa sessione.
                </div>
              ) : (
                day.exercises.map((ex, eIdx) => (
                  <div
                    key={ex.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <button
                            onClick={() => moveExercise(dIdx, eIdx, 'up')}
                            disabled={eIdx === 0}
                            style={{ background: 'none', border: 'none', color: eIdx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveExercise(dIdx, eIdx, 'down')}
                            disabled={eIdx === day.exercises.length - 1}
                            style={{ background: 'none', border: 'none', color: eIdx === day.exercises.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                        <strong style={{ color: '#fff', fontSize: '0.92rem' }}>
                          {eIdx + 1}. {ex.name}
                        </strong>
                      </div>

                      <button
                        onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                        className="btn-ghost"
                        style={{ color: 'var(--accent-danger)', padding: 4 }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Exercise targets inputs */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
                      gap: 8,
                      alignItems: 'center',
                    }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Serie:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={ex.targetSets}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetSets', parseInt(e.target.value) || 3)}
                          style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rip Min:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={ex.targetRepsMin}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetRepsMin', parseInt(e.target.value) || 8)}
                          style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rip Max:</span>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={ex.targetRepsMax}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetRepsMax', parseInt(e.target.value) || 10)}
                          style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                        />
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Recupero (s):</span>
                        <input
                          type="number"
                          step="15"
                          min="0"
                          max="300"
                          value={ex.targetRestSeconds}
                          onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'targetRestSeconds', parseInt(e.target.value) || 90)}
                          style={{ padding: '6px 8px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
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
              style={{ padding: '8px 12px', fontSize: '0.84rem', marginTop: 4 }}
            >
              <Plus size={16} /> Aggiungi Esercizio dalla Libreria
            </button>
          </div>
        ))}
      </div>

      {/* Exercise Picker Modal */}
      {exerciseModalOpen !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 540,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={20} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Seleziona Esercizio
                </h3>
              </div>
              <button onClick={() => setExerciseModalOpen(null)} className="btn-ghost" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
              <input
                type="text"
                placeholder="Cerca esercizio per nome o muscolo (es. Panca, Squat, Petto)..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ padding: '10px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => addExerciseToDay(exerciseModalOpen.dayIndex, ex)}
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{ex.name}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {ex.muscleGroup.toUpperCase()} • {ex.equipment}
                    </div>
                  </div>
                  <Plus size={16} color="var(--accent-primary)" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
