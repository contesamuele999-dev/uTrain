import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  Routine,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../types/workout';

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
   * Test di connessione al database Supabase
   */
  static async checkConnection(): Promise<{ connected: boolean; message: string; projectUrl?: string }> {
    const client = this.getClient();
    const { url } = this.getCredentials();

    if (!client) {
      return {
        connected: false,
        message: 'Credenziali Supabase non configurate (URL o Anon Key mancanti).',
      };
    }

    try {
      // Test query on utrain_sync table
      const { error } = await client
        .from('utrain_sync')
        .select('user_id')
        .limit(1);

      if (error) {
        if (error.code === '42P01' || error.message.includes('relation "public.utrain_sync" does not exist')) {
          return {
            connected: false,
            message: 'Connesso a Supabase, ma la tabella "utrain_sync" non esiste ancora. Esegui lo script SQL fornito.',
            projectUrl: url,
          };
        }
        return {
          connected: false,
          message: `Errore Supabase: ${error.message}`,
          projectUrl: url,
        };
      }

      return {
        connected: true,
        message: 'Connessione a Supabase Cloud attiva e funzionante!',
        projectUrl: url,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        connected: false,
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
   * Script SQL per creare la tabella in Supabase SQL Editor in 1 click
   */
  static getSetupSQL(): string {
    return `-- Crea tabella di sincronizzazione per uTrain
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
