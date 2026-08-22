import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: string;
  userName: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredUnit: 'kg' | 'lbs';
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  geminiApiKey?: string;
  geminiModel?: string;
  activeRoutineId?: string;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    userName: { type: String, default: 'Atleta' },
    experienceLevel: { type: String, default: 'intermediate' },
    preferredUnit: { type: String, default: 'kg' },
    defaultRestSeconds: { type: Number, default: 90 },
    soundEnabled: { type: Boolean, default: true },
    vibrationEnabled: { type: Boolean, default: true },
    geminiApiKey: { type: String, default: '' },
    geminiModel: { type: String, default: 'gemini-3.5-flash' },
    activeRoutineId: { type: String, default: 'routine-ppl-classic' },
  },
  {
    timestamps: true,
  }
);

export const UserSettingsModel = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);
