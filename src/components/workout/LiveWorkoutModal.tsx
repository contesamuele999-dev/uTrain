import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  Plus,
  Clock,
  Sparkles,
  Calculator,
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
    // Renumber remaining sets
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

  // Remove exercise from session
  const handleRemoveExercise = (exerciseIndex: number) => {
    if (confirm('Rimuovere questo esercizio dalla sessione corrente?')) {
      const updated = [...session.exercises];
      updated.splice(exerciseIndex, 1);
      setSession({ ...session, exercises: updated });
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

    // Check PRs
    const { updatedPRs, newAchievements } = OverloadEngine.evaluateNewPRs(finishedSession, existingPRs);
    finishedSession.prsAchieved = newAchievements;

    // Save PRs to storage
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
    }}>
      {/* Top Floating App Bar */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(14, 17, 24, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => {
              if (confirm('Vuoi ridurre la sessione a icona e tornare alla dashboard? I tuoi progressi sono salvati automaticamente.')) {
                onCancel();
              }
            }}
            className="btn-ghost"
            style={{ padding: 6 }}
            title="Riduci a icona"
          >
            <X size={20} />
          </button>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {session.routineTitle || 'Allenamento'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              {session.dayName || 'Sessione Live'}
            </div>
          </div>
        </div>

        {/* Stopwatch & Finish CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--bg-input)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Clock size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.95rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff' }}>
              {formatDuration(elapsedSeconds)}
            </span>
          </div>

          <button
            onClick={handleCompleteWorkout}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.86rem' }}
          >
            <CheckCircle size={18} /> Termina
          </button>
        </div>
      </div>

      {/* Main Scrollable Exercises List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBottom: 120,
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

        {/* Exercise Cards */}
        {session.exercises.map((exLog, exIdx) => {
          const advice = getOverloadAdvice(exLog.exerciseId);

          return (
            <div
              key={exLog.id}
              className="glass-card"
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Exercise Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: 'var(--accent-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      #{exIdx + 1}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {exLog.exerciseName}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {exLog.muscleGroup.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Plate Calculator Quick Launch */}
                  <button
                    type="button"
                    onClick={() => {
                      const firstSetWeight = exLog.sets[0]?.weight || 60;
                      setPlateCalcWeight(firstSetWeight);
                    }}
                    className="btn-ghost"
                    style={{ padding: 6 }}
                    title="Calcolatore piastre bilanciere"
                  >
                    <Calculator size={17} color="var(--accent-secondary)" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="btn-ghost"
                    style={{ padding: 6, color: 'var(--text-muted)' }}
                    title="Rimuovi esercizio"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Progressive Overload Coach Pill */}
              {advice && (
                <div style={{
                  background: advice.action === 'increase_weight'
                    ? 'rgba(16, 185, 129, 0.12)'
                    : advice.action === 'increase_reps'
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    advice.action === 'increase_weight'
                      ? 'rgba(16, 185, 129, 0.3)'
                      : advice.action === 'increase_reps'
                      ? 'rgba(59, 130, 246, 0.3)'
                      : 'var(--border-subtle)'
                  }`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Sparkles size={14} color={advice.action === 'increase_weight' ? '#34d399' : '#60a5fa'} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    <strong>{advice.title}:</strong> {advice.reason}
                  </span>
                </div>
              )}

              {/* Sets Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '40px 1.1fr 1.1fr 50px 32px',
                gap: 8,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '0 10px',
              }}>
                <span>SET</span>
                <span>PESO (KG)</span>
                <span>REPS</span>
                <span>FATTO</span>
                <span></span>
              </div>

              {/* Sets Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                style={{ padding: '8px 12px', fontSize: '0.82rem', marginTop: 4 }}
              >
                <Plus size={15} /> Aggiungi Serie
              </button>
            </div>
          );
        })}

        {/* Add Exercise Floating / Bottom Card */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
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
            style={{ padding: '12px 20px', borderRadius: 'var(--radius-full)' }}
          >
            <Plus size={18} /> Aggiungi Altro Esercizio alla Sessione
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
