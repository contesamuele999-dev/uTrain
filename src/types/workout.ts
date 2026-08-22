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
  | 'full_body'
  | 'other';

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

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: EquipmentType;
  instructions?: string;
  tips?: string[];
  isCustom?: boolean;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
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
  groupType?: 'standard' | 'superset' | 'circuit' | 'warmup' | 'finisher';
  groupName?: string;
  groupId?: string;
}

export interface RoutineDay {
  id: string;
  name: string;
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
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
  isPR?: boolean;
}

export interface CompletedExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: CompletedSet[];
  notes?: string;
  isRestPause?: boolean;
  restDurationSeconds?: number;
  completed?: boolean;
  isGroupHeader?: boolean;
  groupType?: 'standard' | 'superset' | 'circuit' | 'warmup' | 'finisher';
  groupName?: string;
  groupId?: string;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineTitle?: string;
  dayId?: string;
  dayName?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  exercises: CompletedExerciseLog[];
  totalVolumeKg: number;
  totalSets: number;
  totalReps: number;
  notes?: string;
  rating?: number;
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
  maxWeight: number;
  maxWeightReps: number;
  maxEstimated1RM: number;
  bestVolumeSet: number;
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
  geminiModel: 'gemini-3.5-flash' | string;
  activeRoutineId?: string;
}
