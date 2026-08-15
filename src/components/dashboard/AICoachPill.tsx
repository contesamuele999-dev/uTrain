import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Lightbulb } from 'lucide-react';
import { GeminiService } from '../../services/gemini';
import { StorageService } from '../../services/storage';

interface AICoachPillProps {
  onOpenCoach: () => void;
  onOpenSettings: () => void;
}

export const AICoachPill: React.FC<AICoachPillProps> = ({ onOpenCoach }) => {
  const [tip, setTip] = useState<string>('Il sovraccarico progressivo si ottiene aggiungendo carico (+2.5kg) o aumentando le ripetizioni (+1 rep) a parità di esecuzione controllata.');
  const [loading, setLoading] = useState<boolean>(false);

  const fetchTip = async () => {
    setLoading(true);
    try {
      const settings = StorageService.getSettings();
      const sessions = StorageService.getSessions();
      const lastSession = sessions.length > 0 ? sessions[0] : undefined;
      const summary = lastSession
        ? `${lastSession.routineTitle || 'Allenamento'} (${lastSession.totalVolumeKg}kg sollevati)`
        : undefined;

      const aiTip = await GeminiService.getDailyCoachTip(settings.experienceLevel, summary);
      if (aiTip) setTip(aiTip);
    } catch {
      // Keep fallback tip
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTip();
  }, []);

  return (
    <div
      className="glass-card"
      style={{
        padding: '12px 14px',
        borderLeft: '3px solid #8b5cf6',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(18, 21, 30, 0.9) 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
            flexShrink: 0,
          }}>
            <Sparkles size={12} />
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Consiglio del Coach AI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={fetchTip}
            disabled={loading}
            className="btn-ghost"
            style={{ padding: '2px 4px', borderRadius: 'var(--radius-full)' }}
            title="Aggiorna consiglio"
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={onOpenCoach}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a78bfa',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '2px 4px',
            }}
          >
            Chat Coach →
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Lightbulb size={15} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{
          fontSize: '0.82rem',
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.4,
        }}>
          {loading ? 'Generazione consiglio con Gemini...' : tip}
        </p>
      </div>
    </div>
  );
};
