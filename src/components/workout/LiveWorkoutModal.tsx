import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Plus,
  Clock,
  Sparkles,
  Calculator,
  Timer,
  Layers,
} from 'lucide-react';
import type {
  WorkoutSession,
  CompletedExerciseLog,
  CompletedSet,
  Exercise,
} from '../../types/workout';
import { StorageService } from '../../services/storage';
import { Sound } from '../../services/audio';
import { OverloadEngine } from '../../services/overloadEngine';
import type { OverloadSuggestion } from '../../services/overloadEngine';
import { SetRow } from './SetRow';
import { RestTimer } from './RestTimer';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { formatDuration } from '../../utils/calculations';

interface LiveWorkoutModalProps {
  initialSession: WorkoutSession;
  onFinish: (session: WorkoutSession) => void;
  onCancel: () => void;
}

export const LiveWorkoutModal: React.FC<LiveWorkoutModalProps> = ({
  initialSession,
  onFinish,
  onCancel,
}) => {
  const [session, setSession] = useState<WorkoutSession>(initialSession);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(initialSession.durationSeconds || 0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(90);
  const [plateCalcWeight, setPlateCalcWeight] = useState<number | null>(null);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
  const [finalSessionData, setFinalSessionData] = useState<WorkoutSession | null>(null);

  const pastSessions = StorageService.getSessions();
  const existingPRs = StorageService.getPRs();

  // Stopwatch interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save draft to storage whenever session changes
  useEffect(() => {
    const updatedDraft: WorkoutSession = {
      ...session,
      durationSeconds: elapsedSeconds,
    };
    StorageService.saveActiveSession(updatedDraft);
  }, [session, elapsedSeconds]);

  // Update a single set in an exercise
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, updatedSet: CompletedSet) => {
    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = updatedSet;
    setSession({ ...session, exercises: updatedExercises });
  };

  // Toggle complete set & trigger rest timer
  const handleToggleCompleteSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...session.exercises];
    const currentSet = updatedExercises[exerciseIndex].sets[setIndex];
    const newCompleted = !currentSet.completed;

    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...currentSet,
      completed: newCompleted,
    };

    setSession({ ...session, exercises: updatedExercises });

    if (newCompleted) {
      Sound.playTapSound();
      setTimerDuration(90);
      setIsTimerActive(true);
    }
  };

  // Add new set to exercise
  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...session.exercises];
    const ex = updatedExercises[exerciseIndex];
    const lastSet = ex.sets[ex.sets.length - 1];

    const newSet: CompletedSet = {
      id: `set-${Date.now()}-${Math.random()}`,
      setNumber: ex.sets.length + 1,
      type: 'normal',
      weight: lastSet ? lastSet.weight : 20,
      reps: lastSet ? lastSet.reps : 8,
      completed: false,
    };

    updatedExercises[exerciseIndex].sets.push(newSet);
    setSession({ ...session, exercises: updatedExercises });
  };

  // Delete a set
  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    updatedExercises[exerciseIndex].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    setSession({ ...session, exercises: updatedExercises });
  };

  // Add new exercise to workout
  const handleAddExercise = (exercise: Exercise) => {
    const newExerciseLog: CompletedExerciseLog = {
      id: `ex-log-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [
        { id: `s1-${Date.now()}`, setNumber: 1, type: 'normal', weight: 20, reps: 8, completed: false },
        { id: `s2-${Date.now()}`, setNumber: 2, type: 'normal', weight: 20, reps: 8, completed: false },
        { id: `s3-${Date.now()}`, setNumber: 3, type: 'normal', weight: 20, reps: 8, completed: false },
      ],
    };

    setSession({
      ...session,
      exercises: [...session.exercises, newExerciseLog],
    });
  };

  // Remove exercise or pause from session
  const handleRemoveExercise = (exerciseIndex: number) => {
    if (confirm('Rimuovere questo elemento dalla sessione?')) {
      const updated = [...session.exercises];
      updated.splice(exerciseIndex, 1);
      setSession({ ...session, exercises: updated });
    }
  };

  // Toggle pause completed state
  const handleTogglePauseCompleted = (exerciseIndex: number) => {
    const updated = [...session.exercises];
    const item = updated[exerciseIndex];
    item.completed = !item.completed;
    setSession({ ...session, exercises: updated });
    if (item.completed) {
      Sound.playTapSound();
    }
  };

  // Calculate live progression suggestion for an exercise
  const getOverloadAdvice = (exerciseId: string): OverloadSuggestion => {
    return OverloadEngine.getProgressionAdvice(exerciseId, pastSessions);
  };

  // Finish Workout: compute volume, check PRs, open summary modal
  const handleCompleteWorkout = () => {
    let totalVolume = 0;
    let totalSetsCount = 0;
    let totalRepsCount = 0;

    session.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed && s.weight > 0 && s.reps > 0) {
          totalVolume += s.weight * s.reps;
          totalSetsCount++;
          totalRepsCount += s.reps;
        }
      });
    });

    const finishedSession: WorkoutSession = {
      ...session,
      endTime: new Date().toISOString(),
      durationSeconds: elapsedSeconds,
      totalVolumeKg: Math.round(totalVolume),
      totalSets: totalSetsCount,
      totalReps: totalRepsCount,
    };

    const { updatedPRs, newAchievements } = OverloadEngine.evaluateNewPRs(finishedSession, existingPRs);
    finishedSession.prsAchieved = newAchievements;

    StorageService.savePRs(updatedPRs);

    if (newAchievements.length > 0) {
      Sound.playPRFanfare();
    }

    setFinalSessionData(finishedSession);
    setSummaryModalOpen(true);
  };

  const handleFinalSaveSession = (savedSession: WorkoutSession) => {
    StorageService.addCompletedSession(savedSession);
    onFinish(savedSession);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-main)',
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      width: '100%',
    }}>
      {/* Top Floating App Bar */}
      <div style={{
        padding: '8px 12px',
        background: 'rgba(14, 17, 24, 0.96)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <button
            onClick={() => {
              if (confirm('Vuoi ridurre la sessione a icona e tornare alla dashboard? I tuoi progressi sono salvati automaticamente.')) {
                onCancel();
              }
            }}
            className="btn-ghost"
            style={{ padding: 4, flexShrink: 0 }}
            title="Riduci a icona"
          >
            <X size={18} />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.routineTitle || 'Allenamento'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {session.dayName || 'Sessione Live'}
            </div>
          </div>
        </div>

        {/* Stopwatch & Finish CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--bg-input)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Clock size={13} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.84rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff' }}>
              {formatDuration(elapsedSeconds)}
            </span>
          </div>

          <button
            onClick={handleCompleteWorkout}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
          >
            <CheckCircle size={14} /> Termina
          </button>
        </div>
      </div>

      {/* Main Scrollable Exercises List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px 12px',
        maxWidth: 680,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        paddingBottom: 100,
      }}>
        {/* Rest Timer Docked Card */}
        {isTimerActive && (
          <RestTimer
            initialSeconds={timerDuration}
            isActive={true}
            onFinish={() => setIsTimerActive(false)}
            onClose={() => setIsTimerActive(false)}
          />
        )}

        {/* Exercise, Group & Pause Cards */}
        {session.exercises.map((exLog, exIdx) => {
          if (exLog.isGroupHeader) {
            const typeLabel = exLog.groupType === 'superset' ? 'SUPERSET' : (exLog.groupType === 'circuit' ? 'CIRCUITO' : (exLog.groupType === 'warmup' ? 'WARM-UP' : (exLog.groupType === 'finisher' ? 'FINISHER' : 'GRUPPO')));
            return (
              <div
                key={exLog.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.16) 0%, rgba(99, 102, 241, 0.08) 100%)',
                  border: '1px solid rgba(139, 92, 246, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      background: 'rgba(139, 92, 246, 0.3)',
                      color: '#c4b5fd',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Layers size={13} /> {typeLabel}
                    </span>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {exLog.exerciseName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="btn-ghost"
                    style={{ padding: 4, color: 'var(--text-muted)' }}
                    title="Rimuovi intestazione gruppo"
                  >
                    <X size={15} />
                  </button>
                </div>
                {exLog.notes && (
                  <div style={{ fontSize: '0.76rem', color: '#c4b5fd', background: 'rgba(0, 0, 0, 0.25)', padding: '5px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {exLog.notes}
                  </div>
                )}
              </div>
            );
          }

          if (exLog.isRestPause) {
            const pauseSeconds = exLog.restDurationSeconds || 120;
            const durationText = pauseSeconds >= 60
              ? `${Math.round(pauseSeconds / 60 * 10) / 10} min (${pauseSeconds}s)`
              : `${pauseSeconds} secondi`;

            return (
              <div
                key={exLog.id}
                style={{
                  background: exLog.completed
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%)',
                  border: exLog.completed
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                    <span style={{
                      background: exLog.completed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                      color: exLog.completed ? 'var(--accent-success)' : '#fbbf24',
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}>
                      <Timer size={13} /> PAUSA
                    </span>
                    <div>
                      <h3 style={{
                        fontSize: '0.96rem',
                        fontWeight: 800,
                        color: exLog.completed ? 'var(--accent-success)' : '#fff',
                        margin: 0,
                        textDecoration: exLog.completed ? 'line-through' : 'none',
                      }}>
                        {exLog.exerciseName}
                      </h3>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Durata programmata: <strong style={{ color: '#fbbf24' }}>{durationText}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(exIdx)}
                      className="btn-ghost"
                      style={{ padding: 4, color: 'var(--text-muted)' }}
                      title="Rimuovi pausa"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {exLog.notes && (
                  <div style={{
                    fontSize: '0.76rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid #fbbf24',
                  }}>
                    {exLog.notes}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerDuration(pauseSeconds);
                      setIsTimerActive(true);
                      Sound.playTapSound();
                    }}
                    className="btn-secondary"
                    style={{
                      padding: '7px 14px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      color: '#fbbf24',
                    }}
                  >
                    <Timer size={15} /> Avvia Timer Pausa ({pauseSeconds}s)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePauseCompleted(exIdx)}
                    style={{
                      background: exLog.completed ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-input)',
                      border: exLog.completed ? '1px solid var(--accent-success)' : '1px solid var(--border-subtle)',
                      color: exLog.completed ? 'var(--accent-success)' : 'var(--text-primary)',
                      padding: '7px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle size={15} /> {exLog.completed ? 'Pausa Completata ✓' : 'Segna come Eseguita'}
                  </button>
                </div>
              </div>
            );
          }

          const advice = getOverloadAdvice(exLog.exerciseId);

          return (
            <div
              key={exLog.id}
              className="glass-card"
              style={{
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                width: '100%',
              }}
            >
              {/* Exercise Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      #{exIdx + 1}
                    </span>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#fff', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {exLog.exerciseName}
                    </h3>
                    {exLog.groupName && (
                      <span style={{
                        fontSize: '0.66rem',
                        color: '#c4b5fd',
                        background: 'rgba(139, 92, 246, 0.2)',
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                      }}>
                        {exLog.groupName}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {exLog.muscleGroup.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const firstSetWeight = exLog.sets[0]?.weight || 60;
                      setPlateCalcWeight(firstSetWeight);
                    }}
                    className="btn-ghost"
                    style={{ padding: 4 }}
                    title="Calcolatore piastre"
                  >
                    <Calculator size={15} color="var(--accent-secondary)" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="btn-ghost"
                    style={{ padding: 4, color: 'var(--text-muted)' }}
                    title="Rimuovi esercizio"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Progressive Overload Coach Pill */}
              {advice && (
                <div style={{
                  background: advice.action === 'increase_weight'
                    ? 'rgba(16, 185, 129, 0.1)'
                    : advice.action === 'increase_reps'
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    advice.action === 'increase_weight'
                      ? 'rgba(16, 185, 129, 0.25)'
                      : advice.action === 'increase_reps'
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <Sparkles size={13} color={advice.action === 'increase_weight' ? '#34d399' : '#60a5fa'} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                    <strong>{advice.title}:</strong> {advice.reason}
                  </span>
                </div>
              )}

              {/* Sets Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '26px 1fr 1fr 34px 22px',
                gap: 4,
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '0 6px',
              }}>
                <span>SET</span>
                <span>PESO</span>
                <span>REPS</span>
                <span>OK</span>
                <span></span>
              </div>

              {/* Sets Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {exLog.sets.map((set, setIdx) => (
                  <SetRow
                    key={set.id}
                    set={set}
                    onUpdate={(updated) => handleUpdateSet(exIdx, setIdx, updated)}
                    onDelete={() => handleDeleteSet(exIdx, setIdx)}
                    onToggleComplete={() => handleToggleCompleteSet(exIdx, setIdx)}
                  />
                ))}
              </div>

              {/* Add Set Button */}
              <button
                type="button"
                onClick={() => handleAddSet(exIdx)}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.78rem', alignSelf: 'flex-start' }}
              >
                <Plus size={13} /> Serie
              </button>
            </div>
          );
        })}

        {/* Add Exercise Bottom Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
          <button
            type="button"
            onClick={() => {
              const exName = prompt('Nome esercizio da aggiungere:', 'Trazioni alla Sbarra');
              if (exName) {
                handleAddExercise({
                  id: `custom-${Date.now()}`,
                  name: exName,
                  muscleGroup: 'back',
                  equipment: 'bodyweight',
                });
              }
            }}
            className="btn-secondary"
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.82rem' }}
          >
            <Plus size={15} /> Aggiungi Esercizio alla Sessione
          </button>
        </div>
      </div>

      {/* Plate Calculator Modal */}
      {plateCalcWeight !== null && (
        <PlateCalculatorModal
          isOpen={true}
          defaultWeightKg={plateCalcWeight}
          onClose={() => setPlateCalcWeight(null)}
        />
      )}

      {/* Workout Summary / Debrief Modal */}
      {summaryModalOpen && finalSessionData && (
        <WorkoutSummaryModal
          session={finalSessionData}
          onSaveAndClose={handleFinalSaveSession}
        />
      )}
    </div>
  );
};
