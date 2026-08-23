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
  Loader2,
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
      const res = await AuthService.login({ email: email.trim(), password });
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
        name: name.trim(),
        email: email.trim(),
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
      const res = await AuthService.resetPassword(email.trim());
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
      } else {
        setErrorMessage(res.message || 'Impossibile accedere con account demo.');
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
      background: 'rgba(5, 7, 10, 0.92)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '16px 12px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      minHeight: '100dvh',
    }}>
      <div
        className="glass-card glow-card"
        style={{
          width: '100%',
          maxWidth: 460,
          margin: 'auto 0',
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
          padding: '20px 18px 14px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(18, 21, 30, 0.95) 100%)',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          }}>
            <Dumbbell size={26} color="#fff" strokeWidth={2.5} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            uTrain Account
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            {activeTab === 'login' && 'Accedi per sincronizzare schede, carichi e massimali su PC e Telefono'}
            {activeTab === 'register' && 'Crea il tuo profilo atleta personale (funziona su qualsiasi dispositivo)'}
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
              minHeight: 44,
              background: activeTab === 'login' ? 'var(--bg-input)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'login' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'login' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
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
              minHeight: 44,
              background: activeTab === 'register' ? 'var(--bg-input)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'register' ? '#fff' : 'var(--text-muted)',
              fontWeight: activeTab === 'register' ? 700 : 500,
              fontSize: '0.88rem',
              cursor: 'pointer',
              touchAction: 'manipulation',
            }}
          >
            Registrati
          </button>
        </div>

        {/* Form Container */}
        <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              color: '#fca5a5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.35,
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.35,
            }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <div>{successMessage}</div>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    autoComplete="email"
                    style={{ paddingLeft: 38, minHeight: 42, fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="current-password"
                    style={{ paddingLeft: 38, paddingRight: 40, minHeight: 42, fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-ghost"
                    style={{ position: 'absolute', right: 4, top: 4, minHeight: 34, minWidth: 34, padding: 6 }}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ padding: '12px', minHeight: 46, marginTop: 4, fontSize: '0.92rem', touchAction: 'manipulation' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Accesso in corso...
                  </>
                ) : (
                  <>
                    Accedi ad uTrain <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
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
                    autoCapitalize="words"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="name"
                    style={{ paddingLeft: 38, minHeight: 42, fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    autoComplete="email"
                    style={{ paddingLeft: 38, minHeight: 42, fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="new-password"
                    style={{ paddingLeft: 38, paddingRight: 40, minHeight: 42, fontSize: '0.9rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-ghost"
                    style={{ position: 'absolute', right: 4, top: 4, minHeight: 34, minWidth: 34, padding: 6 }}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Livello di Allenamento:
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                  style={{ minHeight: 42, fontSize: '0.88rem' }}
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
                style={{ padding: '12px', minHeight: 46, marginTop: 4, fontSize: '0.92rem', touchAction: 'manipulation' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Creazione in corso...
                  </>
                ) : (
                  <>
                    Crea Account & Inizia <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD */}
          {activeTab === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
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
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    inputMode="email"
                    autoComplete="email"
                    style={{ paddingLeft: 38, minHeight: 42, fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                style={{ padding: '12px', minHeight: 46, touchAction: 'manipulation' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generazione...
                  </>
                ) : (
                  <>
                    <KeyRound size={18} /> Genera Nuova Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('login'); resetMessages(); }}
                className="btn-ghost"
                style={{ fontSize: '0.82rem', minHeight: 40, touchAction: 'manipulation' }}
              >
                ← Torna al Login
              </button>
            </form>
          )}

          {/* Quick Access Actions */}
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={isLoading}
                className="btn-secondary"
                style={{ flex: 1, fontSize: '0.78rem', padding: '10px 8px', minHeight: 42, touchAction: 'manipulation' }}
                title="Accedi subito con account demo precompilato (demo@utrain.app)"
              >
                <Sparkles size={14} color="#fbbf24" /> Account Demo (1 Tap)
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="btn-ghost"
                style={{ flex: 1, fontSize: '0.78rem', padding: '10px 8px', minHeight: 42, border: '1px solid var(--border-subtle)', touchAction: 'manipulation' }}
              >
                <ShieldCheck size={14} /> Entra come Ospite
              </button>
            </div>

            {canClose && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, minHeight: 38, touchAction: 'manipulation' }}
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

