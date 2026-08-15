import React from 'react';
import {
  Chart as ChartJS,
  BarElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { WorkoutSession } from '../../types/workout';
import { MUSCLE_GROUP_LABELS } from '../../utils/calculations';

ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend);

interface MuscleVolumeChartProps {
  sessions: WorkoutSession[];
}

export const MuscleVolumeChart: React.FC<MuscleVolumeChartProps> = ({ sessions }) => {
  const muscleSetsMap: Record<string, number> = {};

  sessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      const group = ex.muscleGroup || 'other';
      if (!muscleSetsMap[group]) muscleSetsMap[group] = 0;

      ex.sets.forEach((set) => {
        if (set.completed && set.weight > 0 && set.reps > 0) {
          muscleSetsMap[group] += 1;
        }
      });
    });
  });

  const muscleKeys = Object.keys(muscleSetsMap).sort(
    (a, b) => muscleSetsMap[b] - muscleSetsMap[a]
  );

  const labels = muscleKeys.map((k) => MUSCLE_GROUP_LABELS[k] || k);
  const setsData = muscleKeys.map((k) => muscleSetsMap[k]);

  const barChartData = {
    labels,
    datasets: [
      {
        label: 'Numero Totale Serie',
        data: setsData,
        backgroundColor: '#10b981',
        borderRadius: 6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(18, 21, 30, 0.95)',
        titleColor: '#fff',
        bodyColor: '#34d399',
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b' },
      },
    },
  };

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
          Distribuzione Volume per Gruppo Muscolare
        </h3>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
          Numero di serie allenanti completate per singolo distretto
        </p>
      </div>

      <div style={{ height: 240, width: '100%' }}>
        {muscleKeys.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Nessuna serie registrata.
          </div>
        ) : (
          <Bar data={barChartData} options={barChartOptions} />
        )}
      </div>
    </div>
  );
};
