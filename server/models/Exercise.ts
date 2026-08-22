import mongoose, { Schema, Document } from 'mongoose';

export interface IExercise extends Document {
  id: string;
  userId?: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions?: string;
  isCustom: boolean;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    id: { type: String, required: true, index: true },
    userId: { type: String, index: true },
    name: { type: String, required: true },
    muscleGroup: { type: String, required: true },
    equipment: { type: String, required: true },
    instructions: { type: String },
    isCustom: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const ExerciseModel = mongoose.model<IExercise>('Exercise', ExerciseSchema);
