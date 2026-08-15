import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Flame, Lightbulb, AlertCircle } from 'lucide-react';
import { GeminiService } from '../../services/gemini';
import { StorageService } from '../../services/storage';

interface AICoachPillProps {
  onOpenCoach: () => void;
  onOpenSettings: () => void;
}

export const AICoachPill: React.FC<AICoachPillProps> = ({ onOpenCoach, onOpenSettings }) => {
  const [tip, setTip] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);

  const fetchTip = async () => {
    const settings = StorageService.getSettings();
    if (!settings.geminiApiKey) {
      setHasApiKey(false);
      setTip('Configura la tua chiave API gratuita Google Gemini nelle Impostazioni per ricevere consigli scientifici personalizzati ogni giorno.');
      return;
    }

    setHasApiKey(true);
    setLoading(true);
    try {
      const sessions = StorageService.getSessions();
      const lastSession = sessions.length > 0 ? sessions[0] : undefined;
      const summary = lastSession
        ? `${lastSession.routineTitle || 'Allenamento'} (${lastSession.totalVolumeKg}kg sollevati)`
        : undefined;

      const aiTip = await GeminiService.getDailyCoachTip(settings.experienceLevel, summary);
      setTip(aiTip);
    } catch {
      setTip('Ricorda: il sovraccarico progressivo non significa solo aggiungere peso sul bilanciere, ma anche perfezionare il controllo motorio e la profondità di ogni ripetizione.');
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
        padding: '16px 20px',
        borderLeft: '4px solid #8b5cf6',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(18, 21, 30, 0.9) 100%)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-full)',
            background: 'rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa',
          }}>
            <Sparkles size={16} />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Consiglio del Coach AI
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {hasApiKey && (
            <button
              onClick={fetchTip}
              disabled={loading}
              className="btn-ghost"
              style={{ padding: 4, borderRadius: 'var(--radius-full)' }}
              title="Genera nuovo consiglio"
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          )}
          <button
            onClick={hasApiKey ? onOpenCoach : onOpenSettings}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a78bfa',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {hasApiKey ? 'Chiedi al Coach →' : 'Configura API Key →'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {hasApiKey ? (
          <Lightbulb size={18} color="#fbbf24" style={{ flexShrink: 0, marginTop: 2 }} />
        ) : (
          <AlertCircle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
        )}
        <p style={{
          fontSize: '0.92rem',
          color: 'var(--text-primary)',
          margin: 0,
          lineHeight: 1.5,
          fontStyle: hasApiKey ? 'normal' : 'italic',
        }}>
          {loading ? 'Generazione consiglio personalizzato con Gemini...' : tip}
        </p>
      </div>

      {hasApiKey && (
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          <span className="chip chip-purple" style={{ fontSize: '0.72rem' }}>
            <Flame size={12} /> Gemini Free Tier
          </span>
          <span className="chip chip-green" style={{ fontSize: '0.72rem' }}>
            Overload Ready
          </span>
        </div>
      )}
    </div>
  );
};
