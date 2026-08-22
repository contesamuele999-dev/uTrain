import mongoose, { Schema, Document } from 'mongoose';

export interface IRoutine extends Document {
  id: string;
  userId: string;
  title: string;
  description: string;
  goal: string;
  level: string;
  days: Array<{
    id: string;
    name: string;
    exercises: Array<{
      id: string;
      exerciseId: string;
      name: string;
      muscleGroup: string;
      targetSets: number;
      targetRepsMin: number;
      targetRepsMax: number;
      targetRpe?: number;
      targetRestSeconds?: number;
      notes?: string;
      suggestedWeight?: number;
      isRestPause?: boolean;
      restDurationSeconds?: number;
      isGroupHeader?: boolean;
      groupType?: string;
      groupName?: string;
    }>;
  }>;
  isAiGenerated?: boolean;
  aiPromptSummary?: string;
  createdAt: string;
  updatedAt: string;
}

const RoutineSchema = new Schema<IRoutine>(
  {
    id: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    goal: { type: String, default: 'hypertrophy' },
    level: { type: String, default: 'intermediate' },
    days: { type: [Schema.Types.Mixed], default: [] },
    isAiGenerated: { type: Boolean, default: false },
    aiPromptSummary: { type: String },
    createdAt: { type: String },
    updatedAt: { type: String },
  },
  {
    timestamps: true,
  }
);

RoutineSchema.index({ userId: 1, id: 1 }, { unique: true });

export const RoutineModel = mongoose.model<IRoutine>('Routine', RoutineSchema);
