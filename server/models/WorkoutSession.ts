import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutSession extends Document {
  id: string;
  userId: string;
  routineId?: string;
  routineTitle?: string;
  dayId?: string;
  dayName?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  exercises: Array<{
    id: string;
    exerciseId: string;
    exerciseName: string;
    muscleGroup: string;
    sets: Array<{
      id: string;
      setNumber: number;
      type: string;
      weight: number;
      reps: number;
      rpe?: number;
      completed: boolean;
      isPR?: boolean;
    }>;
    notes?: string;
    isRestPause?: boolean;
    restDurationSeconds?: number;
    completed?: boolean;
    isGroupHeader?: boolean;
    groupType?: string;
    groupName?: string;
  }>;
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  averageRpe?: number;
  notes?: string;
  perceivedExertion?: number;
  energyLevel?: number;
  isCompleted: boolean;
}

const WorkoutSessionSchema = new Schema<IWorkoutSession>(
  {
    id: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    routineId: { type: String },
    routineTitle: { type: String },
    dayId: { type: String },
    dayName: { type: String },
    startTime: { type: String, required: true },
    endTime: { type: String },
    durationSeconds: { type: Number, default: 0 },
    exercises: { type: [Schema.Types.Mixed], default: [] },
    totalVolumeKg: { type: Number, default: 0 },
    totalSets: { type: Number, default: 0 },
    totalReps: { type: Number, default: 0 },
    averageRpe: { type: Number },
    notes: { type: String },
    perceivedExertion: { type: Number },
    energyLevel: { type: Number },
    isCompleted: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

WorkoutSessionSchema.index({ userId: 1, id: 1 }, { unique: true });
WorkoutSessionSchema.index({ userId: 1, startTime: -1 });

export const WorkoutSessionModel = mongoose.model<IWorkoutSession>('WorkoutSession', WorkoutSessionSchema);
