import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  Star,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react';
import type { WorkoutSession } from '../../types/workout';
import { GeminiService } from '../../services/gemini';
import { StorageService } from '../../services/storage';
import { formatDuration } from '../../utils/calculations';

interface WorkoutSummaryModalProps {
  session: WorkoutSession;
  onSaveAndClose: (finalSession: WorkoutSession) => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  onSaveAndClose,
}) => {
  const [rating, setRating] = useState<number>(session.rating || 5);
  const [notes, setNotes] = useState<string>(session.notes || '');
  const [aiFeedback, setAiFeedback] = useState<string>(session.aiFeedback || '');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  const hasPRs = session.prsAchieved && session.prsAchieved.length > 0;

  useEffect(() => {
    // Launch celebratory confetti if PRs were broken!
    if (hasPRs) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#fbbf24', '#8b5cf6', '#3b82f6'],
        });
      } catch {}
    }
  }, [hasPRs]);

  const handleRequestAIFeedback = async () => {
    const settings = StorageService.getSettings();
    if (!settings.geminiApiKey) {
      setAiFeedback('Configura la tua chiave API Google Gemini nelle impostazioni per sbloccare l\'analisi sessione dell\'AI.');
      return;
    }

    setIsAiLoading(true);
    try {
      const summaryContext = `Sessione: ${session.routineTitle || 'Allenamento'}. Durata: ${formatDuration(session.durationSeconds)}. Volume totale: ${session.totalVolumeKg}kg in ${session.totalSets} serie completate. PR raggiunti: ${session.prsAchieved?.map((p) => `${p.exerciseName}: ${p.value}`).join(', ') || 'Nessuno'}. Note atleta: ${notes}`;
      
      const feedback = await GeminiService.chatWithCoach(
        [{ role: 'user', text: `Ho appena completato questo allenamento: ${summaryContext}. Dammi un'analisi rapida del lavoro svolto, congratulazioni e 1 consiglio pratico per il recupero di oggi.` }],
        summaryContext
      );
      setAiFeedback(feedback);
    } catch {
      setAiFeedback('Ottimo lavoro per aver portato a termine la sessione! Ricordati di assumere 25-30g di proteine e idratarti abbondantemente.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFinalSave = () => {
    const updated: WorkoutSession = {
      ...session,
      rating,
      notes: notes.trim() || undefined,
      aiFeedback: aiFeedback.trim() || undefined,
    };
    onSaveAndClose(updated);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 10, 0.9)',
      backdropFilter: 'blur(16px)',
      zIndex: 120,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        className="glass-card glow-card"
        style={{
          width: '100%',
          maxWidth: 580,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(18, 21, 30, 0.95) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 24px rgba(16, 185, 129, 0.4)',
          }}>
            <CheckCircle2 size={32} color="#fff" />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Sessione Completata! 🔥
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {session.routineTitle} {session.dayName ? `• ${session.dayName}` : ''}
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Key Metrics grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                <Dumbbell size={14} /> Volume
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                {session.totalVolumeKg} <span style={{ fontSize: '0.8rem' }}>kg</span>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                <Clock size={14} /> Durata
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                {formatDuration(session.durationSeconds)}
              </div>
            </div>

            <div style={{
              background: 'var(--bg-input)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px',
              textAlign: 'center',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                <Flame size={14} /> Serie
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {session.totalSets}
              </div>
            </div>
          </div>

          {/* PRs achieved callout */}
          {hasPRs && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(18, 21, 30, 0.8) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={18} color="#fbbf24" />
                <strong style={{ color: '#fef3c7', fontSize: '0.92rem' }}>
                  {session.prsAchieved!.length} Nuovi Record Personali (PR)!
                </strong>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {session.prsAchieved!.map((pr, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: '#fff' }}>
                    🏆 <strong>{pr.exerciseName}</strong>: {pr.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rate Session */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              Come valuti questa sessione?
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                  }}
                >
                  <Star
                    size={28}
                    fill={star <= rating ? '#fbbf24' : 'none'}
                    color={star <= rating ? '#fbbf24' : 'var(--text-muted)'}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Note personali sulla sessione (opzionale):
            </label>
            <textarea
              rows={2}
              placeholder="Es. Buone sensazioni sul petto, leggero affaticamento alle spalle sull'ultima serie."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* AI Coach Review Module */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(18, 21, 30, 0.8) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} color="#a78bfa" />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#c4b5fd' }}>
                  AI Coach Debrief
                </span>
              </div>
              {!aiFeedback && (
                <button
                  type="button"
                  onClick={handleRequestAIFeedback}
                  disabled={isAiLoading}
                  className="btn-ai"
                  style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  {isAiLoading ? 'Analisi in corso...' : 'Analizza con Gemini'}
                </button>
              )}
            </div>

            {aiFeedback ? (
              <p style={{ fontSize: '0.85rem', color: '#f1f5f9', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {aiFeedback}
              </p>
            ) : (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Richiedi un feedback istantaneo a Gemini Coach sul volume totale e consigli di recupero per la giornata.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          background: 'var(--bg-card)',
        }}>
          <button onClick={handleFinalSave} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
            <Save size={18} /> Salva Sessione nello Storico
          </button>
        </div>
      </div>
    </div>
  );
};
