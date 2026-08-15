import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  LineChart,
  BookOpen,
  History,
  Settings,
} from 'lucide-react';

export type TabType = 'dashboard' | 'routines' | 'history' | 'analytics' | 'exercises' | 'settings';

interface NavbarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const tabs: Array<{ id: TabType; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
    { id: 'routines', label: 'Schede', icon: <CalendarDays size={20} /> },
    { id: 'history', label: 'Storico', icon: <History size={20} /> },
    { id: 'analytics', label: 'Grafici', icon: <LineChart size={20} /> },
    { id: 'exercises', label: 'Esercizi', icon: <BookOpen size={20} /> },
    { id: 'settings', label: 'Setup', icon: <Settings size={20} /> },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(14, 17, 24, 0.95)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-subtle)',
      zIndex: 50,
      padding: '8px 12px 14px',
    }}>
      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              <div style={{
                transform: isActive ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 0.2s ease',
              }}>
                {tab.icon}
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
              }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  width: 24,
                  height: 3,
                  background: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 0 8px var(--accent-primary)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
