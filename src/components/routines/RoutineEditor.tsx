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
  GripVertical,
  LogOut,
  FolderPlus,
  Check,
} from 'lucide-react';
import type { Routine, RoutineDay, RoutineExercise, Exercise, MuscleGroup, EquipmentType } from '../../types/workout';
import { StorageService } from '../../services/storage';
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  isActualExercise,
  countActualExercises,
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

  // Modals state
  const [exerciseModalOpen, setExerciseModalOpen] = useState<{ dayIndex: number; targetGroupId?: string } | null>(null);
  const [includeExistingModal, setIncludeExistingModal] = useState<{ dayIndex: number; groupHeaderId: string; groupName: string } | null>(null);
  const [assignToGroupModal, setAssignToGroupModal] = useState<{ dayIndex: number; exId: string } | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');

  // Creazione esercizio al volo
  const [isCreatingExercise, setIsCreatingExercise] = useState<boolean>(false);
  const [newExName, setNewExName] = useState<string>('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('chest');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('barbell');
  const [newExInstructions, setNewExInstructions] = useState<string>('');

  // Drag & Drop State
  const [draggedItem, setDraggedItem] = useState<{ dayIndex: number; exIndex: number; id: string } | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{ dayIndex: number; exIndex: number; position: 'before' | 'after' | 'inside-group'; targetGroupId?: string } | null>(null);

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

  const addExerciseToDay = (dayIndex: number, exercise: Exercise, targetGroupId?: string) => {
    const updated = [...days];
    const targetGroup = targetGroupId ? updated[dayIndex].exercises.find((e) => e.id === targetGroupId) : undefined;

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
      groupId: targetGroupId || undefined,
      groupName: targetGroup?.name || undefined,
    };

    if (targetGroupId) {
      // Trova l'ultimo elemento del gruppo per inserire dopo di esso
      let insertIdx = updated[dayIndex].exercises.findIndex((e) => e.id === targetGroupId);
      for (let i = insertIdx + 1; i < updated[dayIndex].exercises.length; i++) {
        if (updated[dayIndex].exercises[i].groupId === targetGroupId) {
          insertIdx = i;
        } else {
          break;
        }
      }
      updated[dayIndex].exercises.splice(insertIdx + 1, 0, newRoutineEx);
    } else {
      updated[dayIndex].exercises.push(newRoutineEx);
    }

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
    const existingGroupsCount = updated[dayIndex].exercises.filter((e) => e.isGroupHeader).length;
    const newGroupHeaderId = `group-${Date.now()}-${Math.random()}`;
    const newGroupItem: RoutineExercise = {
      id: newGroupHeaderId,
      exerciseId: `group-${Date.now()}`,
      name: `Superset ${existingGroupsCount + 1}`,
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
    const targetEx = updated[dayIndex].exercises[exIndex];

    if (targetEx.isGroupHeader) {
      // Se si elimina un'intestazione gruppo, scolleghiamo gli esercizi appartenenti al gruppo invece di cancellarli
      const groupHeaderId = targetEx.id;
      updated[dayIndex].exercises = updated[dayIndex].exercises
        .filter((_, i) => i !== exIndex)
        .map((ex) => (ex.groupId === groupHeaderId ? { ...ex, groupId: undefined, groupName: undefined } : ex));
    } else {
      updated[dayIndex].exercises.splice(exIndex, 1);
    }
    setDays(updated);
  };

  const updateExerciseProperty = (
    dayIndex: number,
    exIndex: number,
    field: keyof RoutineExercise,
    value: number | string | undefined
  ) => {
    const updated = [...days];
    const currentEx = updated[dayIndex].exercises[exIndex];
    updated[dayIndex].exercises[exIndex] = {
      ...currentEx,
      [field]: value,
    };

    // Se stiamo aggiornando il nome di un'intestazione gruppo, aggiorniamo anche groupName degli esercizi figli
    if (currentEx.isGroupHeader && field === 'name') {
      const groupHeaderId = currentEx.id;
      const newName = String(value || '');
      updated[dayIndex].exercises = updated[dayIndex].exercises.map((ex) =>
        ex.groupId === groupHeaderId ? { ...ex, groupName: newName } : ex
      );
    }

    setDays(updated);
  };

  // Aggiungi un esercizio esistente della giornata dentro a un gruppo
  const includeExistingExerciseInGroup = (dayIndex: number, groupHeaderId: string, exId: string) => {
    const updated = [...days];
    const exList = [...updated[dayIndex].exercises];
    const groupHeader = exList.find((e) => e.id === groupHeaderId);
    if (!groupHeader) return;

    const sourceIdx = exList.findIndex((e) => e.id === exId);
    if (sourceIdx === -1) return;

    const [exerciseToMove] = exList.splice(sourceIdx, 1);
    exerciseToMove.groupId = groupHeaderId;
    exerciseToMove.groupName = groupHeader.name;

    // Trova la posizione dopo l'ultimo elemento di questo gruppo
    let targetIdx = exList.findIndex((e) => e.id === groupHeaderId);
    for (let i = targetIdx + 1; i < exList.length; i++) {
      if (exList[i].groupId === groupHeaderId) {
        targetIdx = i;
      } else {
        break;
      }
    }
    exList.splice(targetIdx + 1, 0, exerciseToMove);
    updated[dayIndex].exercises = exList;
    setDays(updated);
    setIncludeExistingModal(null);
  };

  // Rimuovi un esercizio dal gruppo (rendendolo standalone)
  const extractExerciseFromGroup = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    const ex = updated[dayIndex].exercises[exIndex];
    if (!ex || !ex.groupId) return;

    updated[dayIndex].exercises[exIndex] = {
      ...ex,
      groupId: undefined,
      groupName: undefined,
    };
    setDays(updated);
  };

  // Assegna esercizio a gruppo esistente o crea nuovo gruppo con questo esercizio
  const assignExerciseToGroup = (dayIndex: number, exId: string, targetGroupHeaderId: string | 'new') => {
    const updated = [...days];
    const exList = [...updated[dayIndex].exercises];
    const exIdx = exList.findIndex((e) => e.id === exId);
    if (exIdx === -1) return;

    if (targetGroupHeaderId === 'new') {
      const newGroupId = `group-${Date.now()}-${Math.random()}`;
      const existingGroupsCount = exList.filter((e) => e.isGroupHeader).length;
      const groupHeader: RoutineExercise = {
        id: newGroupId,
        exerciseId: `group-${Date.now()}`,
        name: `Superset ${existingGroupsCount + 1}`,
        muscleGroup: 'other',
        targetSets: 1,
        targetRepsMin: 0,
        targetRepsMax: 0,
        isGroupHeader: true,
        groupType: 'superset',
        notes: '',
      };
      // Inserisci l'intestazione subito prima dell'esercizio e assegna il groupId
      exList[exIdx] = {
        ...exList[exIdx],
        groupId: newGroupId,
        groupName: groupHeader.name,
      };
      exList.splice(exIdx, 0, groupHeader);
    } else {
      const groupHeader = exList.find((e) => e.id === targetGroupHeaderId);
      if (!groupHeader) return;

      const [exerciseToMove] = exList.splice(exIdx, 1);
      exerciseToMove.groupId = targetGroupHeaderId;
      exerciseToMove.groupName = groupHeader.name;

      let targetIdx = exList.findIndex((e) => e.id === targetGroupHeaderId);
      for (let i = targetIdx + 1; i < exList.length; i++) {
        if (exList[i].groupId === targetGroupHeaderId) {
          targetIdx = i;
        } else {
          break;
        }
      }
      exList.splice(targetIdx + 1, 0, exerciseToMove);
    }

    updated[dayIndex].exercises = exList;
    setDays(updated);
    setAssignToGroupModal(null);
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

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, dayIndex: number, exIndex: number, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ dayIndex, exIndex, id });
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number, targetIndex: number, position: 'before' | 'after' | 'inside-group', targetGroupId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedItem || draggedItem.dayIndex !== dayIndex) return;

    if (
      dragOverTarget?.dayIndex !== dayIndex ||
      dragOverTarget?.exIndex !== targetIndex ||
      dragOverTarget?.position !== position ||
      dragOverTarget?.targetGroupId !== targetGroupId
    ) {
      setDragOverTarget({ dayIndex, exIndex: targetIndex, position, targetGroupId });
    }
  };

  const handleDrop = (e: React.DragEvent, dayIndex: number, targetIndex: number, targetGroupId?: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.dayIndex !== dayIndex) {
      setDraggedItem(null);
      setDragOverTarget(null);
      return;
    }

    const updated = [...days];
    const exList = [...updated[dayIndex].exercises];
    const fromIndex = draggedItem.exIndex;

    if (fromIndex === targetIndex && !targetGroupId) {
      setDraggedItem(null);
      setDragOverTarget(null);
      return;
    }

    const [movedItem] = exList.splice(fromIndex, 1);

    // Se spostato all'interno di un gruppo
    if (targetGroupId) {
      const groupHeader = exList.find((item) => item.id === targetGroupId);
      movedItem.groupId = targetGroupId;
      movedItem.groupName = groupHeader?.name;
    } else {
      // Se spostato all'esterno o rilasciato in posizione generica
      const targetItem = exList[targetIndex];
      if (targetItem && targetItem.groupId) {
        movedItem.groupId = targetItem.groupId;
        movedItem.groupName = targetItem.groupName;
      } else {
        movedItem.groupId = undefined;
        movedItem.groupName = undefined;
      }
    }

    let insertAt = targetIndex;
    if (fromIndex < targetIndex) {
      insertAt = Math.min(targetIndex, exList.length);
    }
    exList.splice(insertAt, 0, movedItem);

    updated[dayIndex].exercises = exList;
    setDays(updated);
    setDraggedItem(null);
    setDragOverTarget(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverTarget(null);
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
          groupId: ex.groupId || undefined,
          groupName: ex.groupName || undefined,
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

  const handleCreateAndAddExercise = (dayIndex: number, targetGroupId?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = newExName.trim();
    if (!cleanName) return;

    const created = StorageService.addCustomExercise({
      name: cleanName,
      muscleGroup: newExMuscle,
      equipment: newExEquipment,
      instructions: newExInstructions.trim() || undefined,
    });

    setExercisesLibrary(StorageService.getExercises());
    addExerciseToDay(dayIndex, created, targetGroupId);

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
            Configura sessioni, superset, pause ed esercizi
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onCancel} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <X size={14} /> Annulla
          </button>
          <button onClick={handleSave} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <Save size={14} /> Salva Scheda
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Giorni di Allenamento ({days.length})
          </h3>
          <button onClick={addDay} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.76rem' }}>
            <Plus size={13} /> Aggiungi Giorno
          </button>
        </div>

        {days.map((day, dIdx) => {
          const actualExCount = countActualExercises(day.exercises);
          const groupsCount = day.exercises.filter((e) => e.isGroupHeader).length;
          const pausesCount = day.exercises.filter((e) => e.isRestPause).length;

          // Organizzazione per renderizzare gruppi come riquadri compatti
          const processedBlocks: Array<
            | { type: 'group'; groupHeader: RoutineExercise; headerIndex: number; children: Array<{ ex: RoutineExercise; originalIndex: number }> }
            | { type: 'pause'; ex: RoutineExercise; originalIndex: number }
            | { type: 'standalone'; ex: RoutineExercise; originalIndex: number }
          > = [];

          let currentGroupBlock: {
            type: 'group';
            groupHeader: RoutineExercise;
            headerIndex: number;
            children: Array<{ ex: RoutineExercise; originalIndex: number }>;
          } | null = null;

          day.exercises.forEach((ex, idx) => {
            if (ex.isGroupHeader) {
              if (currentGroupBlock) {
                processedBlocks.push(currentGroupBlock);
              }
              currentGroupBlock = {
                type: 'group',
                groupHeader: ex,
                headerIndex: idx,
                children: [],
              };
            } else if (ex.isRestPause) {
              if (currentGroupBlock) {
                processedBlocks.push(currentGroupBlock);
                currentGroupBlock = null;
              }
              processedBlocks.push({ type: 'pause', ex, originalIndex: idx });
            } else if (ex.groupId && currentGroupBlock && ex.groupId === currentGroupBlock.groupHeader.id) {
              currentGroupBlock.children.push({ ex, originalIndex: idx });
            } else if (ex.groupId) {
              const existingBlock = processedBlocks.find(
                (b) => b.type === 'group' && b.groupHeader.id === ex.groupId
              );
              if (existingBlock && existingBlock.type === 'group') {
                existingBlock.children.push({ ex, originalIndex: idx });
              } else if (currentGroupBlock) {
                processedBlocks.push(currentGroupBlock);
                currentGroupBlock = null;
                processedBlocks.push({ type: 'standalone', ex, originalIndex: idx });
              } else {
                processedBlocks.push({ type: 'standalone', ex, originalIndex: idx });
              }
            } else {
              if (currentGroupBlock) {
                processedBlocks.push(currentGroupBlock);
                currentGroupBlock = null;
              }
              processedBlocks.push({ type: 'standalone', ex, originalIndex: idx });
            }
          });

          if (currentGroupBlock) {
            processedBlocks.push(currentGroupBlock);
          }

          let exerciseNumberCounter = 0;

          return (
            <div
              key={day.id}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px',
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

                  {/* Summary badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      padding: '2px 7px',
                      borderRadius: 4,
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                    }}>
                      {actualExCount} {actualExCount === 1 ? 'Esercizio' : 'Esercizi'}
                    </span>
                    {groupsCount > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'rgba(139, 92, 246, 0.15)',
                        color: '#c4b5fd',
                        padding: '2px 7px',
                        borderRadius: 4,
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                      }}>
                        {groupsCount} {groupsCount === 1 ? 'Gruppo' : 'Gruppi'}
                      </span>
                    )}
                    {pausesCount > 0 && (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#fbbf24',
                        padding: '2px 7px',
                        borderRadius: 4,
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                      }}>
                        {pausesCount} {pausesCount === 1 ? 'Pausa' : 'Pause'}
                      </span>
                    )}
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

              {/* Items in Day: Groups (with visual riquadro), Pauses, and Standalone Exercises */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {day.exercises.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                    border: '1px dashed var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    Nessun esercizio aggiunto. Usa i pulsanti sottostanti per iniziare.
                  </div>
                ) : (
                  processedBlocks.map((block) => {
                    // BLOCCO GRUPPO / SUPERSET (RIQUADRO EVIDENZIATO)
                    if (block.type === 'group') {
                      const groupHeader = block.groupHeader;
                      const headerIdx = block.headerIndex;
                      const isDraggingThis = draggedItem?.id === groupHeader.id;
                      const isDropTarget = dragOverTarget?.dayIndex === dIdx && dragOverTarget?.targetGroupId === groupHeader.id;

                      return (
                        <div
                          key={groupHeader.id}
                          onDragOver={(e) => handleDragOver(e, dIdx, headerIdx, 'inside-group', groupHeader.id)}
                          onDrop={(e) => handleDrop(e, dIdx, headerIdx, groupHeader.id)}
                          style={{
                            background: isDropTarget
                              ? 'rgba(139, 92, 246, 0.25)'
                              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(99, 102, 241, 0.05) 100%)',
                            border: isDropTarget
                              ? '2px dashed #a78bfa'
                              : '1.5px solid rgba(139, 92, 246, 0.45)',
                            borderRadius: 'var(--radius-md)',
                            padding: '10px 12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.08)',
                            opacity: isDraggingThis ? 0.45 : 1,
                            transition: 'background 0.2s, border 0.2s',
                          }}
                        >
                          {/* Testata Riquadro Gruppo */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid rgba(139, 92, 246, 0.25)', paddingBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                {/* Drag handle per l'intero gruppo */}
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, dIdx, headerIdx, groupHeader.id)}
                                  onDragEnd={handleDragEnd}
                                  style={{
                                    cursor: 'grab',
                                    color: '#c4b5fd',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '2px 4px',
                                    borderRadius: 3,
                                  }}
                                  title="Trascina per riordinare il gruppo"
                                >
                                  <GripVertical size={16} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                                  <button
                                    onClick={() => moveExercise(dIdx, headerIdx, 'up')}
                                    disabled={headerIdx === 0}
                                    style={{ background: 'none', border: 'none', color: headerIdx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                    title="Sposta su"
                                  >
                                    <ChevronUp size={13} />
                                  </button>
                                  <button
                                    onClick={() => moveExercise(dIdx, headerIdx, 'down')}
                                    disabled={headerIdx === day.exercises.length - 1}
                                    style={{ background: 'none', border: 'none', color: headerIdx === day.exercises.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                    title="Sposta giù"
                                  >
                                    <ChevronDown size={13} />
                                  </button>
                                </div>

                                <span style={{
                                  background: 'rgba(139, 92, 246, 0.3)',
                                  color: '#c4b5fd',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  padding: '3px 8px',
                                  borderRadius: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  flexShrink: 0,
                                }}>
                                  <Layers size={13} /> RIQUADRO GRUPPO
                                </span>

                                <input
                                  type="text"
                                  value={groupHeader.name}
                                  onChange={(e) => updateExerciseProperty(dIdx, headerIdx, 'name', e.target.value)}
                                  placeholder="Nome Gruppo (es. Superset: Petto + Dorso)"
                                  style={{
                                    fontSize: '0.86rem',
                                    fontWeight: 700,
                                    color: '#c4b5fd',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    borderRadius: 4,
                                    padding: '3px 6px',
                                    flex: 1,
                                  }}
                                />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontSize: '0.66rem',
                                  color: 'var(--text-secondary)',
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  fontWeight: 600,
                                }}>
                                  {block.children.length} {block.children.length === 1 ? 'esercizio' : 'esercizi'}
                                </span>
                                <button
                                  onClick={() => removeExerciseFromDay(dIdx, headerIdx)}
                                  className="btn-ghost"
                                  style={{ color: 'var(--accent-danger)', padding: 2 }}
                                  title="Elimina gruppo (gli esercizi rimarranno nella scheda)"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* Group Settings: Type & Notes */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6 }}>
                              <div>
                                <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
                                  Tipo Gruppo / Metodo:
                                </span>
                                <select
                                  value={groupHeader.groupType || 'superset'}
                                  onChange={(e) => updateExerciseProperty(dIdx, headerIdx, 'groupType', e.target.value)}
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
                                  Istruzioni Superset / Note (Opzionale):
                                </span>
                                <input
                                  type="text"
                                  value={groupHeader.notes || ''}
                                  onChange={(e) => updateExerciseProperty(dIdx, headerIdx, 'notes', e.target.value)}
                                  placeholder="Es. Esegui in superset senza recupero tra A e B..."
                                  style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Lista degli Esercizi contenuti nel Gruppo */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                            {block.children.length === 0 ? (
                              <div
                                style={{
                                  padding: '12px',
                                  textAlign: 'center',
                                  color: '#c4b5fd',
                                  fontSize: '0.75rem',
                                  border: '1px dashed rgba(139, 92, 246, 0.4)',
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'rgba(139, 92, 246, 0.04)',
                                }}
                              >
                                Nessun esercizio in questo gruppo. Trascina un esercizio qui o usa i pulsanti sotto.
                              </div>
                            ) : (
                              block.children.map(({ ex: childEx, originalIndex: childIdx }, childOrder) => {
                                exerciseNumberCounter++;
                                const currentExNum = exerciseNumberCounter;
                                const isDraggingChild = draggedItem?.id === childEx.id;

                                return (
                                  <div
                                    key={childEx.id}
                                    onDragOver={(e) => handleDragOver(e, dIdx, childIdx, 'inside-group', groupHeader.id)}
                                    onDrop={(e) => handleDrop(e, dIdx, childIdx, groupHeader.id)}
                                    style={{
                                      background: 'var(--bg-card)',
                                      border: '1px solid rgba(139, 92, 246, 0.3)',
                                      borderLeft: '3px solid #a78bfa',
                                      borderRadius: 'var(--radius-sm)',
                                      padding: '7px 9px',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 6,
                                      opacity: isDraggingChild ? 0.45 : 1,
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                                        {/* Grip Handle */}
                                        <div
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, dIdx, childIdx, childEx.id)}
                                          onDragEnd={handleDragEnd}
                                          style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                                          title="Trascina per riordinare o estrarre"
                                        >
                                          <GripVertical size={14} />
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                                          <button
                                            onClick={() => moveExercise(dIdx, childIdx, 'up')}
                                            disabled={childIdx === 0}
                                            style={{ background: 'none', border: 'none', color: childIdx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                            title="Sposta su"
                                          >
                                            <ChevronUp size={12} />
                                          </button>
                                          <button
                                            onClick={() => moveExercise(dIdx, childIdx, 'down')}
                                            disabled={childIdx === day.exercises.length - 1}
                                            style={{ background: 'none', border: 'none', color: childIdx === day.exercises.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                            title="Sposta giù"
                                          >
                                            <ChevronDown size={12} />
                                          </button>
                                        </div>

                                        <span style={{
                                          fontFamily: 'var(--font-mono)',
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          color: '#a78bfa',
                                          flexShrink: 0,
                                        }}>
                                          {String.fromCharCode(65 + childOrder)}.
                                        </span>

                                        <div style={{ minWidth: 0, flex: 1 }}>
                                          <strong style={{ color: '#fff', fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                            {childEx.name}
                                          </strong>
                                          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                                            Esercizio #{currentExNum}
                                          </span>
                                        </div>
                                      </div>

                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        {/* Button per estrarre dal gruppo */}
                                        <button
                                          type="button"
                                          onClick={() => extractExerciseFromGroup(dIdx, childIdx)}
                                          className="btn-ghost"
                                          style={{ fontSize: '0.68rem', padding: '2px 6px', color: '#c4b5fd', background: 'rgba(139, 92, 246, 0.1)' }}
                                          title="Estrai esercizio dal gruppo (diventa standalone)"
                                        >
                                          <LogOut size={12} style={{ transform: 'rotate(180deg)' }} /> Estrai
                                        </button>

                                        <button
                                          onClick={() => removeExerciseFromDay(dIdx, childIdx)}
                                          className="btn-ghost"
                                          style={{ color: 'var(--accent-danger)', padding: 2 }}
                                          title="Rimuovi dalla scheda"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Exercise sets / reps inputs */}
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(4, 1fr)',
                                      gap: 4,
                                      alignItems: 'center',
                                    }}>
                                      <div>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Serie</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="20"
                                          value={childEx.targetSets !== undefined && childEx.targetSets !== null ? childEx.targetSets : ''}
                                          placeholder="3"
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateExerciseProperty(dIdx, childIdx, 'targetSets', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                                          }}
                                          style={{ padding: '3px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                                        />
                                      </div>

                                      <div>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Reps Min</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="100"
                                          value={childEx.targetRepsMin !== undefined && childEx.targetRepsMin !== null ? childEx.targetRepsMin : ''}
                                          placeholder="8"
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateExerciseProperty(dIdx, childIdx, 'targetRepsMin', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                                          }}
                                          style={{ padding: '3px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                                        />
                                      </div>

                                      <div>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Reps Max</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="100"
                                          value={childEx.targetRepsMax !== undefined && childEx.targetRepsMax !== null ? childEx.targetRepsMax : ''}
                                          placeholder="10"
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateExerciseProperty(dIdx, childIdx, 'targetRepsMax', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                                          }}
                                          style={{ padding: '3px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                                        />
                                      </div>

                                      <div>
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Recup (s)</span>
                                        <input
                                          type="number"
                                          step="15"
                                          min="0"
                                          max="600"
                                          value={childEx.targetRestSeconds !== undefined && childEx.targetRestSeconds !== null ? childEx.targetRestSeconds : ''}
                                          placeholder="90"
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            updateExerciseProperty(dIdx, childIdx, 'targetRestSeconds', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
                                          }}
                                          style={{ padding: '3px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Azioni Riquadro Gruppo: Aggiungi Nuovo o Includi Esistente */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setExerciseSearch('');
                                setIsCreatingExercise(false);
                                setExerciseModalOpen({ dayIndex: dIdx, targetGroupId: groupHeader.id });
                              }}
                              style={{
                                background: 'rgba(139, 92, 246, 0.2)',
                                border: '1px solid rgba(139, 92, 246, 0.45)',
                                color: '#c4b5fd',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 700,
                              }}
                            >
                              <Plus size={13} /> Aggiungi Esercizio al Gruppo
                            </button>

                            <button
                              type="button"
                              onClick={() => setIncludeExistingModal({ dayIndex: dIdx, groupHeaderId: groupHeader.id, groupName: groupHeader.name })}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(139, 92, 246, 0.35)',
                                color: '#e2e8f0',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                borderRadius: 'var(--radius-sm)',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontWeight: 600,
                              }}
                            >
                              <FolderPlus size={13} color="#a78bfa" /> Includi Esercizio Esistente...
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // BLOCCO PAUSA / DIVIDER
                    if (block.type === 'pause') {
                      const pauseEx = block.ex;
                      const pauseIdx = block.originalIndex;
                      const isDraggingThis = draggedItem?.id === pauseEx.id;

                      return (
                        <div
                          key={pauseEx.id}
                          onDragOver={(e) => handleDragOver(e, dIdx, pauseIdx, 'before')}
                          onDrop={(e) => handleDrop(e, dIdx, pauseIdx)}
                          style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, rgba(217, 119, 6, 0.04) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            opacity: isDraggingThis ? 0.45 : 1,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                              {/* Grip Handle */}
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, dIdx, pauseIdx, pauseEx.id)}
                                onDragEnd={handleDragEnd}
                                style={{ cursor: 'grab', color: '#fbbf24', display: 'flex', alignItems: 'center' }}
                                title="Trascina per riordinare"
                              >
                                <GripVertical size={15} />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                                <button
                                  onClick={() => moveExercise(dIdx, pauseIdx, 'up')}
                                  disabled={pauseIdx === 0}
                                  style={{ background: 'none', border: 'none', color: pauseIdx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                  title="Sposta su"
                                >
                                  <ChevronUp size={13} />
                                </button>
                                <button
                                  onClick={() => moveExercise(dIdx, pauseIdx, 'down')}
                                  disabled={pauseIdx === day.exercises.length - 1}
                                  style={{ background: 'none', border: 'none', color: pauseIdx === day.exercises.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                  title="Sposta giù"
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
                                value={pauseEx.name}
                                onChange={(e) => updateExerciseProperty(dIdx, pauseIdx, 'name', e.target.value)}
                                placeholder="Nome blocco pausa (es. Pausa / Recupero)"
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
                              onClick={() => removeExerciseFromDay(dIdx, pauseIdx)}
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
                                value={pauseEx.restDurationSeconds || 120}
                                onChange={(e) => updateExerciseProperty(dIdx, pauseIdx, 'restDurationSeconds', parseInt(e.target.value) || 120)}
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
                                value={pauseEx.notes || ''}
                                onChange={(e) => updateExerciseProperty(dIdx, pauseIdx, 'notes', e.target.value)}
                                placeholder="Es. Idratazione, preparazione carico..."
                                style={{ fontSize: '0.78rem', padding: '3px 6px' }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // BLOCCO ESERCIZIO STANDALONE
                    const standEx = block.ex;
                    const standIdx = block.originalIndex;
                    exerciseNumberCounter++;
                    const currentExNum = exerciseNumberCounter;
                    const isDraggingThis = draggedItem?.id === standEx.id;

                    return (
                      <div
                        key={standEx.id}
                        onDragOver={(e) => handleDragOver(e, dIdx, standIdx, 'before')}
                        onDrop={(e) => handleDrop(e, dIdx, standIdx)}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          opacity: isDraggingThis ? 0.45 : 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                            {/* Grip Handle */}
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, dIdx, standIdx, standEx.id)}
                              onDragEnd={handleDragEnd}
                              style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                              title="Trascina per riordinare o trascinare in un gruppo"
                            >
                              <GripVertical size={15} />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
                              <button
                                onClick={() => moveExercise(dIdx, standIdx, 'up')}
                                disabled={standIdx === 0}
                                style={{ background: 'none', border: 'none', color: standIdx === 0 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                title="Sposta su"
                              >
                                <ChevronUp size={13} />
                              </button>
                              <button
                                onClick={() => moveExercise(dIdx, standIdx, 'down')}
                                disabled={standIdx === day.exercises.length - 1}
                                style={{ background: 'none', border: 'none', color: standIdx === day.exercises.length - 1 ? 'var(--border-subtle)' : 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                                title="Sposta giù"
                              >
                                <ChevronDown size={13} />
                              </button>
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong style={{ color: '#fff', fontSize: '0.84rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                {currentExNum}. {standEx.name}
                              </strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {/* Pulsante rapido per aggiungere a un gruppo */}
                            <button
                              type="button"
                              onClick={() => setAssignToGroupModal({ dayIndex: dIdx, exId: standEx.id })}
                              className="btn-ghost"
                              style={{
                                fontSize: '0.68rem',
                                padding: '3px 6px',
                                color: '#c4b5fd',
                                background: 'rgba(139, 92, 246, 0.08)',
                                border: '1px dashed rgba(139, 92, 246, 0.35)',
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                              title="Aggiungi questo esercizio a un gruppo / superset"
                            >
                              <Layers size={11} /> Gruppo...
                            </button>

                            <button
                              onClick={() => removeExerciseFromDay(dIdx, standIdx)}
                              className="btn-ghost"
                              style={{ color: 'var(--accent-danger)', padding: 2 }}
                              title="Rimuovi esercizio"
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
                              value={standEx.targetSets !== undefined && standEx.targetSets !== null ? standEx.targetSets : ''}
                              placeholder="3"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateExerciseProperty(dIdx, standIdx, 'targetSets', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
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
                              value={standEx.targetRepsMin !== undefined && standEx.targetRepsMin !== null ? standEx.targetRepsMin : ''}
                              placeholder="8"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateExerciseProperty(dIdx, standIdx, 'targetRepsMin', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
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
                              value={standEx.targetRepsMax !== undefined && standEx.targetRepsMax !== null ? standEx.targetRepsMax : ''}
                              placeholder="10"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateExerciseProperty(dIdx, standIdx, 'targetRepsMax', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
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
                              value={standEx.targetRestSeconds !== undefined && standEx.targetRestSeconds !== null ? standEx.targetRestSeconds : ''}
                              placeholder="90"
                              onChange={(e) => {
                                const val = e.target.value;
                                updateExerciseProperty(dIdx, standIdx, 'targetRestSeconds', val === '' ? ('' as unknown as number) : (parseInt(val, 10) || 0));
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
                    background: 'rgba(139, 92, 246, 0.14)',
                    border: '1px solid rgba(139, 92, 246, 0.45)',
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
                  <Layers size={14} /> Crea Riquadro Gruppo / Superset
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
          );
        })}
      </div>

      {/* Modal: Includi Esercizio Esistente in un Gruppo */}
      {includeExistingModal !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 115,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
        }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 460,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderPlus size={18} color="#a78bfa" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Includi nel Gruppo: {includeExistingModal.groupName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIncludeExistingModal(null)}
                className="btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '0 0 6px 0' }}>
                Seleziona uno degli esercizi già presenti in questa giornata per spostarlo all&apos;interno del riquadro:
              </p>

              {(() => {
                const day = days[includeExistingModal.dayIndex];
                const availableExercises = day.exercises.filter(
                  (e) => isActualExercise(e) && e.groupId !== includeExistingModal.groupHeaderId
                );

                if (availableExercises.length === 0) {
                  return (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '0.8rem',
                      border: '1px dashed var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                    }}>
                      Nessun altro esercizio disponibile da includere in questa giornata.
                    </div>
                  );
                }

                return availableExercises.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => includeExistingExerciseInGroup(includeExistingModal.dayIndex, includeExistingModal.groupHeaderId, ex.id)}
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
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{ex.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {ex.targetSets} serie • {ex.targetRepsMin}-{ex.targetRepsMax} reps
                        {ex.groupName ? ` (attualmente in: ${ex.groupName})` : ' (standalone)'}
                      </div>
                    </div>
                    <Check size={16} color="#a78bfa" />
                  </button>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Assegna Standalone a Gruppo Esistente o Nuovo */}
      {assignToGroupModal !== null && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 115,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
        }}>
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: 440,
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#a78bfa" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Aggiungi Esercizio a un Gruppo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAssignToGroupModal(null)}
                className="btn-ghost"
                style={{ padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                Scegli a quale gruppo/superset assegnare questo esercizio:
              </p>

              {/* Opzione 1: Crea nuovo gruppo */}
              <button
                type="button"
                onClick={() => assignExerciseToGroup(assignToGroupModal.dayIndex, assignToGroupModal.exId, 'new')}
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.45)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  color: '#c4b5fd',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                }}
              >
                <Plus size={15} /> Crea Nuovo Riquadro Superset con questo esercizio
              </button>

              {/* Opzione 2: Gruppi esistenti */}
              {(() => {
                const day = days[assignToGroupModal.dayIndex];
                const existingGroups = day.exercises.filter((e) => e.isGroupHeader);

                if (existingGroups.length === 0) return null;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Oppure aggiungi a un gruppo esistente:
                    </span>
                    {existingGroups.map((grp) => (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => assignExerciseToGroup(assignToGroupModal.dayIndex, assignToGroupModal.exId, grp.id)}
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
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                          ⚡ {grp.name}
                        </span>
                        <Check size={14} color="#a78bfa" />
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

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
                  {isCreatingExercise ? 'Crea Nuovo Esercizio' : (exerciseModalOpen.targetGroupId ? 'Aggiungi Esercizio al Gruppo' : 'Seleziona Esercizio')}
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
                onSubmit={(e) => handleCreateAndAddExercise(exerciseModalOpen.dayIndex, exerciseModalOpen.targetGroupId, e)}
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
                        onClick={() => addExerciseToDay(exerciseModalOpen.dayIndex, ex, exerciseModalOpen.targetGroupId)}
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
