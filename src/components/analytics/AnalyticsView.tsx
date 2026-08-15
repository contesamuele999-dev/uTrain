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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Grafici & Sovraccarico
          </h1>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            Monitora forza, 1RM stimati e distribuzione volume
          </p>
        </div>

        <button onClick={onOpenCoach} className="btn-ai" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
          <Sparkles size={14} /> Chiedi al Coach
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
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <Trophy size={16} color="#fbbf24" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Record Personali ({prList.length})
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 8,
          }}>
            {prList.map((pr) => (
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
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pr.exerciseName}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                    Max: <strong>{pr.maxWeight}kg</strong> × {pr.maxWeightReps}r
                  </div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: 6 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
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
    </div>
  );
};
