import React, { useState } from 'react';
import {
  History,
  Trash2,
  Calendar,
  Clock,
  Star,
  Trophy,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { WorkoutSession } from '../../types/workout';
import { StorageService } from '../../services/storage';
import { formatDateIt, formatDuration } from '../../utils/calculations';

interface HistoryViewProps {
  sessions: WorkoutSession[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({ sessions }) => {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(
    sessions.length > 0 ? sessions[0].id : null
  );

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Sei sicuro di voler eliminare questa sessione registrata dallo storico?')) {
      StorageService.deleteSession(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Storico Allenamenti ({sessions.length})
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          Archivio cronologico di tutte le sessioni completate
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="glass-card" style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <History size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4, color: '#fff' }}>
            Nessun allenamento completato
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Inizia il tuo primo allenamento dalla Dashboard per popolare lo storico!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;

            return (
              <div
                key={session.id}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  cursor: 'pointer',
                  width: '100%',
                }}
                onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {session.routineTitle || 'Allenamento Libero'}
                      </h2>
                      {session.prsAchieved && session.prsAchieved.length > 0 && (
                        <span className="chip chip-amber" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                          <Trophy size={10} /> {session.prsAchieved.length} PR
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Calendar size={11} /> {formatDateIt(session.startTime)}
                      {session.dayName && <span>• {session.dayName}</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                        {session.totalVolumeKg}kg
                      </div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                        <Clock size={10} /> {formatDuration(session.durationSeconds)}
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="btn-ghost"
                      style={{ color: 'var(--accent-danger)', padding: 4 }}
                      title="Elimina sessione"
                    >
                      <Trash2 size={14} />
                    </button>

                    {isExpanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Rating & Notes preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {session.rating && (
                    <div style={{ display: 'flex', gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          fill={i < session.rating! ? '#fbbf24' : 'none'}
                          color={i < session.rating! ? '#fbbf24' : 'var(--text-muted)'}
                        />
                      ))}
                    </div>
                  )}
                  {session.notes && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      &ldquo;{session.notes}&rdquo;
                    </span>
                  )}
                </div>

                {/* Expanded Details Breakdown */}
                {isExpanded && (
                  <div
                    style={{
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: 8,
                      marginTop: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* AI Feedback if present */}
                    {session.aiFeedback && (
                      <div style={{
                        background: 'rgba(139, 92, 246, 0.08)',
                        border: '1px solid rgba(139, 92, 246, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px 10px',
                        fontSize: '0.78rem',
                        color: '#f1f5f9',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#c4b5fd', fontWeight: 700, marginBottom: 2 }}>
                          <Sparkles size={12} /> AI Coach Review:
                        </div>
                        {session.aiFeedback}
                      </div>
                    )}

                    {/* Exercises breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {session.exercises.map((ex, exIdx) => {
                        const completedSets = ex.sets.filter((s) => s.completed);
                        if (completedSets.length === 0) return null;

                        return (
                          <div
                            key={ex.id || exIdx}
                            style={{
                              background: 'var(--bg-input)',
                              borderRadius: 'var(--radius-sm)',
                              padding: '8px 10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                              <span>{ex.exerciseName}</span>
                              <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)' }}>
                                {completedSets.length} serie
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {completedSets.map((s, sIdx) => (
                                <span
                                  key={s.id || sIdx}
                                  style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '2px 6px',
                                    fontSize: '0.72rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: s.isPR ? '#fbbf24' : 'var(--text-primary)',
                                    fontWeight: 700,
                                  }}
                                >
                                  {s.weight}kg × {s.reps} {s.isPR ? '🏆' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
