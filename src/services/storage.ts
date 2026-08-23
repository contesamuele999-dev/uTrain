import type {
  Routine,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../types/workout';
import { AuthService } from './authService';
import { ApiClient } from './apiClient';
import { SupabaseService } from './supabase';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { DEMO_SESSIONS, DEMO_PRS } from '../data/demoHistory';

export class StorageService {
  private static getUserPrefix(): string {
    const user = AuthService.getCurrentUser();
    return user ? `utrain_${user.id}` : 'utrain_default';
  }

  private static getKey(key: string): string {
    return `${this.getUserPrefix()}_${key}_v1`;
  }

  private static getDefaultSettings(): UserProfileSettings {
    const user = AuthService.getCurrentUser();
    return {
      userName: user ? user.name : 'Atleta',
      experienceLevel: user ? user.experienceLevel : 'intermediate',
      preferredUnit: 'kg',
      defaultRestSeconds: 90,
      soundEnabled: true,
      vibrationEnabled: true,
      geminiApiKey: '',
      geminiModel: 'gemini-3.5-flash',
      activeRoutineId: 'routine-ppl-classic',
    };
  }

  // SYNC STATE
  private static autoSyncTimeout: ReturnType<typeof setTimeout> | null = null;
  private static isSyncingInProgress = false;
  private static syncStatus: 'idle' | 'syncing' | 'synced' | 'error' = 'idle';
  private static syncSubscribers: Array<(status: 'idle' | 'syncing' | 'synced' | 'error') => void> = [];

  static getSyncStatus(): 'idle' | 'syncing' | 'synced' | 'error' {
    return this.syncStatus;
  }

  static subscribeSyncStatus(callback: (status: 'idle' | 'syncing' | 'synced' | 'error') => void): () => void {
    this.syncSubscribers.push(callback);
    callback(this.syncStatus);
    return () => {
      this.syncSubscribers = this.syncSubscribers.filter((cb) => cb !== callback);
    };
  }

  private static setSyncStatus(status: 'idle' | 'syncing' | 'synced' | 'error'): void {
    this.syncStatus = status;
    this.syncSubscribers.forEach((cb) => {
      try {
        cb(status);
      } catch (err) {
        console.error('Error notifying sync subscriber:', err);
      }
    });
  }

  /**
   * Schedula una sincronizzazione automatica in background (debounced 1.5s)
   */
  static triggerAutoSync(): void {
    if (this.autoSyncTimeout) {
      clearTimeout(this.autoSyncTimeout);
    }
    this.autoSyncTimeout = setTimeout(() => {
      this.silentSync().catch(() => {});
    }, 1500);
  }

  /**
   * Esegue la sincronizzazione silenziosa in background
   */
  static async silentSync(): Promise<void> {
    if (this.isSyncingInProgress) return;
    try {
      await this.syncWithCloud(true);
    } catch {
      // Sincronizzazione silenziosa: non blocca la UI
    }
  }

  // SETTINGS
  static getSettings(): UserProfileSettings {
    try {
      const data = localStorage.getItem(this.getKey('settings'));
      const defaults = this.getDefaultSettings();
      if (!data) return defaults;
      return { ...defaults, ...JSON.parse(data) };
    } catch {
      return this.getDefaultSettings();
    }
  }

  static saveSettings(settings: Partial<UserProfileSettings>): UserProfileSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(this.getKey('settings'), JSON.stringify(updated));
    this.notifySubscribers();
    this.triggerAutoSync();
    // Async background sync with MongoDB
    ApiClient.saveSettings(updated).catch(() => {});
    return updated;
  }

  // EXERCISES
  static getExercises(): Exercise[] {
    try {
      const data = localStorage.getItem(this.getKey('exercises'));
      if (!data) {
        this.saveExercises(DEFAULT_EXERCISES);
        return DEFAULT_EXERCISES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_EXERCISES;
    }
  }

  static saveExercises(exercises: Exercise[], triggerSync = true): void {
    localStorage.setItem(this.getKey('exercises'), JSON.stringify(exercises));
    this.notifySubscribers();
    if (triggerSync) this.triggerAutoSync();
  }

  static addCustomExercise(exercise: Omit<Exercise, 'id' | 'isCustom'>): Exercise {
    const list = this.getExercises();
    const newEx: Exercise = {
      ...exercise,
      id: `custom-ex-${Date.now()}`,
      isCustom: true,
    };
    list.push(newEx);
    this.saveExercises(list);
    return newEx;
  }

  // ROUTINES
  static getRoutines(): Routine[] {
    try {
      const data = localStorage.getItem(this.getKey('routines'));
      if (!data) {
        this.saveRoutines(DEFAULT_ROUTINES, false);
        return DEFAULT_ROUTINES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ROUTINES;
    }
  }

  static saveRoutines(routines: Routine[], triggerSync = true): void {
    localStorage.setItem(this.getKey('routines'), JSON.stringify(routines));
    this.notifySubscribers();
    if (triggerSync) this.triggerAutoSync();
  }

  static getRoutineById(id: string): Routine | undefined {
    return this.getRoutines().find((r) => r.id === id);
  }

  static saveRoutine(routine: Routine): void {
    const routines = this.getRoutines();
    const index = routines.findIndex((r) => r.id === routine.id);
    let updatedRoutine: Routine;
    if (index >= 0) {
      updatedRoutine = { ...routine, updatedAt: new Date().toISOString() };
      routines[index] = updatedRoutine;
    } else {
      updatedRoutine = {
        ...routine,
        createdAt: routine.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      routines.push(updatedRoutine);
    }
    this.saveRoutines(routines);
    // Background sync with MongoDB
    ApiClient.saveRoutine(updatedRoutine).catch(() => {});
  }

  static deleteRoutine(id: string): void {
    const routines = this.getRoutines().filter((r) => r.id !== id);
    this.saveRoutines(routines);
  }

  // SESSIONS & HISTORY
  static getSessions(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(this.getKey('sessions'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSessions(sessions: WorkoutSession[], triggerSync = true): void {
    localStorage.setItem(this.getKey('sessions'), JSON.stringify(sessions));
    this.notifySubscribers();
    if (triggerSync) this.triggerAutoSync();
  }

  static addCompletedSession(session: WorkoutSession): void {
    const sessions = this.getSessions();
    sessions.unshift(session);
    this.saveSessions(sessions);
    this.clearActiveSession();
    // Background sync with MongoDB
    ApiClient.saveWorkout(session).catch(() => {});
  }

  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.saveSessions(sessions);
  }

  // ACTIVE WORKOUT (DRAFT / IN-PROGRESS)
  static getActiveSession(): WorkoutSession | null {
    try {
      const data = localStorage.getItem(this.getKey('active_session'));
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveActiveSession(session: WorkoutSession): void {
    localStorage.setItem(this.getKey('active_session'), JSON.stringify(session));
    this.notifySubscribers();
  }

  static clearActiveSession(): void {
    localStorage.removeItem(this.getKey('active_session'));
    this.notifySubscribers();
  }

  // PERSONAL RECORDS (PRs)
  static getPRs(): Record<string, PersonalRecord> {
    try {
      const data = localStorage.getItem(this.getKey('prs'));
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static savePRs(prs: Record<string, PersonalRecord>, triggerSync = true): void {
    localStorage.setItem(this.getKey('prs'), JSON.stringify(prs));
    this.notifySubscribers();
    if (triggerSync) this.triggerAutoSync();
  }

  // DEMO DATA LOADER
  static loadDemoData(): void {
    this.saveSessions(DEMO_SESSIONS);
    const prMap: Record<string, PersonalRecord> = {};
    DEMO_PRS.forEach((pr) => {
      prMap[pr.exerciseId] = pr;
    });
    this.savePRs(prMap);
    this.notifySubscribers();
    this.triggerAutoSync();
  }

  // EXPORT / IMPORT BACKUP
  static exportFullBackupJSON(): string {
    const user = AuthService.getCurrentUser();
    const backup = {
      app: 'uTrain',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user: user || undefined,
      settings: this.getSettings(),
      routines: this.getRoutines(),
      exercises: this.getExercises(),
      sessions: this.getSessions(),
      prs: this.getPRs(),
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackupJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || data.app !== 'uTrain') {
        return { success: false, message: 'File di backup non valido per uTrain.' };
      }

      if (data.settings) this.saveSettings(data.settings);
      if (Array.isArray(data.routines)) this.saveRoutines(data.routines);
      if (Array.isArray(data.exercises)) this.saveExercises(data.exercises);
      if (Array.isArray(data.sessions)) this.saveSessions(data.sessions);
      if (data.prs) this.savePRs(data.prs);

      this.notifySubscribers();
      this.triggerAutoSync();
      return { success: true, message: 'Backup ripristinato con successo!' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: `Errore durante il ripristino: ${err.message}` };
    }
  }

  // CLOUD / SUPABASE / MONGODB FULL SYNC (CON INTELLIGENT MERGE BIDIREZIONALE)
  static async syncWithCloud(silent = false): Promise<{ success: boolean; message: string; databaseStatus?: string; databaseUri?: string }> {
    if (this.isSyncingInProgress) {
      return { success: true, message: 'Sincronizzazione già in corso...' };
    }

    this.isSyncingInProgress = true;
    this.setSyncStatus('syncing');

    try {
      // 1. SUPABASE CLOUD (Funziona ovunque su Web, GitHub Pages, Mobile & PC)
      if (SupabaseService.isConfigured()) {
        const user = AuthService.getCurrentUser();
        const userId = user ? user.id : 'default_athlete';

        // Sincronizza anche tutti gli account registrati verso il cloud
        const localAccounts = AuthService.getAccounts();
        if (localAccounts.length > 0) {
          SupabaseService.syncAllAccounts(localAccounts).catch(() => {});
        }

        // STEP 1: Scarica PRIMA lo stato remoto dal Cloud
        const remoteData = await SupabaseService.downloadData(userId);

        // STEP 2: Effettua il MERGE intelligente tra Locale e Remoto
        let localRoutines = this.getRoutines();
        let localSessions = this.getSessions();
        let localExercises = this.getExercises();
        let localPRs = this.getPRs();
        let localSettings = this.getSettings();

        if (remoteData) {
          // A. Merge Sessioni (Unione per ID, ordinate per data più recente)
          const sessionMap = new Map<string, WorkoutSession>();
          if (Array.isArray(remoteData.sessions)) {
            remoteData.sessions.forEach((s) => sessionMap.set(s.id, s));
          }
          localSessions.forEach((s) => sessionMap.set(s.id, s));
          localSessions = Array.from(sessionMap.values()).sort(
            (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          );

          // B. Merge Schede / Routine (Unione per ID, tenendo la versione più aggiornata)
          const routineMap = new Map<string, Routine>();
          if (Array.isArray(remoteData.routines)) {
            remoteData.routines.forEach((r) => routineMap.set(r.id, r));
          }
          localRoutines.forEach((r) => {
            const remoteR = routineMap.get(r.id);
            if (!remoteR) {
              routineMap.set(r.id, r);
            } else {
              const localTime = r.updatedAt ? new Date(r.updatedAt).getTime() : 0;
              const remoteTime = remoteR.updatedAt ? new Date(remoteR.updatedAt).getTime() : 0;
              if (localTime >= remoteTime) {
                routineMap.set(r.id, r);
              }
            }
          });
          localRoutines = Array.from(routineMap.values());

          // C. Merge Personal Records (PRs - Tiene sempre il massimale migliore)
          const mergedPRs = { ...(remoteData.prs || {}) };
          Object.entries(localPRs).forEach(([exId, localRecord]) => {
            const remoteRecord = mergedPRs[exId];
            if (!remoteRecord) {
              mergedPRs[exId] = localRecord;
            } else {
              const localMax = localRecord.maxEstimated1RM || localRecord.maxWeight || 0;
              const remoteMax = remoteRecord.maxEstimated1RM || remoteRecord.maxWeight || 0;
              mergedPRs[exId] = localMax >= remoteMax ? localRecord : remoteRecord;
            }
          });
          localPRs = mergedPRs;

          // D. Merge Esercizi personalizzati
          const exerciseMap = new Map<string, Exercise>();
          if (Array.isArray(remoteData.exercises)) {
            remoteData.exercises.forEach((ex) => exerciseMap.set(ex.id, ex));
          }
          localExercises.forEach((ex) => exerciseMap.set(ex.id, ex));
          localExercises = Array.from(exerciseMap.values());

          // E. Merge Impostazioni
          if (remoteData.settings && typeof remoteData.settings === 'object') {
            localSettings = { ...remoteData.settings, ...localSettings };
          }

          // Salva lo stato unito in locale
          this.saveRoutines(localRoutines, false);
          this.saveSessions(localSessions, false);
          this.savePRs(localPRs, false);
          this.saveExercises(localExercises, false);
        }

        // STEP 3: Invia lo stato UNITO completo al Cloud Supabase
        const uploadRes = await SupabaseService.uploadData({
          user_id: userId,
          email: user?.email,
          name: user?.name,
          settings: localSettings,
          routines: localRoutines,
          sessions: localSessions,
          prs: localPRs,
          exercises: localExercises,
        });

        if (!uploadRes.success) {
          this.setSyncStatus('error');
          return {
            success: false,
            message: uploadRes.message,
            databaseStatus: 'error',
            databaseUri: 'Supabase Cloud (PostgreSQL)',
          };
        }

        this.notifySubscribers();
        this.setSyncStatus('synced');

        return {
          success: true,
          message: 'Sincronizzazione completata con Supabase Cloud (online da GitHub Pages & cellulare)!',
          databaseStatus: 'connected',
          databaseUri: 'Supabase Cloud (PostgreSQL)',
        };
      }

      // 2. Secondary fallback: Check Express / MongoDB API
      const health = await ApiClient.checkHealth();
      if (!health || health.database !== 'connected') {
        this.setSyncStatus('idle');
        return {
          success: false,
          message: health
            ? 'Database non raggiungibile (controlla le credenziali in Impostazioni o .env).'
            : 'Nessun database cloud configurato (attiva Supabase in Impostazioni per sincronizzare online da GitHub Pages).',
          databaseStatus: health ? health.database : 'offline',
          databaseUri: health ? health.databaseUri : undefined,
        };
      }

      // Sync with MongoDB API
      await ApiClient.syncAccounts(AuthService.getAccounts());

      const localRoutines = this.getRoutines();
      const localSessions = this.getSessions();
      const localExercises = this.getExercises();
      const localPRs = Object.values(this.getPRs());
      const localSettings = this.getSettings();

      await ApiClient.syncPush({
        routines: localRoutines,
        workouts: localSessions,
        exercises: localExercises,
        prs: localPRs,
        settings: localSettings,
      });

      const remoteData = await ApiClient.syncPull();
      if (remoteData) {
        if (Array.isArray(remoteData.routines) && remoteData.routines.length > 0) {
          this.saveRoutines(remoteData.routines, false);
        }
        if (Array.isArray(remoteData.workouts) && remoteData.workouts.length > 0) {
          this.saveSessions(remoteData.workouts, false);
        }
        if (Array.isArray(remoteData.prs) && remoteData.prs.length > 0) {
          const prMap: Record<string, PersonalRecord> = {};
          remoteData.prs.forEach((p) => {
            prMap[p.exerciseId] = p;
          });
          this.savePRs(prMap, false);
        }
        if (remoteData.settings) {
          this.saveSettings(remoteData.settings);
        }
      }

      this.notifySubscribers();
      this.setSyncStatus('synced');

      return {
        success: true,
        message: `Sincronizzazione completata con ${health.databaseUri}!`,
        databaseStatus: 'connected',
        databaseUri: health.databaseUri,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.setSyncStatus('error');
      if (!silent) {
        console.error('Errore sincronizzazione cloud:', errorMsg);
      }
      return {
        success: false,
        message: `Errore durante la sincronizzazione: ${errorMsg}`,
      };
    } finally {
      this.isSyncingInProgress = false;
    }
  }

  static resetToFactoryDefaults(): void {
    const keys = ['settings', 'routines', 'exercises', 'sessions', 'prs', 'active_session'];
    keys.forEach((k) => localStorage.removeItem(this.getKey(k)));
    this.notifySubscribers();
  }

  // SUBSCRIBERS / REACTIVITY
  private static subscribers: Array<() => void> = [];

  static subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private static notifySubscribers(): void {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error('Error notifying storage subscriber:', e);
      }
    });
  }
}
