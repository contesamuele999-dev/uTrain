import React from 'react';
import { Dumbbell, Trophy, Calendar, Zap } from 'lucide-react';
import type { WorkoutSession, PersonalRecord } from '../../types/workout';

interface StatsOverviewProps {
  sessions: WorkoutSession[];
  prs: Record<string, PersonalRecord>;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ sessions, prs }) => {
  const now = new Date();
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const recentSessions = sessions.filter(
    (s) => new Date(s.startTime) >= oneMonthAgo
  );

  const totalVolumeKg = sessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);
  const prCount = Object.keys(prs).length;

  const calculateStreak = () => {
    if (sessions.length === 0) return 0;
    const dates = new Set(sessions.map((s) => s.startTime.split('T')[0]));
    return dates.size;
  };

  const statItems = [
    {
      label: 'Sessioni',
      value: sessions.length,
      subtext: `${recentSessions.length} ultimo mese`,
      icon: <Calendar size={17} color="#60a5fa" />,
    },
    {
      label: 'Volume',
      value: totalVolumeKg > 1000 ? `${(totalVolumeKg / 1000).toFixed(1)} t` : `${totalVolumeKg} kg`,
      subtext: 'Tonnellaggio',
      icon: <Dumbbell size={17} color="#34d399" />,
    },
    {
      label: 'Record PR',
      value: prCount,
      subtext: 'Massimali',
      icon: <Trophy size={17} color="#fbbf24" />,
    },
    {
      label: 'Giorni Attivi',
      value: calculateStreak(),
      subtext: 'Costanza',
      icon: <Zap size={17} color="#c084fc" />,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 8,
      width: '100%',
    }}>
      {statItems.map((stat, i) => (
        <div
          key={i}
          className="glass-card"
          style={{
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 6,
            minWidth: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {stat.label}
            </span>
            {stat.icon}
          </div>

          <div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.1,
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {stat.subtext}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
