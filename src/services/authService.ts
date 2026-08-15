import type {
  User,
  UserAccountRecord,
  AuthSession,
  RegisterPayload,
  LoginPayload,
} from '../types/auth';

const STORAGE_KEYS = {
  ACCOUNTS: 'utrain_accounts_v1',
  CURRENT_SESSION: 'utrain_current_session_v1',
};

const AVATAR_COLORS = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #8b5cf6, #6366f1)',
  'linear-gradient(135deg, #3b82f6, #0284c7)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ec4899, #be185d)',
];

export class AuthService {
  /**
   * Genera un hash SHA-256 con salt tramite Web Crypto API nativa con fallback di sicurezza
   */
  private static async hashPassword(password: string, salt: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // Fallback
    }

    // Fallback hash
    let hash = 0;
    const str = password + salt;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }

  private static generateSalt(): string {
    try {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint8Array(16);
        window.crypto.getRandomValues(array);
        return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
      }
    } catch {
      // Fallback
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static getAccounts(): UserAccountRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private static saveAccounts(accounts: UserAccountRecord[]): void {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  /**
   * Inizializza l'account demo se non esiste ancora nessun account
   */
  static async initDefaultAccounts(): Promise<void> {
    const accounts = this.getAccounts();
    const demoEmail = 'demo@utrain.app';
    const exists = accounts.some((a) => a.email.toLowerCase() === demoEmail);

    if (!exists) {
      const salt = this.generateSalt();
      const hash = await this.hashPassword('password123', salt);
      const demoAccount: UserAccountRecord = {
        id: 'user-demo-1',
        email: demoEmail,
        name: 'Atleta Demo',
        experienceLevel: 'intermediate',
        avatarColor: AVATAR_COLORS[0],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        passwordSalt: salt,
        passwordHash: hash,
      };
      accounts.push(demoAccount);
      this.saveAccounts(accounts);
    }
  }

  /**
   * Restituisce l'utente attualmente loggato o null
   */
  static getCurrentUser(): User | null {
    try {
      const sessionStr = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
      if (!sessionStr) return null;
      const session: AuthSession = JSON.parse(sessionStr);
      return session.user;
    } catch {
      return null;
    }
  }

  private static setSession(user: User): void {
    const session: AuthSession = {
      user,
      token: `token-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    this.notifySubscribers(user);
  }

  /**
   * Effettua il Login con Email e Password
   */
  static async login(payload: LoginPayload): Promise<{ success: boolean; user?: User; message?: string }> {
    await this.initDefaultAccounts();
    const accounts = this.getAccounts();
    const emailNorm = payload.email.trim().toLowerCase();

    const account = accounts.find((a) => a.email.toLowerCase() === emailNorm);
    if (!account) {
      return { success: false, message: 'Nessun account trovato con questo indirizzo email.' };
    }

    const calculatedHash = await this.hashPassword(payload.password, account.passwordSalt);
    if (calculatedHash !== account.passwordHash) {
      return { success: false, message: 'Password errata. Riprova.' };
    }

    account.lastLogin = new Date().toISOString();
    this.saveAccounts(accounts);

    const user: User = {
      id: account.id,
      email: account.email,
      name: account.name,
      experienceLevel: account.experienceLevel,
      avatarColor: account.avatarColor,
      createdAt: account.createdAt,
      lastLogin: account.lastLogin,
    };

    this.setSession(user);
    return { success: true, user };
  }

  /**
   * Registra un nuovo account
   */
  static async register(payload: RegisterPayload): Promise<{ success: boolean; user?: User; message?: string }> {
    await this.initDefaultAccounts();
    const accounts = this.getAccounts();
    const emailNorm = payload.email.trim().toLowerCase();

    if (!payload.name.trim()) {
      return { success: false, message: 'Inserisci il tuo nome o nickname.' };
    }
    if (!emailNorm || !emailNorm.includes('@')) {
      return { success: false, message: 'Inserisci un indirizzo email valido.' };
    }
    if (payload.password.length < 6) {
      return { success: false, message: 'La password deve contenere almeno 6 caratteri.' };
    }

    const alreadyExists = accounts.some((a) => a.email.toLowerCase() === emailNorm);
    if (alreadyExists) {
      return { success: false, message: 'Un account con questa email è già registrato. Effettua il login.' };
    }

    const salt = this.generateSalt();
    const hash = await this.hashPassword(payload.password, salt);
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

    const newAccount: UserAccountRecord = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: emailNorm,
      name: payload.name.trim(),
      experienceLevel: payload.experienceLevel || 'intermediate',
      avatarColor: color,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      passwordSalt: salt,
      passwordHash: hash,
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);

    const user: User = {
      id: newAccount.id,
      email: newAccount.email,
      name: newAccount.name,
      experienceLevel: newAccount.experienceLevel,
      avatarColor: newAccount.avatarColor,
      createdAt: newAccount.createdAt,
      lastLogin: newAccount.lastLogin,
    };

    this.setSession(user);
    return { success: true, user };
  }

  /**
   * Login rapido come Ospite
   */
  static loginAsGuest(): User {
    const guestUser: User = {
      id: 'guest-session',
      email: 'guest@utrain.local',
      name: 'Ospite',
      experienceLevel: 'intermediate',
      isGuest: true,
      avatarColor: 'linear-gradient(135deg, #64748b, #475569)',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.setSession(guestUser);
    return guestUser;
  }

  /**
   * Logout utente
   */
  static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
    this.notifySubscribers(null);
  }

  /**
   * Aggiorna profilo utente
   */
  static updateUserProfile(updates: Partial<User>): User | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const updatedUser: User = { ...currentUser, ...updates };

    if (!currentUser.isGuest) {
      const accounts = this.getAccounts();
      const idx = accounts.findIndex((a) => a.id === currentUser.id);
      if (idx >= 0) {
        accounts[idx] = { ...accounts[idx], ...updates };
        this.saveAccounts(accounts);
      }
    }

    this.setSession(updatedUser);
    return updatedUser;
  }

  /**
   * Modifica password
   */
  static async changePassword(oldPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.isGuest) {
      return { success: false, message: 'Operazione non consentita per account ospite.' };
    }

    if (newPass.length < 6) {
      return { success: false, message: 'La nuova password deve contenere almeno 6 caratteri.' };
    }

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.id === currentUser.id);
    if (!account) {
      return { success: false, message: 'Account non trovato.' };
    }

    const currentHash = await this.hashPassword(oldPass, account.passwordSalt);
    if (currentHash !== account.passwordHash) {
      return { success: false, message: 'La password attuale non è corretta.' };
    }

    const newSalt = this.generateSalt();
    const newHash = await this.hashPassword(newPass, newSalt);

    account.passwordSalt = newSalt;
    account.passwordHash = newHash;
    this.saveAccounts(accounts);

    return { success: true, message: 'Password aggiornata con successo!' };
  }

  /**
   * Recupero / Reset Password
   */
  static async resetPassword(email: string): Promise<{ success: boolean; message: string; tempPass?: string }> {
    await this.initDefaultAccounts();
    const accounts = this.getAccounts();
    const emailNorm = email.trim().toLowerCase();
    const account = accounts.find((a) => a.email.toLowerCase() === emailNorm);

    if (!account) {
      return { success: false, message: 'Nessun account registrato con questa email.' };
    }

    const tempPass = `uTrain${Math.floor(1000 + Math.random() * 9000)}!`;
    const newSalt = this.generateSalt();
    const newHash = await this.hashPassword(tempPass, newSalt);

    account.passwordSalt = newSalt;
    account.passwordHash = newHash;
    this.saveAccounts(accounts);

    return {
      success: true,
      message: `Password reimpostata! La tua nuova password temporanea è: ${tempPass}`,
      tempPass,
    };
  }

  // SUBSCRIBERS
  private static subscribers: Array<(user: User | null) => void> = [];

  static subscribe(callback: (user: User | null) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private static notifySubscribers(user: User | null): void {
    this.subscribers.forEach((cb) => {
      try {
        cb(user);
      } catch (e) {
        console.error('Error notifying auth subscriber:', e);
      }
    });
  }
}
