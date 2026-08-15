import React from 'react';
import { Dumbbell, Trophy, Calendar, Zap } from 'lucide-react';
import type { WorkoutSession, PersonalRecord } from '../../types/workout';

interface StatsOverviewProps {
  sessions: WorkoutSession[];
  prs: Record<string, PersonalRecord>;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ sessions, prs }) => {
  // Calcola statistiche dell'ultimo mese
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const recentSessions = sessions.filter(
    (s) => new Date(s.startTime) >= oneMonthAgo
  );

  const totalVolumeKg = sessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
  const prCount = Object.keys(prs).length;

  // Calcola la streak (settimane consecutive con almeno 1 workout o sessioni ravvicinate)
  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    const dates = new Set(sessions.map((s) => s.startTime.split('T')[0]));
    return dates.size;
  };

  const statItems = [
    {
      label: 'Sessioni Totali',
      value: sessions.length,
      subtext: `${recentSessions.length} nell'ultimo mese`,
      icon: <Calendar size={20} color="#60a5fa" />,
    },
    {
      label: 'Tonnellaggio Totale',
      value: totalVolumeKg > 1000 ? `${(totalVolumeKg / 1000).toFixed(1)} t` : `${totalVolumeKg} kg`,
      subtext: 'Volume sollevato',
      icon: <Dumbbell size={20} color="#34d399" />,
    },
    {
      label: 'Record Personali (PR)',
      value: prCount,
      subtext: 'Massimali registrati',
      icon: <Trophy size={20} color="#fbbf24" />,
    },
    {
      label: 'Giorni Attivi',
      value: calculateStreak(),
      subtext: 'Costanza di allenamento',
      icon: <Zap size={20} color="#c084fc" />,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
      gap: 12,
    }}>
      {statItems.map((stat, i) => (
        <div
          key={i}
          className="glass-card"
          style={{
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {stat.label}
            </span>
            {stat.icon}
          </div>

          <div>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {stat.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
