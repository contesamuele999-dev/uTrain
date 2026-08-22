import React, { useState, useEffect } from 'react';
import {
  Key,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
  Eye,
  EyeOff,
  Flame,
  RefreshCw,
  Server,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { ApiClient } from '../../services/apiClient';
import type { HealthCheckResponse } from '../../services/apiClient';
import { GeminiService } from '../../services/gemini';
import { AI_CONFIG } from '../../config/aiConfig';
import type { UserProfileSettings } from '../../types/workout';

interface SettingsViewProps {
  settings: UserProfileSettings;
  onUpdateSettings: (newSettings: Partial<UserProfileSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(settings.geminiApiKey || '');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  const [userName, setUserName] = useState<string>(settings.userName || 'Atleta');
  const [experienceLevel, setExperienceLevel] = useState<UserProfileSettings['experienceLevel']>(
    settings.experienceLevel || 'intermediate'
  );
  const [geminiModel, setGeminiModel] = useState<string>(
    settings.geminiModel || AI_CONFIG.DEFAULT_MODEL
  );

  const [importStatus, setImportStatus] = useState<string | null>(null);

  // MongoDB & Cloud Sync State
  const [dbHealth, setDbHealth] = useState<HealthCheckResponse | null>(null);
  const [isCheckingDb, setIsCheckingDb] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const checkDatabaseStatus = async () => {
    setIsCheckingDb(true);
    const health = await ApiClient.checkHealth();
    setDbHealth(health);
    setIsCheckingDb(false);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    const res = await StorageService.syncWithCloud();
    setSyncFeedback(res);
    setIsSyncing(false);
    await checkDatabaseStatus();
  };

  const handleSaveProfile = () => {
    onUpdateSettings({
      userName: userName.trim() || 'Atleta',
      experienceLevel,
      geminiApiKey: apiKeyInput.trim(),
      geminiModel,
    });
    alert('Impostazioni salvate con successo!');
  };

  const handleTestKey = async () => {
    const keyToTest = apiKeyInput.trim() || GeminiService.getApiKey();
    if (!keyToTest) {
      setTestStatus({ loading: false, success: false, message: 'Nessuna chiave configurata da verificare.' });
      return;
    }

    setTestStatus({ loading: true });
    const result = await GeminiService.testApiKey(keyToTest);
    setTestStatus({ loading: false, success: result.success, message: result.message });
  };

  const handleExportBackup = () => {
    const jsonStr = StorageService.exportFullBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `uTrain_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = StorageService.importBackupJSON(content);
        setImportStatus(res.message);
        if (res.success) {
          setTimeout(() => window.location.reload(), 1200);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemoData = () => {
    if (confirm('Vuoi caricare i dati demo con 4 sessioni complete e 3 record personali per testare grafici e statistiche?')) {
      StorageService.loadDemoData();
      alert('Dati dimostrativi caricati! Vai nella sezione Grafici o Dashboard per vederli.');
    }
  };

  const handleResetDefaults = () => {
    if (confirm('ATTENZIONE: Questa azione cancellerà tutte le schede, le sessioni e i record registrati, ripristinando l\'app allo stato iniziale. Vuoi procedere?')) {
      StorageService.resetToFactoryDefaults();
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Impostazioni
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          Profilo atleta, modello Gemini AI e backup
        </p>
      </div>

      {/* Profile Settings */}
      <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
          Profilo Atleta
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
              Nome / Nickname:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Il tuo nome"
              style={{ fontSize: '0.86rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
              Livello Esperienza:
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as UserProfileSettings['experienceLevel'])}
              style={{ fontSize: '0.86rem' }}
            >
              <option value="beginner">Principiante (&lt; 1 anno)</option>
              <option value="intermediate">Intermedio (1 - 3 anni)</option>
              <option value="advanced">Avanzato (&gt; 3 anni)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Google Gemini AI Status */}
      <div
        className="glass-card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: '1px solid rgba(139, 92, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(18, 21, 30, 0.9) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Key size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Google Gemini AI
              </h3>
              <span className="chip chip-green" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                <Flame size={10} /> Attivo per tutti
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestKey}
            disabled={testStatus?.loading}
            className="btn-ai"
            style={{ padding: '5px 10px', fontSize: '0.76rem' }}
          >
            {testStatus?.loading ? 'Verifica...' : 'Test AI'}
          </button>
        </div>

        {/* Info Card */}
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 10px',
          fontSize: '0.76rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={14} /> AI Coach & Generatore Schede attivi
          </div>
          <div>La chiave API globale è configurata nel sistema: non serve inserire nulla.</div>
        </div>

        {/* Test Status Feedback */}
        {testStatus && !testStatus.loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.78rem',
            color: testStatus.success ? '#34d399' : '#f87171',
            background: testStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${testStatus.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          }}>
            {testStatus.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {testStatus.message}
          </div>
        )}

        {/* Model selection & Optional Override */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>
              Modello AI:
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>
              Chiave Custom Opzionale:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Lascia vuoto per chiave globale"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ paddingRight: 32, fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="btn-ghost"
                style={{ position: 'absolute', right: 2, top: 2, padding: 4 }}
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSaveProfile} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '7px 12px', fontSize: '0.8rem' }}>
          Salva Configurazione
        </button>
      </div>

      {/* MongoDB Database & Cloud Sync */}
      <div
        className="glass-card"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: dbHealth?.database === 'connected' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
          background: dbHealth?.database === 'connected'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(18, 21, 30, 0.95) 100%)'
            : 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              background: dbHealth?.database === 'connected'
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #64748b, #475569)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Server size={17} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Database MongoDB
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                {isCheckingDb ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Verifica connessione in corso...</span>
                ) : dbHealth?.database === 'connected' ? (
                  <span className="chip chip-green" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    <CheckCircle2 size={11} /> Connesso ({dbHealth.databaseUri})
                  </span>
                ) : (
                  <span className="chip" style={{ fontSize: '0.68rem', padding: '2px 8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <AlertCircle size={11} /> Modalità Offline (Cache Locale)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSyncCloud}
              disabled={isSyncing}
              className="btn-primary"
              style={{
                padding: '6px 12px',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: dbHealth?.database === 'connected' ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
              }}
            >
              <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Sincronizzazione...' : 'Sincronizza con MongoDB'}
            </button>
            <button
              type="button"
              onClick={checkDatabaseStatus}
              disabled={isCheckingDb}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              title="Ricontrolla stato"
            >
              Verifica
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: syncFeedback.success ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: syncFeedback.success ? 'var(--accent-success)' : 'var(--accent-danger)',
              border: `1px solid ${syncFeedback.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            }}
          >
            {syncFeedback.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            <span>{syncFeedback.message}</span>
          </div>
        )}

        <div style={{
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}>
          <div><strong>Configurazione MongoDB:</strong></div>
          <div>• Per connettere un cluster <strong>MongoDB Atlas (Cloud)</strong> o un'istanza locale, apri il file <code>.env</code> nella cartella del progetto e imposta <code>MONGODB_URI=mongodb+srv://...</code></div>
          <div>• L'applicazione funziona in modalità <strong>ibrida offline-first</strong>: salva sempre all'istante sul dispositivo e sincronizza sul cloud quando il server è attivo.</div>
        </div>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Database size={17} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Dati & Backup
          </h3>
        </div>

        <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
          I tuoi dati sono conservati sul tuo dispositivo in modo privato.
        </p>

        {importStatus && (
          <div style={{ padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--accent-primary)' }}>
            {importStatus}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button onClick={handleLoadDemoData} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <Sparkles size={14} color="#fbbf24" /> Dati Demo
          </button>

          <button onClick={handleExportBackup} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <Download size={14} /> Esporta Backup
          </button>

          <label className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Upload size={14} /> Importa Backup
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={handleResetDefaults}
            className="btn-ghost"
            style={{ color: 'var(--accent-danger)', padding: '6px 10px', fontSize: '0.78rem' }}
          >
            <RotateCcw size={14} /> Reset Dati
          </button>
        </div>
      </div>
    </div>
  );
};
