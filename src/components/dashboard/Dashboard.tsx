import React from 'react';
import {
  Sparkles,
  Trophy,
  History as HistoryIcon,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { AICoachPill } from './AICoachPill';
import { QuickStartCard } from './QuickStartCard';
import { StatsOverview } from './StatsOverview';
import type {
  Routine,
  RoutineDay,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../../types/workout';
import { formatDateIt, formatDuration, countActualExercises } from '../../utils/calculations';

interface DashboardProps {
  settings: UserProfileSettings;
  activeRoutine: Routine | undefined;
  sessions: WorkoutSession[];
  prs: Record<string, PersonalRecord>;
  activeWorkoutDraft: WorkoutSession | null;
  onResumeActiveWorkout: () => void;
  onStartWorkout: (routine: Routine, day: RoutineDay) => void;
  onOpenRoutines: () => void;
  onOpenAIGenerator: () => void;
  onOpenCoach: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onOpenAnalytics: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  settings,
  activeRoutine,
  sessions,
  prs,
  activeWorkoutDraft,
  onResumeActiveWorkout,
  onStartWorkout,
  onOpenRoutines,
  onOpenAIGenerator,
  onOpenCoach,
  onOpenSettings,
  onOpenHistory,
  onOpenAnalytics,
}) => {
  const topPRs = Object.values(prs).slice(0, 4);
  const recentSessions = sessions.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Active Workout Resume Banner */}
      {activeWorkoutDraft && (
        <div
          onClick={onResumeActiveWorkout}
          className="glass-card animate-pulse-glow"
          style={{
            padding: '10px 14px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(18, 21, 30, 0.95) 100%)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              boxShadow: '0 0 8px var(--accent-primary)',
              flexShrink: 0,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Sessione attiva: {activeWorkoutDraft.routineTitle || 'Allenamento'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)' }}>
                Tocca per riprendere i carichi
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ padding: '5px 10px', fontSize: '0.76rem', flexShrink: 0 }}>
            Riprendi
          </button>
        </div>
      )}

      {/* Greeting Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
            Ciao, {settings.userName || 'Atleta'}! 🔥
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Pronto a spingere oltre i tuoi limiti?
          </p>
        </div>

        <button
          onClick={onOpenAIGenerator}
          className="btn-ai"
          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
        >
          <Sparkles size={14} /> Nuova Scheda AI
        </button>
      </div>

      {/* AI Coach Daily Pill */}
      <AICoachPill onOpenCoach={onOpenCoach} onOpenSettings={onOpenSettings} />

      {/* Quick Start Card */}
      <QuickStartCard
        activeRoutine={activeRoutine}
        onStartWorkout={onStartWorkout}
        onOpenRoutines={onOpenRoutines}
        onOpenAIGenerator={onOpenAIGenerator}
      />

      {/* Stats Overview */}
      <StatsOverview sessions={sessions} prs={prs} />

      {/* PR Showcase */}
      {topPRs.length > 0 && (
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trophy size={16} color="#fbbf24" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Record Personali (PR)
              </h3>
            </div>
            <button
              onClick={onOpenAnalytics}
              className="btn-ghost"
              style={{ fontSize: '0.74rem', padding: '2px 6px' }}
            >
              Grafici <ChevronRight size={13} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
          }}>
            {topPRs.map((pr) => (
              <div
                key={pr.exerciseId}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pr.exerciseName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {pr.maxWeightReps}r × {pr.maxWeight}kg
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 6 }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#fbbf24',
                    fontFamily: 'var(--font-mono)',
                    lineHeight: 1,
                  }}>
                    {pr.maxEstimated1RM}k
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                    1RM
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions History Preview */}
      {recentSessions.length > 0 && (
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <HistoryIcon size={16} color="#60a5fa" />
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Ultime Sessioni
              </h3>
            </div>
            <button
              onClick={onOpenHistory}
              className="btn-ghost"
              style={{ fontSize: '0.74rem', padding: '2px 6px' }}
            >
              Tutto <ChevronRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recentSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {session.routineTitle || 'Allenamento Libero'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {session.dayName || formatDateIt(session.startTime)} • {countActualExercises(session.exercises)} es. • {session.totalSets} serie
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                      {session.totalVolumeKg}kg
                    </div>
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      {formatDuration(session.durationSeconds)}
                    </div>
                  </div>

                  {session.prsAchieved && session.prsAchieved.length > 0 && (
                    <span className="chip chip-amber" style={{ padding: '2px 6px', fontSize: '0.68rem' }}>
                      <Flame size={10} /> {session.prsAchieved.length} PR
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
