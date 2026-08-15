import React, { useState } from 'react';
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
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { GeminiService } from '../../services/gemini';
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
  const [geminiModel, setGeminiModel] = useState<UserProfileSettings['geminiModel']>(
    settings.geminiModel || 'gemini-1.5-flash'
  );

  const [importStatus, setImportStatus] = useState<string | null>(null);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Impostazioni & Configurazione
        </h1>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
          Gestisci il tuo profilo atleta, il modello AI e il backup dei dati
        </p>
      </div>

      {/* Profile Settings */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
          Profilo Atleta
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Nome / Nickname:
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Il tuo nome"
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Livello di Esperienza:
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as UserProfileSettings['experienceLevel'])}
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
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          border: '1px solid rgba(139, 92, 246, 0.4)',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(18, 21, 30, 0.9) 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Key size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Motore Google Gemini AI (Integrato & Gratuito)
              </h3>
              <span className="chip chip-green" style={{ fontSize: '0.72rem', marginTop: 2 }}>
                <Flame size={12} /> Attivo & Pronto all&apos;uso per tutti gli utenti
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestKey}
            disabled={testStatus?.loading}
            className="btn-ai"
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            {testStatus?.loading ? 'Verifica connessione...' : 'Test Connessione AI'}
          </button>
        </div>

        {/* Info Card */}
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={16} /> L&apos;AI Coach e il generatore di schede sono attivi e pronti per l&apos;uso.
          </div>
          <div>Non è necessario inserire nessuna chiave nel browser: il sistema utilizza automaticamente la configurazione fissa per tutti gli utenti.</div>
        </div>

        {/* Test Status Feedback */}
        {testStatus && !testStatus.loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '0.84rem',
            color: testStatus.success ? '#34d399' : '#f87171',
            background: testStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${testStatus.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          }}>
            {testStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {testStatus.message}
          </div>
        )}

        {/* Model selection & Optional Override */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Modello AI:
            </label>
            <select
              value={geminiModel}
              onChange={(e) => setGeminiModel(e.target.value as UserProfileSettings['geminiModel'])}
            >
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra Veloce & Consigliato)</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash (Nuova Generazione)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Ragionamento Avanzato)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Chiave Personalizzata Opzionale (Override):
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Lascia vuoto per usare la chiave predefinita"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                style={{ paddingRight: 40, fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="btn-ghost"
                style={{ position: 'absolute', right: 4, top: 4, padding: 6 }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSaveProfile} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
          Salva Configurazione
        </button>
      </div>

      {/* Data Management & Backup */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={20} color="var(--accent-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
            Gestione Dati & Backup
          </h3>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
          I tuoi dati sono conservati al 100% sul tuo dispositivo in modo privato. Puoi scaricare un backup o ripristinarlo in qualsiasi momento.
        </p>

        {importStatus && (
          <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem', color: 'var(--accent-primary)' }}>
            {importStatus}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={handleLoadDemoData} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Sparkles size={16} color="#fbbf24" /> Carica Dati Dimostrativi (Demo)
          </button>

          <button onClick={handleExportBackup} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Download size={16} /> Esporta Backup JSON
          </button>

          <label className="btn-secondary" style={{ fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Upload size={16} /> Ripristina da Backup JSON
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
            style={{ color: 'var(--accent-danger)', fontSize: '0.85rem' }}
          >
            <RotateCcw size={16} /> Ripristina Dati di Fabbrica
          </button>
        </div>
      </div>
    </div>
  );
};
