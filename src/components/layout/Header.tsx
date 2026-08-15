import React from 'react';
import { Dumbbell, Bot, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { StorageService } from '../../services/storage';

interface HeaderProps {
  onOpenCoach: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCoach, onOpenSettings }) => {
  const settings = StorageService.getSettings();
  const hasGeminiKey = !!settings.geminiApiKey;

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 10, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '12px 16px',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.4)',
          }}>
            <Dumbbell size={22} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                uTrain
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 'var(--radius-full)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                AI Coach
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1 }}>
              Tracker & Progressive Overload
            </p>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* AI Coach Assistant Button */}
          <button
            onClick={onOpenCoach}
            className="btn-ai"
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-full)',
            }}
            title="Apri AI Coach Personale"
          >
            <Bot size={18} />
            <span style={{ display: 'inline' }}>AI Coach</span>
            <Sparkles size={14} style={{ opacity: 0.8 }} />
          </button>

          {/* Settings / API Key status */}
          <button
            onClick={onOpenSettings}
            className="btn-ghost"
            style={{
              padding: '8px',
              borderRadius: 'var(--radius-full)',
              position: 'relative',
            }}
            title="Impostazioni & Chiave Gemini"
          >
            <SettingsIcon size={20} />
            {!hasGeminiKey && (
              <span style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent-amber)',
                boxShadow: '0 0 6px var(--accent-amber)',
              }} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
