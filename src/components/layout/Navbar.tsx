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
    { id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> },
    { id: 'routines', label: 'Schede', icon: <CalendarDays size={18} /> },
    { id: 'history', label: 'Storico', icon: <History size={18} /> },
    { id: 'analytics', label: 'Grafici', icon: <LineChart size={18} /> },
    { id: 'exercises', label: 'Libreria', icon: <BookOpen size={18} /> },
    { id: 'settings', label: 'Setup', icon: <Settings size={18} /> },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'rgba(12, 15, 22, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '1px solid var(--border-subtle)',
      zIndex: 50,
      padding: '4px 6px calc(6px + env(safe-area-inset-bottom, 0px))',
      width: '100%',
    }}>
      <div style={{
        maxWidth: 540,
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
                justifyContent: 'center',
                gap: 2,
                cursor: 'pointer',
                padding: '4px 6px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 0.15s ease',
                position: 'relative',
                flex: 1,
                minWidth: 0,
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}>
                {tab.icon}
              </div>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  top: -4,
                  width: 20,
                  height: 2.5,
                  background: 'var(--accent-primary)',
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 0 6px var(--accent-primary)',
                }} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
