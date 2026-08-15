import React, { useState } from 'react';
import {
  Dumbbell,
  Lock,
  Mail,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { AuthService } from '../../services/authService';
import type { User } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onSuccess: (user: User) => void;
  onClose?: () => void;
  canClose?: boolean;
}

type AuthTab = 'login' | 'register' | 'forgot_password';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  canClose = false,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');

  // Form Fields
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      const res = await AuthService.login({ email, password });
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Credenziali non valide.');
      }
    } catch {
      setErrorMessage('Errore durante il login. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      const res = await AuthService.register({
        name,
        email,
        password,
        experienceLevel,
      });
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Errore durante la registrazione.');
      }
    } catch {
      setErrorMessage('Errore durante la creazione dell\'account. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      const res = await AuthService.resetPassword(email);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Impossibile reimpostare la password. Riprova.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    resetMessages();
    setIsLoading(true);
    try {
      const res = await AuthService.login({ email: 'demo@utrain.app', password: 'password123' });
      if (res.success && res.user) {
        onSuccess(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guest = AuthService.loginAsGuest();
    onSuccess(guest);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 10, 0.9)',
      backdropFilter: 'blur(16px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        className="glass-card glow-card"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.2)',
        }}
      >
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px 16px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(18, 21, 30, 0.95) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          }}>
            <Dumbbell size={28} color="#fff" strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            uTrain Account
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {activeTab === 'login' && 'Accedi per sincronizzare schede, carichi e massimali'}
            {activeTab === 'register' && 'Crea il tuo profilo atleta personale e gratuito'}
            {activeTab === 'forgot_password' && 'Reimposta la password del tuo account'}
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(9, 10, 15, 0.6)',
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); resetMessages(); }}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'login' ? 'var(--bg-input)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'login' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); resetMessages(); }}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'register' ? 'var(--bg-input)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'register' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
            }}
          >
            Registrati
          </button>
        </div>

        {/* Form Container */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: '#34d399',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              {successMessage}
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Email:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="email"
                    required
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Password:
                  </label>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('forgot_password'); resetMessages(); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Password dimenticata?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: 38, paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-ghost"
                    style={{ position: 'absolute', right: 4, top: 4, padding: 6 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ padding: '12px', marginTop: 4, fontSize: '0.95rem' }}
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi ad uTrain'} <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Nome o Nickname Atleta:
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="text"
                    required
                    placeholder="Es. Marco Rossi"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Email:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="email"
                    required
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Password (minimo 6 caratteri):
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: 38, paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-ghost"
                    style={{ position: 'absolute', right: 4, top: 4, padding: 6 }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Livello di Allenamento:
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                >
                  <option value="beginner">Principiante (&lt; 1 anno)</option>
                  <option value="intermediate">Intermedio (1 - 3 anni)</option>
                  <option value="advanced">Avanzato (&gt; 3 anni)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ padding: '12px', marginTop: 4, fontSize: '0.95rem' }}
              >
                {isLoading ? 'Creazione in corso...' : 'Crea Account & Inizia'} <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD */}
          {activeTab === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Inserisci l&apos;email del tuo account:
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="email"
                    required
                    placeholder="nome@esempio.it"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ padding: '12px' }}
              >
                <KeyRound size={18} /> Genera Nuova Password
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('login'); resetMessages(); }}
                className="btn-ghost"
                style={{ fontSize: '0.82rem' }}
              >
                ← Torna al Login
              </button>
            </form>
          )}

          {/* Quick Access Actions */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '8px 10px' }}
                title="Accedi subito con account demo precompilato (demo@utrain.app)"
              >
                <Sparkles size={14} color="#fbbf24" /> Account Demo (1 Tap)
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '0.78rem', padding: '8px 10px', border: '1px solid var(--border-subtle)' }}
              >
                <ShieldCheck size={14} /> Entra come Ospite
              </button>
            </div>

            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}
              >
                Chiudi
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
