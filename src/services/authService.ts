import type {
  User,
  UserAccountRecord,
  AuthSession,
  RegisterPayload,
  LoginPayload,
} from '../types/auth';
import { ApiClient } from './apiClient';
import { SupabaseService } from './supabase';

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

/**
 * Algoritmo standard SHA-256 in puro TypeScript (FIPS 180-4).
 * Garantisce 100% di identità di calcolo tra PC (HTTPS/localhost) e smartphone (HTTP/IP locale/PWA).
 */
function pureSha256(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const utf8Str = unescape(encodeURIComponent(ascii));
  const strLen = utf8Str.length;

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  for (i = 0; i < strLen; i++) {
    j = utf8Str.charCodeAt(i);
    words[i >> 2] |= (j & 0xff) << ((3 - (i % 4)) * 8);
  }
  words[strLen >> 2] |= 0x80 << ((3 - (strLen % 4)) * 8);
  words[(((strLen + 8) >> 6) << 4) + 15] = strLen * 8;

  for (let blockStart = 0; blockStart < words.length; blockStart += 16) {
    const w = new Array(64);
    for (i = 0; i < 16; i++) {
      w[i] = words[blockStart + i] | 0;
    }
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      const s1 = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}

export class AuthService {
  /**
   * Genera un hash SHA-256 standard con salt
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

    // Fallback crittografico affidabile FIPS 180-4 standard
    return pureSha256(password + salt);
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

  static getAccounts(): UserAccountRecord[] {
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
   * Inizializza l'account demo se non esiste ancora o corregge l'hash
   */
  static async initDefaultAccounts(): Promise<void> {
    const accounts = this.getAccounts();
    const demoEmail = 'demo@utrain.app';
    const demoIdx = accounts.findIndex((a) => a.email.toLowerCase() === demoEmail);

    if (demoIdx === -1) {
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
    } else {
      // Migrazione trasparente se l'hash dell'account demo non è a 64 caratteri SHA-256
      const demo = accounts[demoIdx];
      if (!demo.passwordHash || demo.passwordHash.length !== 64) {
        demo.passwordSalt = demo.passwordSalt || this.generateSalt();
        demo.passwordHash = await this.hashPassword('password123', demo.passwordSalt);
        this.saveAccounts(accounts);
      }
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
   * Effettua il Login con Email e Password (con supporto Supabase Cloud multi-dispositivo)
   */
  static async login(payload: LoginPayload): Promise<{ success: boolean; user?: User; message?: string }> {
    await this.initDefaultAccounts();
    const accounts = this.getAccounts();
    const emailNorm = payload.email.trim().toLowerCase();

    let account = accounts.find((a) => a.email.toLowerCase() === emailNorm);

    // Se l'account non è presente nel LocalStorage locale, verifica su Supabase Cloud
    if (!account && SupabaseService.isConfigured()) {
      try {
        const cloudAccount = await SupabaseService.fetchAccountByEmail(emailNorm);
        if (cloudAccount) {
          account = cloudAccount;
          accounts.push(cloudAccount);
          this.saveAccounts(accounts);
        }
      } catch (err) {
        console.warn('[AuthService] Errore verifica account cloud:', err);
      }
    }

    if (!account) {
      return {
        success: false,
        message: 'Nessun account trovato con questa email. Se ti sei registrato da un altro dispositivo, crea un account o verifica la sincronizzazione.',
      };
    }

    const calculatedHash = await this.hashPassword(payload.password, account.passwordSalt);
    if (calculatedHash !== account.passwordHash) {
      return { success: false, message: 'Password errata. Riprova.' };
    }

    account.lastLogin = new Date().toISOString();
    this.saveAccounts(accounts);

    // Sincronizza ultimo login su Supabase se configurato
    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAccount(account).catch(() => {});
    }

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
   * Registra un nuovo account (salvataggio locale + Supabase Cloud)
   */
  static async register(payload: RegisterPayload): Promise<{ success: boolean; user?: User; message?: string }> {
    await this.initDefaultAccounts();
    const accounts = this.getAccounts();
    const emailNorm = payload.email.trim().toLowerCase();

    if (!payload.name || !payload.name.trim()) {
      return { success: false, message: 'Inserisci il tuo nome o nickname.' };
    }
    if (!emailNorm || !emailNorm.includes('@')) {
      return { success: false, message: 'Inserisci un indirizzo email valido.' };
    }
    if (!payload.password || payload.password.length < 6) {
      return { success: false, message: 'La password deve contenere almeno 6 caratteri.' };
    }

    const alreadyExistsLocal = accounts.some((a) => a.email.toLowerCase() === emailNorm);
    if (alreadyExistsLocal) {
      return { success: false, message: 'Un account con questa email è già registrato. Effettua il login.' };
    }

    // Verifica se esiste già su Supabase Cloud
    if (SupabaseService.isConfigured()) {
      try {
        const cloudAcc = await SupabaseService.fetchAccountByEmail(emailNorm);
        if (cloudAcc) {
          return { success: false, message: 'Un account con questa email esiste già su Supabase Cloud. Effettua il login.' };
        }
      } catch {
        // Procedi con registrazione locale
      }
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

    // Salvataggio su Supabase Cloud se configurato
    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAccount(newAccount).catch(() => {});
    }

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
    // Background sync with MongoDB
    ApiClient.syncAccounts(accounts).catch(() => {});
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
        if (SupabaseService.isConfigured()) {
          SupabaseService.saveAccount(accounts[idx]).catch(() => {});
        }
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

    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAccount(account).catch(() => {});
    }

    return { success: true, message: 'Password aggiornata con successo!' };
  }

  /**
   * Recupero / Reset Password
   */
  static async resetPassword(email: string): Promise<{ success: boolean; message: string; tempPass?: string }> {
    await this.initDefaultAccounts();
    const accounts = this.getAccounts();
    const emailNorm = email.trim().toLowerCase();
    let account = accounts.find((a) => a.email.toLowerCase() === emailNorm);

    if (!account && SupabaseService.isConfigured()) {
      account = (await SupabaseService.fetchAccountByEmail(emailNorm)) || undefined;
      if (account) {
        accounts.push(account);
      }
    }

    if (!account) {
      return { success: false, message: 'Nessun account registrato con questa email.' };
    }

    const tempPass = `uTrain${Math.floor(1000 + Math.random() * 9000)}!`;
    const newSalt = this.generateSalt();
    const newHash = await this.hashPassword(tempPass, newSalt);

    account.passwordSalt = newSalt;
    account.passwordHash = newHash;
    this.saveAccounts(accounts);

    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAccount(account).catch(() => {});
    }

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
