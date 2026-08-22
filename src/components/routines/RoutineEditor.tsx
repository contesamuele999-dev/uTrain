import React, { useState } from 'react';
import {
  Save,
  X,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ArrowLeft,
  Dumbbell,
  Timer,
  Layers,
  CalendarDays,
} from 'lucide-react';
import type { Routine, RoutineDay, RoutineExercise, Exercise, MuscleGroup, EquipmentType } from '../../types/workout';
import { StorageService } from '../../services/storage';
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from '../../utils/calculations';

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
  const [exercisesLibrary, setExercisesLibrary] = useState<Exercise[]>(() => StorageService.getExercises());

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

  // Creazione esercizio al volo
  const [isCreatingExercise, setIsCreatingExercise] = useState<boolean>(false);
  const [newExName, setNewExName] = useState<string>('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('chest');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('barbell');
  const [newExInstructions, setNewExInstructions] = useState<string>('');

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

  const addPauseToDay = (dayIndex: number) => {
    const updated = [...days];
    const newPauseItem: RoutineExercise = {
      id: `pause-${Date.now()}-${Math.random()}`,
      exerciseId: `pause-${Date.now()}`,
      name: 'Pausa & Recupero',
      muscleGroup: 'other',
      targetSets: 1,
      targetRepsMin: 0,
      targetRepsMax: 0,
      isRestPause: true,
      restDurationSeconds: 120,
      notes: '',
    };
    updated[dayIndex].exercises.push(newPauseItem);
    setDays(updated);
  };

  const addGroupToDay = (dayIndex: number) => {
    const updated = [...days];
    const newGroupItem: RoutineExercise = {
      id: `group-${Date.now()}-${Math.random()}`,
      exerciseId: `group-${Date.now()}`,
      name: 'Superset / Gruppo 1',
      muscleGroup: 'other',
      targetSets: 1,
      targetRepsMin: 0,
      targetRepsMax: 0,
      isGroupHeader: true,
      groupType: 'superset',
      notes: '',
    };
    updated[dayIndex].exercises.push(newGroupItem);
    setDays(updated);
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

    const sanitizedDays = days.map((day) => ({
      ...day,
      name: day.name.trim() || 'Giorno di Allenamento',
      exercises: day.exercises.map((ex) => {
        if (ex.isRestPause) {
          return {
            ...ex,
            name: ex.name.trim() || 'Pausa & Recupero',
            restDurationSeconds: Number(ex.restDurationSeconds) || 120,
          };
        }
        if (ex.isGroupHeader) {
          return {
            ...ex,
            name: ex.name.trim() || 'Gruppo / Superset',
          };
        }
        return {
          ...ex,
          targetSets: Number(ex.targetSets) || 3,
          targetRepsMin: Number(ex.targetRepsMin) || 8,
          targetRepsMax: Number(ex.targetRepsMax) || 10,
          targetRestSeconds: Number(ex.targetRestSeconds) || 90,
        };
      }),
    }));

    const routine: Routine = {
      id: initialRoutine?.id || `routine-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      goal,
      level,
      days: sanitizedDays,
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

  const startCreatingExercise = (prefillName?: string) => {
    setNewExName(prefillName ?? exerciseSearch ?? '');
    setNewExMuscle('chest');
    setNewExEquipment('barbell');
    setNewExInstructions('');
    setIsCreatingExercise(true);
  };

  const handleCreateAndAddExercise = (dayIndex: number, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newExName.trim();
    if (!cleanName) return;

    const created = StorageService.addCustomExercise({
      name: cleanName,
      muscleGroup: newExMuscle,
      equipment: newExEquipment,
      instructions: newExInstructions.trim() || undefined,
    });

    // Aggiorna la libreria locale in modo che sia subito disponibile
    setExercisesLibrary(StorageService.getExercises());

    // Aggiunge l'esercizio al giorno corrente
    addExerciseToDay(dayIndex, created);

    // Reset e chiusura
    setNewExName('');
    setNewExInstructions('');
    setIsCreatingExercise(false);
  };

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
            {/* Day Header with clear Renaming input and quick presets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                  <CalendarDays size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    Nome Giorno:
                  </span>
                  <input
                    type="text"
                    value={day.name}
                    onChange={(e) => updateDayName(dIdx, e.target.value)}
                    placeholder={`Es. Giorno ${dIdx + 1}: Push / Spinta`}
                    style={{
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      color: 'var(--accent-primary)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 8px',
                      flex: 1,
                    }}
                  />
                </div>

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

              {/* Quick Day Name Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Rinomina rapida:</span>
                {['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body', 'Braccia & Spalle', 'Cardio & Core'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => updateDayName(dIdx, `Giorno ${dIdx + 1}: ${preset}`)}
                    style={{
                      fontSize: '0.66rem',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercises, Groups & Pauses in Day */}
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
                  Nessun esercizio o gruppo aggiunto.
                </div>
              ) : (
                day.exercises.map((ex, eIdx) => {
                  if (ex.isGroupHeader) {
                    return (
                      <div
                        key={ex.id}
                        style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(99, 102, 241, 0.06) 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.45)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
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

                            <span style={{
                              background: 'rgba(139, 92, 246, 0.25)',
                              color: '#c4b5fd',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              flexShrink: 0,
                            }}>
                              <Layers size={12} /> GRUPPO
                            </span>

                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'name', e.target.value)}
                              placeholder="Nome Gruppo (es. Superset 1: Bicipiti + Tricipiti)"
                              style={{
                                fontSize: '0.84rem',
                                fontWeight: 700,
                                color: '#c4b5fd',
                                background: 'transparent',
                                border: '1px solid transparent',
                                padding: '2px 4px',
                                flex: 1,
                              }}
                            />
                          </div>

                          <button
                            onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                            className="btn-ghost"
                            style={{ color: 'var(--accent-danger)', padding: 2 }}
                            title="Elimina intestazione gruppo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Group Settings: Type & Notes */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6 }}>
                          <div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Tipo Gruppo:
                            </span>
                            <select
                              value={ex.groupType || 'superset'}
                              onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'groupType', e.target.value)}
                              style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                            >
                              <option value="superset">⚡ Superset (2 esercizi consecutivi)</option>
                              <option value="circuit">🔄 Circuito (3+ esercizi a round)</option>
                              <option value="standard">📁 Sezione / Blocco Esercizi</option>
                              <option value="warmup">🔥 Riscaldamento / Warm-up</option>
                              <option value="finisher">🏁 Finisher / Burnout Finale</option>
                            </select>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Note / Istruzioni Gruppo (Opzionale):
                            </span>
                            <input
                              type="text"
                              value={ex.notes || ''}
                              onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'notes', e.target.value)}
                              placeholder="Es. Nessuna pausa tra le stazioni, 2 min a fine giro..."
                              style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (ex.isRestPause) {
                    return (
                      <div
                        key={ex.id}
                        style={{
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(217, 119, 6, 0.04) 100%)',
                          border: '1px solid rgba(245, 158, 11, 0.35)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
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

                            <span style={{
                              background: 'rgba(245, 158, 11, 0.25)',
                              color: '#fbbf24',
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '2px 6px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              flexShrink: 0,
                            }}>
                              <Timer size={12} /> PAUSA
                            </span>

                            <input
                              type="text"
                              value={ex.name}
                              onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'name', e.target.value)}
                              placeholder="Nome blocco pausa (es. Pausa / Transizione)"
                              style={{
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                color: '#fbbf24',
                                background: 'transparent',
                                border: '1px solid transparent',
                                padding: '2px 4px',
                                flex: 1,
                              }}
                            />
                          </div>

                          <button
                            onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                            className="btn-ghost"
                            style={{ color: 'var(--accent-danger)', padding: 2 }}
                            title="Elimina blocco pausa"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Pause settings: Duration & Notes */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 6 }}>
                          <div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Durata Pausa:
                            </span>
                            <select
                              value={ex.restDurationSeconds || 120}
                              onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'restDurationSeconds', parseInt(e.target.value) || 120)}
                              style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                            >
                              <option value="30">30 secondi</option>
                              <option value="45">45 secondi</option>
                              <option value="60">1 minuto (60s)</option>
                              <option value="90">1.5 minuti (90s)</option>
                              <option value="120">2 minuti (120s)</option>
                              <option value="150">2.5 minuti (150s)</option>
                              <option value="180">3 minuti (180s)</option>
                              <option value="240">4 minuti (240s)</option>
                              <option value="300">5 minuti (300s)</option>
                              <option value="420">7 minuti (420s)</option>
                              <option value="600">10 minuti (600s)</option>
                            </select>
                          </div>

                          <div>
                            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                              Note / Istruzioni (Opzionale):
                            </span>
                            <input
                              type="text"
                              value={ex.notes || ''}
                              onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'notes', e.target.value)}
                              placeholder="Es. Idratazione, preparazione carico..."
                              style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
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
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <strong style={{ color: '#fff', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {eIdx + 1}. {ex.name}
                            </strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="text"
                            value={ex.groupName || ''}
                            onChange={(e) => updateExerciseProperty(dIdx, eIdx, 'groupName', e.target.value)}
                            placeholder="Tag Gruppo (opzionale)"
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              color: '#c4b5fd',
                              background: 'rgba(139, 92, 246, 0.08)',
                              border: '1px dashed rgba(139, 92, 246, 0.3)',
                              borderRadius: 3,
                              width: 120,
                            }}
                          />
                          <button
                            onClick={() => removeExerciseFromDay(dIdx, eIdx)}
                            className="btn-ghost"
                            style={{ color: 'var(--accent-danger)', padding: 2 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Exercise targets inputs */}
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
                            max="20"
                            value={ex.targetSets !== undefined && ex.targetSets !== null ? ex.targetSets : ''}
                            placeholder="3"
                            onChange={(e) => {
                              const val = e.target.value;
                              updateExerciseProperty(dIdx, eIdx, 'targetSets', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                            }}
                            style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Reps Min</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={ex.targetRepsMin !== undefined && ex.targetRepsMin !== null ? ex.targetRepsMin : ''}
                            placeholder="8"
                            onChange={(e) => {
                              const val = e.target.value;
                              updateExerciseProperty(dIdx, eIdx, 'targetRepsMin', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                            }}
                            style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Reps Max</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={ex.targetRepsMax !== undefined && ex.targetRepsMax !== null ? ex.targetRepsMax : ''}
                            placeholder="10"
                            onChange={(e) => {
                              const val = e.target.value;
                              updateExerciseProperty(dIdx, eIdx, 'targetRepsMax', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                            }}
                            style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                          />
                        </div>

                        <div>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Recup (s)</span>
                          <input
                            type="number"
                            step="15"
                            min="0"
                            max="600"
                            value={ex.targetRestSeconds !== undefined && ex.targetRestSeconds !== null ? ex.targetRestSeconds : ''}
                            placeholder="90"
                            onChange={(e) => {
                              const val = e.target.value;
                              updateExerciseProperty(dIdx, eIdx, 'targetRestSeconds', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                            }}
                            style={{ padding: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action Buttons: Add Exercise, Add Group & Add Pause Divider */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setExerciseSearch('');
                  setIsCreatingExercise(false);
                  setExerciseModalOpen({ dayIndex: dIdx });
                }}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              >
                <Plus size={14} /> Aggiungi Esercizio
              </button>

              <button
                type="button"
                onClick={() => addGroupToDay(dIdx)}
                style={{
                  background: 'rgba(139, 92, 246, 0.12)',
                  border: '1px solid rgba(139, 92, 246, 0.4)',
                  color: '#c4b5fd',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 600,
                }}
              >
                <Layers size={14} /> Aggiungi Gruppo / Superset
              </button>

              <button
                type="button"
                onClick={() => addPauseToDay(dIdx)}
                style={{
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  padding: '6px 10px',
                  fontSize: '0.78rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontWeight: 600,
                }}
              >
                <Timer size={14} /> Aggiungi Pausa / Divider
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Exercise Picker / Creator Modal */}
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
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isCreatingExercise ? (
                  <button
                    type="button"
                    onClick={() => setIsCreatingExercise(false)}
                    className="btn-ghost"
                    style={{ padding: 4 }}
                    title="Torna alla ricerca"
                  >
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <BookOpen size={17} color="var(--accent-primary)" />
                )}
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  {isCreatingExercise ? 'Crea Nuovo Esercizio' : 'Seleziona Esercizio'}
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!isCreatingExercise && (
                  <button
                    type="button"
                    onClick={() => startCreatingExercise()}
                    className="btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  >
                    <Plus size={13} /> Crea Nuovo
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setExerciseModalOpen(null);
                    setIsCreatingExercise(false);
                  }}
                  className="btn-ghost"
                  style={{ padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal Body: Create Form or Picker List */}
            {isCreatingExercise ? (
              <form
                onSubmit={(e) => handleCreateAndAddExercise(exerciseModalOpen.dayIndex, e)}
                style={{ padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' }}>
                    Nome Esercizio *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Spinte con manubri su panca 30°"
                    value={newExName}
                    onChange={(e) => setNewExName(e.target.value)}
                    autoFocus
                    style={{ fontSize: '0.86rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' }}>
                      Gruppo Muscolare *
                    </label>
                    <select
                      value={newExMuscle}
                      onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                      style={{ fontSize: '0.84rem' }}
                    >
                      {Object.entries(MUSCLE_GROUP_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' }}>
                      Attrezzatura *
                    </label>
                    <select
                      value={newExEquipment}
                      onChange={(e) => setNewExEquipment(e.target.value as EquipmentType)}
                      style={{ fontSize: '0.84rem' }}
                    >
                      {Object.entries(EQUIPMENT_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 3, display: 'block' }}>
                    Istruzioni / Note Biomeccaniche (Opzionale)
                  </label>
                  <textarea
                    placeholder="Es. Mantieni i gomiti a 45 gradi, arco lombare fisiologico..."
                    value={newExInstructions}
                    onChange={(e) => setNewExInstructions(e.target.value)}
                    rows={2}
                    style={{ fontSize: '0.82rem', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setIsCreatingExercise(false)}
                    className="btn-secondary"
                    style={{ padding: '7px 12px', fontSize: '0.8rem' }}
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ padding: '7px 14px', fontSize: '0.8rem' }}
                  >
                    <Plus size={14} /> Crea e Aggiungi alla Scheda
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <input
                    type="text"
                    placeholder="Cerca esercizio per nome o muscolo..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    autoFocus
                    style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                  />
                </div>

                <div style={{ padding: '8px 12px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {filteredExercises.length === 0 ? (
                    <div style={{
                      padding: '24px 16px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      <Dumbbell size={28} color="var(--text-muted)" />
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                        Nessun esercizio trovato per &ldquo;<strong>{exerciseSearch}</strong>&rdquo;.
                      </div>
                      <button
                        type="button"
                        onClick={() => startCreatingExercise(exerciseSearch)}
                        className="btn-primary"
                        style={{ padding: '7px 14px', fontSize: '0.8rem', marginTop: 4 }}
                      >
                        <Plus size={14} /> Crea &ldquo;{exerciseSearch || 'Nuovo Esercizio'}&rdquo;
                      </button>
                    </div>
                  ) : (
                    filteredExercises.map((ex) => (
                      <button
                        key={ex.id}
                        type="button"
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
                            {MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup} • {EQUIPMENT_LABELS[ex.equipment] || ex.equipment}
                          </div>
                        </div>
                        <Plus size={14} color="var(--accent-primary)" />
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
