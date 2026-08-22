import mongoose, { Schema, Document } from 'mongoose';

export interface IPersonalRecord extends Document {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number;
  date: string;
  previousRecord?: {
    weight: number;
    reps: number;
    estimated1RM: number;
    date: string;
  };
}

const PersonalRecordSchema = new Schema<IPersonalRecord>(
  {
    userId: { type: String, required: true, index: true },
    exerciseId: { type: String, required: true, index: true },
    exerciseName: { type: String, required: true },
    weight: { type: Number, required: true },
    reps: { type: Number, required: true },
    estimated1RM: { type: Number, required: true },
    date: { type: String, required: true },
    previousRecord: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

PersonalRecordSchema.index({ userId: 1, exerciseId: 1 }, { unique: true });

export const PersonalRecordModel = mongoose.model<IPersonalRecord>('PersonalRecord', PersonalRecordSchema);
