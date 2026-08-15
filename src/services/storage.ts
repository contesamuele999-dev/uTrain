import type {
  Routine,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../types/workout';
import { DEFAULT_EXERCISES } from '../data/defaultExercises';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import { DEMO_SESSIONS, DEMO_PRS } from '../data/demoHistory';

const STORAGE_KEYS = {
  SETTINGS: 'utrain_settings_v1',
  ROUTINES: 'utrain_routines_v1',
  EXERCISES: 'utrain_exercises_v1',
  SESSIONS: 'utrain_sessions_v1',
  PRS: 'utrain_prs_v1',
  ACTIVE_SESSION: 'utrain_active_session_v1',
};

const DEFAULT_SETTINGS: UserProfileSettings = {
  userName: 'Atleta',
  experienceLevel: 'intermediate',
  preferredUnit: 'kg',
  defaultRestSeconds: 90,
  soundEnabled: true,
  vibrationEnabled: true,
  geminiApiKey: '',
  geminiModel: 'gemini-1.5-flash',
  activeRoutineId: 'routine-ppl-classic',
};

export class StorageService {
  // SETTINGS
  static getSettings(): UserProfileSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: Partial<UserProfileSettings>): UserProfileSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    this.notifySubscribers();
    return updated;
  }

  // EXERCISES
  static getExercises(): Exercise[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXERCISES);
      if (!data) {
        this.saveExercises(DEFAULT_EXERCISES);
        return DEFAULT_EXERCISES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_EXERCISES;
    }
  }

  static saveExercises(exercises: Exercise[]): void {
    localStorage.setItem(STORAGE_KEYS.EXERCISES, JSON.stringify(exercises));
    this.notifySubscribers();
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
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINES);
      if (!data) {
        this.saveRoutines(DEFAULT_ROUTINES);
        return DEFAULT_ROUTINES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_ROUTINES;
    }
  }

  static saveRoutines(routines: Routine[]): void {
    localStorage.setItem(STORAGE_KEYS.ROUTINES, JSON.stringify(routines));
    this.notifySubscribers();
  }

  static getRoutineById(id: string): Routine | undefined {
    return this.getRoutines().find((r) => r.id === id);
  }

  static saveRoutine(routine: Routine): void {
    const routines = this.getRoutines();
    const index = routines.findIndex((r) => r.id === routine.id);
    if (index >= 0) {
      routines[index] = { ...routine, updatedAt: new Date().toISOString() };
    } else {
      routines.push({
        ...routine,
        createdAt: routine.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.saveRoutines(routines);
  }

  static deleteRoutine(id: string): void {
    const routines = this.getRoutines().filter((r) => r.id !== id);
    this.saveRoutines(routines);
  }

  // SESSIONS & HISTORY
  static getSessions(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSessions(sessions: WorkoutSession[]): void {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    this.notifySubscribers();
  }

  static addCompletedSession(session: WorkoutSession): void {
    const sessions = this.getSessions();
    sessions.unshift(session);
    this.saveSessions(sessions);
    this.clearActiveSession();
  }

  static deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    this.saveSessions(sessions);
  }

  // ACTIVE WORKOUT (DRAFT / IN-PROGRESS)
  static getActiveSession(): WorkoutSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static saveActiveSession(session: WorkoutSession): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    this.notifySubscribers();
  }

  static clearActiveSession(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    this.notifySubscribers();
  }

  // PERSONAL RECORDS (PRs)
  static getPRs(): Record<string, PersonalRecord> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  static savePRs(prs: Record<string, PersonalRecord>): void {
    localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));
    this.notifySubscribers();
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
  }

  // EXPORT / IMPORT BACKUP
  static exportFullBackupJSON(): string {
    const backup = {
      app: 'uTrain',
      version: '1.0',
      exportedAt: new Date().toISOString(),
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
      return { success: true, message: 'Backup ripristinato con successo!' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: `Errore durante il ripristino: ${err.message}` };
    }
  }

  static resetToFactoryDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.ROUTINES);
    localStorage.removeItem(STORAGE_KEYS.EXERCISES);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.PRS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
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
