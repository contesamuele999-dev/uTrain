import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { WorkoutSession, PersonalRecord } from '../../types/workout';
import { estimate1RM, formatDateShort } from '../../utils/calculations';
import { Trophy, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ExerciseProgressionChartProps {
  sessions: WorkoutSession[];
  prs: Record<string, PersonalRecord>;
}

export const ExerciseProgressionChart: React.FC<ExerciseProgressionChartProps> = ({
  sessions,
  prs,
}) => {
  // Extract all unique exercises logged across sessions
  const exerciseMap: Record<string, string> = {};
  sessions.forEach((s) => {
    s.exercises.forEach((e) => {
      if (e.sets.some((set) => set.completed)) {
        exerciseMap[e.exerciseId] = e.exerciseName;
      }
    });
  });

  const availableExerciseIds = Object.keys(exerciseMap);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    availableExerciseIds[0] || 'bench-press-barbell'
  );

  if (availableExerciseIds.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Nessun dato di allenamento sufficiente per tracciare i grafici di progressione. Completa una sessione o carica i dati demo nelle impostazioni!
      </div>
    );
  }

  // Filter and build chronology of 1RM and Max Weight for selected exercise
  const dataPoints: Array<{ date: string; maxWeight: number; estimated1RM: number }> = [];

  // Sort sessions chronologically (oldest to newest)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  sortedSessions.forEach((s) => {
    const exMatch = s.exercises.find((e) => e.exerciseId === selectedExerciseId);
    if (exMatch) {
      const completedSets = exMatch.sets.filter((set) => set.completed && set.weight > 0 && set.reps > 0);
      if (completedSets.length > 0) {
        let maxW = 0;
        let max1RM = 0;
        completedSets.forEach((set) => {
          if (set.weight > maxW) maxW = set.weight;
          const e1rm = estimate1RM(set.weight, set.reps);
          if (e1rm > max1RM) max1RM = e1rm;
        });

        dataPoints.push({
          date: formatDateShort(s.startTime),
          maxWeight: maxW,
          estimated1RM: max1RM,
        });
      }
    }
  });

  const labels = dataPoints.map((d) => d.date);
  const oneRMData = dataPoints.map((d) => d.estimated1RM);
  const maxWeightData = dataPoints.map((d) => d.maxWeight);

  const activePR = prs[selectedExerciseId];

  // Calculate delta percentage
  const initial1RM = oneRMData[0] || 0;
  const current1RM = oneRMData[oneRMData.length - 1] || 0;
  const delta1RM = current1RM - initial1RM;
  const deltaPercent = initial1RM > 0 ? ((delta1RM / initial1RM) * 100).toFixed(1) : '0';

  const chartData = {
    labels,
    datasets: [
      {
        label: '1RM Stimato (kg)',
        data: oneRMData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        borderWidth: 3,
        pointBackgroundColor: '#10b981',
        pointBorderColor: '#fff',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Carico Massimo Sollevato (kg)',
        data: maxWeightData,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: '#3b82f6',
        pointRadius: 4,
        tension: 0.2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { family: 'Plus Jakarta Sans', size: 12, weight: 600 as const },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(18, 21, 30, 0.95)',
        titleColor: '#fff',
        bodyColor: '#10b981',
        borderColor: '#23293b',
        borderWidth: 1,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono' } },
      },
    },
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Exercise Selector Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
            Seleziona Esercizio per Analisi Sovraccarico:
          </label>
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            style={{ maxWidth: 320, fontWeight: 700, color: '#fff' }}
          >
            {availableExerciseIds.map((id) => (
              <option key={id} value={id}>
                {exerciseMap[id]}
              </option>
            ))}
          </select>
        </div>

        {/* PR & Delta Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {activePR && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              textAlign: 'right',
            }}>
              <div style={{ fontSize: '0.68rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                <Trophy size={12} /> PR Massimale
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {activePR.maxWeight} kg <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({activePR.maxWeightReps} rip)</span>
              </div>
            </div>
          )}

          {dataPoints.length > 1 && (
            <div style={{
              background: delta1RM >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `1px solid ${delta1RM >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
            }}>
              <div style={{ fontSize: '0.68rem', color: delta1RM >= 0 ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                <TrendingUp size={12} /> Progressione 1RM
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {delta1RM >= 0 ? `+${delta1RM.toFixed(1)}` : delta1RM.toFixed(1)} kg ({deltaPercent}%)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ height: 280, width: '100%', position: 'relative' }}>
        {dataPoints.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Nessuna serie registrata per questo esercizio.
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};
