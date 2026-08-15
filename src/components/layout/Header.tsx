import React from 'react';
import { Dumbbell, Bot, Sparkles, Settings as SettingsIcon, LogIn } from 'lucide-react';
import type { User } from '../../types/auth';

interface HeaderProps {
  user: User | null;
  onOpenCoach: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenCoach,
  onOpenSettings,
  onOpenAuth,
  onOpenProfile,
}) => {
  const initials = user
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : '';

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 10, 15, 0.92)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: '8px 12px',
      width: '100%',
    }}>
      <div style={{
        maxWidth: 1080,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        {/* Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 0 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(16, 185, 129, 0.35)',
            flexShrink: 0,
          }}>
            <Dumbbell size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
            <span style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#fff',
              lineHeight: 1,
            }}>
              uTrain
            </span>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: '#fff',
              padding: '2px 5px',
              borderRadius: 'var(--radius-full)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              lineHeight: 1,
            }}>
              AI
            </span>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* AI Coach Assistant Button */}
          <button
            onClick={onOpenCoach}
            className="btn-ai"
            style={{
              padding: '6px 10px',
              fontSize: '0.76rem',
              borderRadius: 'var(--radius-full)',
            }}
            title="Apri AI Coach Personale"
          >
            <Bot size={15} />
            <span className="hide-on-mobile">AI Coach</span>
            <Sparkles size={12} style={{ opacity: 0.8 }} />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
            }}
            title="Impostazioni"
          >
            <SettingsIcon size={18} />
          </button>

          {/* User Account / Profile Button */}
          {user ? (
            <button
              onClick={onOpenProfile}
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                background: user.avatarColor || 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.25)',
                flexShrink: 0,
              }}
              title={`Account: ${user.name}`}
            >
              {initials}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.76rem', borderRadius: 'var(--radius-full)' }}
            >
              <LogIn size={13} /> Accedi
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
