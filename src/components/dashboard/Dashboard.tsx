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
import { formatDateIt, formatDuration } from '../../utils/calculations';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Active Workout Resume Banner */}
      {activeWorkoutDraft && (
        <div
          onClick={onResumeActiveWorkout}
          className="glass-card animate-pulse-glow"
          style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(18, 21, 30, 0.95) 100%)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              boxShadow: '0 0 10px var(--accent-primary)',
            }} />
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                Sessione in corso: {activeWorkoutDraft.routineTitle || 'Allenamento'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
                Tocca qui per riprendere la registrazione dei carichi
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
            Riprendi
          </button>
        </div>
      )}

      {/* Greeting Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
            Ciao, {settings.userName || 'Atleta'}! 🔥
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Pronto a spingere oltre i tuoi limiti oggi?
          </p>
        </div>

        <button
          onClick={onOpenAIGenerator}
          className="btn-ai"
          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
        >
          <Sparkles size={16} /> Nuova Scheda AI
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
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trophy size={18} color="#fbbf24" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Migliori Record Personali (PR)
              </h3>
            </div>
            <button
              onClick={onOpenAnalytics}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            >
              Vedi grafici <ChevronRight size={14} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {topPRs.map((pr) => (
              <div
                key={pr.exerciseId}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {pr.exerciseName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {pr.maxWeightReps} rip con {pr.maxWeight} kg
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#fbbf24',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {pr.maxEstimated1RM} kg
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    1RM Stimato
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Sessions History Preview */}
      {recentSessions.length > 0 && (
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HistoryIcon size={18} color="#60a5fa" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                Ultime Sessioni Completate
              </h3>
            </div>
            <button
              onClick={onOpenHistory}
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '4px 8px' }}
            >
              Tutto lo storico <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentSessions.map((session) => (
              <div
                key={session.id}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                    {session.routineTitle || 'Allenamento Libero'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {session.dayName || formatDateIt(session.startTime)} • {session.exercises.length} esercizi • {session.totalSets} serie
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                      {session.totalVolumeKg} kg
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {formatDuration(session.durationSeconds)}
                    </div>
                  </div>

                  {session.prsAchieved && session.prsAchieved.length > 0 && (
                    <span className="chip chip-amber" title={`${session.prsAchieved.length} nuovi PR`}>
                      <Flame size={12} /> {session.prsAchieved.length} PR
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
