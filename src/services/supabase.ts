import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Routine,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../types/workout';
import type { UserAccountRecord } from '../types/auth';

export interface SupabaseSyncData {
  user_id: string;
  email?: string;
  name?: string;
  settings?: UserProfileSettings;
  routines?: Routine[];
  sessions?: WorkoutSession[];
  prs?: Record<string, PersonalRecord>;
  exercises?: Exercise[];
  updated_at?: string;
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;

  static getCredentials(): { url: string; anonKey: string } {
    let url = '';
    let anonKey = '';

    // 1. Default to global environment variables (set in .env or GitHub Secrets for all users)
    const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
    const envAnon = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

    // 2. Allow user override in localStorage if explicitly customized
    if (typeof window !== 'undefined') {
      const localUrl = localStorage.getItem('utrain_supabase_url');
      const localKey = localStorage.getItem('utrain_supabase_anon_key');
      if (localUrl && localKey) {
        url = localUrl;
        anonKey = localKey;
      }
    }

    if (!url) url = envUrl;
    if (!anonKey) anonKey = envAnon;

    return { url: url.trim(), anonKey: anonKey.trim() };
  }

  static saveCredentials(url: string, anonKey: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('utrain_supabase_url', url.trim());
      localStorage.setItem('utrain_supabase_anon_key', anonKey.trim());
    }
    this.client = null; // Reset cached client instance
  }

  static isConfigured(): boolean {
    const { url, anonKey } = this.getCredentials();
    return Boolean(url && anonKey && url.startsWith('https://'));
  }

  static getClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const { url, anonKey } = this.getCredentials();
    if (!url || !anonKey) return null;

    try {
      this.client = createClient(url, anonKey, {
        auth: {
          persistSession: false,
        },
      });
      return this.client;
    } catch (e) {
      console.error('[Supabase] Errore inizializzazione client:', e);
      return null;
    }
  }

  /**
   * Test di connessione al database Supabase e verifica stato tabelle
   */
  static async checkConnection(): Promise<{
    connected: boolean;
    accountsTableReady: boolean;
    syncTableReady: boolean;
    message: string;
    projectUrl?: string;
  }> {
    const client = this.getClient();
    const { url } = this.getCredentials();

    if (!client) {
      return {
        connected: false,
        accountsTableReady: false,
        syncTableReady: false,
        message: 'Credenziali Supabase non inserite (URL o Anon Key mancanti).',
      };
    }

    try {
      // 1. Verifica tabella utrain_sync
      let syncTableReady = false;
      try {
        const { error: syncErr } = await client.from('utrain_sync').select('user_id').limit(1);
        syncTableReady = !syncErr;
      } catch {
        syncTableReady = false;
      }

      // 2. Verifica tabella utrain_accounts
      let accountsTableReady = false;
      try {
        const { error: accErr } = await client.from('utrain_accounts').select('id').limit(1);
        accountsTableReady = !accErr;
      } catch {
        accountsTableReady = false;
      }

      if (!syncTableReady && !accountsTableReady) {
        return {
          connected: true,
          accountsTableReady: false,
          syncTableReady: false,
          message: 'Connesso a Supabase, ma le tabelle SQL non esistono ancora. Clicca "Copia Script SQL" ed eseguilo in Supabase SQL Editor.',
          projectUrl: url,
        };
      }

      if (!accountsTableReady) {
        return {
          connected: true,
          accountsTableReady: false,
          syncTableReady: true,
          message: 'Tabella dati "utrain_sync" attiva! Esegui lo script SQL aggiornato per creare anche "utrain_accounts" per login multi-dispositivo.',
          projectUrl: url,
        };
      }

      return {
        connected: true,
        accountsTableReady: true,
        syncTableReady: true,
        message: 'Database Supabase Cloud attivo e tabelle pronte (sincronizzazione automatica attiva)!',
        projectUrl: url,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
        accountsTableReady: false,
        syncTableReady: false,
        message: `Impossibile raggiungere Supabase: ${msg}`,
        projectUrl: url,
      };
    }
  }

  /**
   * Sincronizzazione in upload (invia dati locali a Supabase)
   */
  static async uploadData(data: SupabaseSyncData): Promise<{ success: boolean; message: string }> {
    const client = this.getClient();
    if (!client) {
      return { success: false, message: 'Supabase non configurato.' };
    }

    try {
      const payload = {
        user_id: data.user_id,
        email: data.email || 'atleta@utrain.app',
        name: data.name || 'Atleta',
        settings: data.settings || {},
        routines: data.routines || [],
        sessions: data.sessions || [],
        prs: data.prs || {},
        exercises: data.exercises || [],
        updated_at: new Date().toISOString(),
      };

      const { error } = await client
        .from('utrain_sync')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        return { success: false, message: `Errore salvataggio Supabase: ${error.message}` };
      }

      return { success: true, message: 'Dati sincronizzati con successo su Supabase Cloud!' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, message: `Errore di rete Supabase: ${msg}` };
    }
  }

  /**
   * Sincronizzazione in download (scarica dati dal cloud Supabase)
   */
  static async downloadData(userId: string): Promise<SupabaseSyncData | null> {
    const client = this.getClient();
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('utrain_sync')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return data as SupabaseSyncData;
    } catch {
      return null;
    }
  }

  /**
   * Salva o aggiorna un account utente su Supabase Cloud (con doppio canale utrain_accounts + backup utrain_sync)
   */
  static async saveAccount(account: UserAccountRecord): Promise<{ success: boolean; message?: string }> {
    const client = this.getClient();
    if (!client) return { success: false, message: 'Supabase non configurato.' };

    const cleanEmail = account.email.toLowerCase().trim();

    // 1. Canale Primario: utrain_accounts
    try {
      const payload = {
        id: account.id,
        email: cleanEmail,
        name: account.name,
        password_hash: account.passwordHash,
        password_salt: account.passwordSalt,
        experience_level: account.experienceLevel || 'intermediate',
        avatar_color: account.avatarColor,
        created_at: account.createdAt,
        last_login: account.lastLogin || new Date().toISOString(),
      };

      await client
        .from('utrain_accounts')
        .upsert(payload, { onConflict: 'email' });
    } catch (err) {
      console.warn('[Supabase] Salvataggio utrain_accounts (tentativo 1):', err);
    }

    // 2. Canale Backup di Sicurezza: salva account anche in utrain_sync per garantire il recupero se utrain_accounts manca
    try {
      const { data: existingSync } = await client
        .from('utrain_sync')
        .select('settings')
        .eq('user_id', account.id)
        .maybeSingle();

      const currentSettings = (existingSync?.settings && typeof existingSync.settings === 'object') ? existingSync.settings : {};
      const mergedSettings = {
        ...currentSettings,
        _accountRecord: account,
      };

      await client
        .from('utrain_sync')
        .upsert({
          user_id: account.id,
          email: cleanEmail,
          name: account.name,
          settings: mergedSettings,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('[Supabase] Salvataggio backup utrain_sync:', err);
    }

    return { success: true };
  }

  /**
   * Recupera un account utente da Supabase Cloud per email (cerca in utrain_accounts e in fallback su utrain_sync)
   */
  static async fetchAccountByEmail(email: string): Promise<UserAccountRecord | null> {
    const client = this.getClient();
    if (!client) return null;

    const cleanEmail = email.toLowerCase().trim();

    // 1. Tentativo su tabella utrain_accounts
    try {
      const { data, error } = await client
        .from('utrain_accounts')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!error && data && data.password_hash) {
        return {
          id: data.id,
          email: data.email,
          name: data.name,
          experienceLevel: data.experience_level || 'intermediate',
          avatarColor: data.avatar_color,
          createdAt: data.created_at || new Date().toISOString(),
          lastLogin: data.last_login || new Date().toISOString(),
          passwordHash: data.password_hash,
          passwordSalt: data.password_salt,
        };
      }
    } catch (err) {
      console.warn('[Supabase] Query utrain_accounts warning:', err);
    }

    // 2. Fallback di emergenza: cerca su tabella utrain_sync
    try {
      const { data: syncData, error: syncError } = await client
        .from('utrain_sync')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!syncError && syncData && syncData.settings && typeof syncData.settings === 'object') {
        const stored = (syncData.settings as Record<string, unknown>)._accountRecord as UserAccountRecord | undefined;
        if (stored && stored.passwordHash) {
          return stored;
        }
      }
    } catch (err) {
      console.warn('[Supabase] Query fallback utrain_sync warning:', err);
    }

    return null;
  }

  /**
   * Sincronizza una lista di account locali verso Supabase Cloud
   */
  static async syncAllAccounts(accounts: UserAccountRecord[]): Promise<void> {
    const client = this.getClient();
    if (!client || !accounts.length) return;

    for (const acc of accounts) {
      if (acc.email && acc.passwordHash) {
        await this.saveAccount(acc);
      }
    }
  }

  /**
   * Script SQL per creare le tabelle in Supabase SQL Editor in 1 click
   */
  static getSetupSQL(): string {
    return `-- ==========================================================
-- SCRIPT SQL UTRAIN PER SUPABASE (Copia ed Esegui in SQL Editor)
-- ==========================================================

-- 1. Tabella account utenti per sincronizzazione login multi-dispositivo
CREATE TABLE IF NOT EXISTS public.utrain_accounts (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    experience_level TEXT DEFAULT 'intermediate',
    avatar_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ DEFAULT NOW()
);

-- Disabilita RLS per consentire l'accesso con anon key
ALTER TABLE public.utrain_accounts DISABLE ROW LEVEL SECURITY;

-- 2. Tabella dati atleta (schede di allenamento, sessioni, PR, impostazioni)
CREATE TABLE IF NOT EXISTS public.utrain_sync (
    user_id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    routines JSONB DEFAULT '[]'::jsonb,
    sessions JSONB DEFAULT '[]'::jsonb,
    prs JSONB DEFAULT '{}'::jsonb,
    exercises JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disabilita RLS per consentire l'accesso con anon key
ALTER TABLE public.utrain_sync DISABLE ROW LEVEL SECURITY;
`;
  }
}
