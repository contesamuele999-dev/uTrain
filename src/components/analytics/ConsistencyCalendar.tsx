import React from 'react';
import { Calendar } from 'lucide-react';
import type { WorkoutSession } from '../../types/workout';

interface ConsistencyCalendarProps {
  sessions: WorkoutSession[];
}

export const ConsistencyCalendar: React.FC<ConsistencyCalendarProps> = ({ sessions }) => {
  // Generate last 35 days (5 weeks grid)
  const today = new Date();
  const days: Array<{ dateStr: string; dayNum: number; count: number; volume: number }> = [];

  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];

    const daySessions = sessions.filter((s) => s.startTime.startsWith(dateKey));
    const dayVolume = daySessions.reduce((acc, s) => acc + (s.totalVolumeKg || 0), 0);

    days.push({
      dateStr: dateKey,
      dayNum: d.getDate(),
      count: daySessions.length,
      volume: dayVolume,
    });
  }

  const activeDaysCount = days.filter((d) => d.count > 0).length;

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={18} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Costanza & Frequenza (Ultimi 35 Giorni)
          </h3>
        </div>
        <span className="chip chip-green" style={{ fontSize: '0.74rem' }}>
          {activeDaysCount} giorni attivi
        </span>
      </div>

      {/* Grid of days */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 6,
      }}>
        {days.map((day) => {
          const isToday = day.dateStr === today.toISOString().split('T')[0];
          const hasWorkout = day.count > 0;

          return (
            <div
              key={day.dateStr}
              title={`${day.dateStr}: ${day.count} allenamenti (${day.volume}kg)`}
              style={{
                aspectRatio: '1',
                borderRadius: 'var(--radius-sm)',
                background: hasWorkout
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'var(--bg-input)',
                border: isToday ? '2px solid #fff' : '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: hasWorkout ? '#000' : 'var(--text-muted)',
                fontWeight: hasWorkout || isToday ? 800 : 500,
                fontSize: '0.78rem',
                boxShadow: hasWorkout ? '0 0 10px rgba(16, 185, 129, 0.3)' : 'none',
                cursor: 'default',
              }}
            >
              <span>{day.dayNum}</span>
              {hasWorkout && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#000', marginTop: 2 }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
