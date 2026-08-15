import React from 'react';
import { Sparkles, Trophy } from 'lucide-react';
import type { WorkoutSession, PersonalRecord } from '../../types/workout';
import { ExerciseProgressionChart } from './ExerciseProgressionChart';
import { MuscleVolumeChart } from './MuscleVolumeChart';
import { ConsistencyCalendar } from './ConsistencyCalendar';

interface AnalyticsViewProps {
  sessions: WorkoutSession[];
  prs: Record<string, PersonalRecord>;
  onOpenAIGenerator: () => void;
  onOpenCoach: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  sessions,
  prs,
  onOpenCoach,
}) => {
  const prList = Object.values(prs);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Grafici & Sovraccarico Progressivo
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Monitora l&apos;aumento della tua forza, 1RM stimati e distribuzione del volume
          </p>
        </div>

        <button onClick={onOpenCoach} className="btn-ai" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
          <Sparkles size={16} /> Chiedi al Coach AI
        </button>
      </div>

      {/* 1RM Progression Line Chart */}
      <ExerciseProgressionChart sessions={sessions} prs={prs} />

      {/* Muscle Volume Chart */}
      <MuscleVolumeChart sessions={sessions} />

      {/* Consistency Calendar */}
      <ConsistencyCalendar sessions={sessions} />

      {/* All PRs Table */}
      {prList.length > 0 && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Trophy size={20} color="#fbbf24" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Tutti i Record Personali Registrati ({prList.length})
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 10,
          }}>
            {prList.map((pr) => (
              <div
                key={pr.exerciseId}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                    {pr.exerciseName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Max: <strong>{pr.maxWeight} kg</strong> × {pr.maxWeightReps} rip
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
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
    </div>
  );
};
