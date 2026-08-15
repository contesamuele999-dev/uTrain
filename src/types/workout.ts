export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'cardio'
  | 'full_body';

export type EquipmentType =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'smith_machine'
  | 'kettlebell'
  | 'band'
  | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: EquipmentType;
  instructions?: string;
  isCustom?: boolean;
}

export type SetType = 'warmup' | 'normal' | 'drop' | 'failure';

export interface RoutineExercise {
  id: string; // unique for this routine instance
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe?: number; // Rate of Perceived Exertion (1-10)
  targetRestSeconds: number;
  notes?: string;
  suggestedWeight?: number;
}

export interface RoutineDay {
  id: string;
  name: string; // e.g., "Giorno A - Push (Petto, Spalle, Tricipiti)"
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  title: string;
  description: string;
  goal: 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general_fitness';
  level: 'beginner' | 'intermediate' | 'advanced';
  days: RoutineDay[];
  createdAt: string;
  updatedAt: string;
  isAiGenerated?: boolean;
  aiPromptSummary?: string;
}

export interface CompletedSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number; // in kg
  reps: number;
  completed: boolean;
  rpe?: number;
  notes?: string;
  isPR?: boolean;
}

export interface CompletedExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: CompletedSet[];
  notes?: string;
  suggestedOverload?: {
    action: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
    recommendedWeight?: number;
    recommendedReps?: number;
    reason: string;
  };
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineTitle?: string;
  dayId?: string;
  dayName?: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  durationSeconds: number;
  exercises: CompletedExerciseLog[];
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  notes?: string;
  rating?: number; // 1-5 stars
  prsAchieved?: Array<{
    exerciseName: string;
    type: 'weight' | 'volume' | 'reps' | 'estimated1RM';
    value: string;
  }>;
  aiFeedback?: string;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  maxWeight: number; // Max weight lifted
  maxWeightReps: number;
  maxEstimated1RM: number; // Max estimated 1 rep max
  bestVolumeSet: number; // weight * reps in single set
  date: string;
}

export interface UserProfileSettings {
  userName: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredUnit: 'kg' | 'lbs';
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  geminiApiKey: string;
  geminiModel: 'gemini-1.5-flash' | 'gemini-2.0-flash' | 'gemini-1.5-pro';
  activeRoutineId?: string;
}
