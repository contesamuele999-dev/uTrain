import React, { useState } from 'react';
import {
  X,
  Lock,
  LogOut,
  Save,
  CheckCircle2,
  AlertCircle,
  Shield,
  Calendar,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import type { User } from '../../types/auth';
import { formatDateIt } from '../../utils/calculations';

interface UserProfileModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  user,
  onClose,
  onLogout,
  onUserUpdated,
}) => {
  const [name, setName] = useState<string>(user.name);
  const [experienceLevel, setExperienceLevel] = useState<User['experienceLevel']>(user.experienceLevel);

  // Change password states
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = AuthService.updateUserProfile({
      name: name.trim() || user.name,
      experienceLevel,
    });
    if (updated) {
      onUserUpdated(updated);
      setStatusMessage({ type: 'success', text: 'Profilo salvato con successo!' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Le nuove password non coincidono.' });
      return;
    }

    const res = await AuthService.changePassword(oldPassword, newPassword);
    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPass(false);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'UT';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              background: user.avatarColor || 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
              color: '#fff',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)',
            }}>
              {initials}
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                {user.name}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                {user.email} {user.isGuest ? '• (Account Ospite)' : ''}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {statusMessage && (
            <div style={{
              background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: statusMessage.type === 'success' ? '#34d399' : '#fca5a5',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {statusMessage.text}
            </div>
          )}

          {/* Account Meta */}
          <div style={{
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Shield size={14} color="var(--accent-primary)" />
              Livello: <strong style={{ color: '#fff' }}>{user.experienceLevel.toUpperCase()}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={14} /> Iscritto il: {formatDateIt(user.createdAt)}
            </span>
          </div>

          {/* Edit Info Form */}
          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#fff' }}>
              Dati Personali
            </h4>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Nome visualizzato:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Il tuo nome"
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Livello di allenamento:
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as User['experienceLevel'])}
              >
                <option value="beginner">Principiante (&lt; 1 anno)</option>
                <option value="intermediate">Intermedio (1 - 3 anni)</option>
                <option value="advanced">Avanzato (&gt; 3 anni)</option>
              </select>
            </div>

            <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '8px 14px', fontSize: '0.82rem' }}>
              <Save size={15} /> Aggiorna Profilo
            </button>
          </form>

          {/* Change Password Section */}
          {!user.isGuest && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  Sicurezza Password
                </h4>
                <button
                  type="button"
                  onClick={() => setIsChangingPass(!isChangingPass)}
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', padding: '2px 6px' }}
                >
                  {isChangingPass ? 'Nascondi' : 'Cambia Password'}
                </button>
              </div>

              {isChangingPass && (
                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type="password"
                    required
                    placeholder="Password attuale"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Nuova password (min 6 caratteri)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Conferma nuova password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem', alignSelf: 'flex-start' }}>
                    <Lock size={15} /> Salva Nuova Password
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)',
        }}>
          <button
            onClick={onLogout}
            className="btn-ghost"
            style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LogOut size={16} /> Disconnetti Account
          </button>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
