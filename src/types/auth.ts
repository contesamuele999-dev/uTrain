export interface User {
  id: string;
  email: string;
  name: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  isGuest?: boolean;
  avatarColor?: string;
  createdAt: string;
  lastLogin: string;
}

export interface UserAccountRecord extends User {
  passwordHash: string;
  passwordSalt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface LoginPayload {
  email: string;
  password: string;
}
