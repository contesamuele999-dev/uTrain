import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  WifiOff,
  Zap,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // 1. Controlla se l'app è già installata / in esecuzione come Standalone PWA
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
      return isStandaloneMode;
    };

    if (checkStandalone()) {
      return;
    }

    // 2. Rileva se il dispositivo è iOS (iPhone/iPad) in Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIosDevice);

    // 3. Gestione conteggio accessi iniziali
    const visits = parseInt(localStorage.getItem('uTrain_pwa_visits') || '0', 10) + 1;
    localStorage.setItem('uTrain_pwa_visits', visits.toString());

    const dismissedAt = localStorage.getItem('uTrain_pwa_dismissed_at');
    const dismissedCount = parseInt(localStorage.getItem('uTrain_pwa_dismissed_count') || '0', 10);

    // Se l'utente ha rifiutato meno di 3 volte e sono passate almeno 12 ore dall'ultimo rifiuto (o è il primo accesso)
    const shouldPromptOnFirstVisits = () => {
      if (dismissedCount >= 3) return false;
      if (!dismissedAt) return true; // Primo accesso mai rifiutato
      const hoursSinceDismiss = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      return hoursSinceDismiss > 12;
    };

    // 4. Ascolto evento standard di installazione PWA (Chrome / Edge / Android / Desktop)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      if (shouldPromptOnFirstVisits()) {
        // Mostra con un piccolo ritardo piacevole di 1.5 secondi
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Su iOS, mostriamo la guida se ai primi accessi
    if (isIosDevice && shouldPromptOnFirstVisits()) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    // Ascolto evento installazione completata
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setIsOpen(false);
      setDeferredPrompt(null);
      localStorage.setItem('uTrain_pwa_installed', 'true');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        localStorage.setItem('uTrain_pwa_installed', 'true');
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Errore durante installazione PWA:', err);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    const count = parseInt(localStorage.getItem('uTrain_pwa_dismissed_count') || '0', 10) + 1;
    localStorage.setItem('uTrain_pwa_dismissed_count', count.toString());
    localStorage.setItem('uTrain_pwa_dismissed_at', Date.now().toString());
  };

  // Non mostrare se già installata o non aperta
  if (isStandalone || !isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'linear-gradient(145deg, rgba(24, 24, 37, 0.95) 0%, rgba(14, 16, 23, 0.98) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Glowing Top Ambient Line */}
        <div
          style={{
            height: 3,
            width: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 50%, #8b5cf6 100%)',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="btn-ghost"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: 6,
            color: 'var(--text-muted)',
            borderRadius: 'var(--radius-full)',
          }}
          title="Chiudi"
        >
          <X size={18} />
        </button>

        <div style={{ padding: '24px 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Header with App Icon */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: '#10b981',
                padding: 2,
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src="./pwa-icon.svg"
                alt="uTrain App Logo"
                style={{ width: '100%', height: '100%', borderRadius: 14, display: 'block' }}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#34d399',
                    fontSize: '0.66rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Sparkles size={11} /> APP UFFICIALE
                </span>
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '2px 0 0 0', color: '#fff' }}>
                Scarica uTrain
              </h2>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Progressive Web App per il tuo allenamento
              </p>
            </div>
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
            Installa l&apos;applicazione sul tuo dispositivo per un accesso istantaneo, notifiche, timer a schermo intero e utilizzo <strong>100% offline in palestra</strong> senza passare dagli store!
          </p>

          {/* Benefits Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 8px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
              <Zap size={18} color="#34d399" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>Zero Attese</span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Lancio istantaneo</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
              <WifiOff size={18} color="#60a5fa" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>Offline Ready</span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Funziona sempre</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4 }}>
              <Smartphone size={18} color="#a78bfa" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>Full Screen</span>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Senza barre browser</span>
            </div>
          </div>

          {/* Install Instructions for iOS or One-Click Button for Chrome/Android */}
          {installSuccess ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid var(--accent-success)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: 'var(--accent-success)',
                fontWeight: 700,
                fontSize: '0.88rem',
              }}
            >
              <CheckCircle2 size={20} /> App Installata con Successo!
            </div>
          ) : isIOS ? (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Smartphone size={16} /> Come installare su iPhone & iPad:
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                <li>
                  Tocca il pulsante <strong>Condividi</strong> <Share size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> nella barra di Safari in basso.
                </li>
                <li>
                  Scorri e seleziona <strong>&ldquo;Aggiungi alla schermata Home&rdquo;</strong> <PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />.
                </li>
                <li>
                  Premi <strong>Aggiungi</strong> in alto a destra.
                </li>
              </ol>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.92rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
              }}
            >
              <Download size={18} /> Installa Subito (1-Click)
            </button>
          )}

          {/* Dismiss button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: '4px 8px',
                textDecoration: 'underline',
              }}
            >
              Forse più tardi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
