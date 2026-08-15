import type {
  Routine,
  Exercise,
  WorkoutSession,
  PersonalRecord,
  UserProfileSettings,
} from '../types/workout';
import { AuthService } from './authService';
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
      geminiModel: 'gemini-2.0-flash-lite',
      activeRoutineId: 'routine-ppl-classic',
    };
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

  static saveExercises(exercises: Exercise[]): void {
    localStorage.setItem(this.getKey('exercises'), JSON.stringify(exercises));
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
      const data = localStorage.getItem(this.getKey('routines'));
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
    localStorage.setItem(this.getKey('routines'), JSON.stringify(routines));
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
      const data = localStorage.getItem(this.getKey('sessions'));
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static saveSessions(sessions: WorkoutSession[]): void {
    localStorage.setItem(this.getKey('sessions'), JSON.stringify(sessions));
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

  static savePRs(prs: Record<string, PersonalRecord>): void {
    localStorage.setItem(this.getKey('prs'), JSON.stringify(prs));
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
      return { success: true, message: 'Backup ripristinato con successo!' };
    } catch (e: unknown) {
      const err = e as Error;
      return { success: false, message: `Errore durante il ripristino: ${err.message}` };
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
