import { AuthService } from './authService';
import type {
  Routine,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../types/workout';

export interface HealthCheckResponse {
  status: string;
  database: 'connected' | 'disconnected';
  databaseUri: string;
  serverTime: string;
}

export interface SyncPayload {
  routines: Routine[];
  workouts: WorkoutSession[];
  exercises: Exercise[];
  prs: PersonalRecord[];
  settings?: UserProfileSettings;
}

export interface SyncPullResponse {
  routines?: Routine[];
  workouts?: WorkoutSession[];
  exercises?: Exercise[];
  prs?: PersonalRecord[];
  settings?: UserProfileSettings;
  syncedAt?: string;
}

export class ApiClient {
  static getBaseUrl(): string {
    if (typeof window !== 'undefined') {
      const customUrl = localStorage.getItem('utrain_custom_api_url');
      if (customUrl && customUrl.trim()) {
        const clean = customUrl.trim().replace(/\/+$/, '');
        return clean.endsWith('/api') ? clean : `${clean}/api`;
      }
    }

    const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_URL;
    if (envUrl && envUrl.trim()) {
      const clean = envUrl.trim().replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }

    return '/api';
  }

  static setCustomApiUrl(url: string): void {
    if (typeof window !== 'undefined') {
      if (!url || !url.trim()) {
        localStorage.removeItem('utrain_custom_api_url');
      } else {
        localStorage.setItem('utrain_custom_api_url', url.trim());
      }
    }
  }

  static getCustomApiUrl(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('utrain_custom_api_url') || '';
    }
    return '';
  }

  private static getHeaders(): Record<string, string> {
    const user = AuthService.getCurrentUser();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user && user.id) {
      headers['x-user-id'] = user.id;
    }
    return headers;
  }

  /**
   * Health Check: verifica se il server backend e MongoDB sono attivi
   */
  static async checkHealth(): Promise<HealthCheckResponse | null> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/health`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Scarica tutti i dati dell'utente dal database MongoDB
   */
  static async syncPull(): Promise<SyncPullResponse | null> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/sync`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Invia e sincronizza tutti i dati locali sul database MongoDB
   */
  static async syncPush(payload: SyncPayload): Promise<{ success: boolean; message?: string } | null> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/sync`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Salvataggio singolo workout session su MongoDB in background
   */
  static async saveWorkout(session: WorkoutSession): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/workouts`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(session),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      // Offline fallback: continue
    }
  }

  /**
   * Salvataggio singola scheda su MongoDB in background
   */
  static async saveRoutine(routine: Routine): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/routines`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(routine),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      // Offline fallback
    }
  }

  /**
   * Salvataggio impostazioni utente su MongoDB in background
   */
  static async saveSettings(settings: Partial<UserProfileSettings>): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/settings`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(settings),
        signal: AbortSignal.timeout(4000),
      });
    } catch {
      // Offline fallback
    }
  }

  /**
   * Sincronizza gli account utenti locali su MongoDB
   */
  static async syncAccounts(accounts: unknown[]): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/auth/sync-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // Offline fallback
    }
  }
}
