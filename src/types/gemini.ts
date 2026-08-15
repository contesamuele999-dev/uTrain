import type { MuscleGroup, EquipmentType } from './workout';

export interface AIRoutineGeneratorRequest {
  goal: 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general_fitness';
  level: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  splitPreference?: 'ppl' | 'upper_lower' | 'full_body' | 'bro_split' | 'auto';
  equipment: EquipmentType[];
  sessionDurationMinutes: number;
  focusMuscles?: MuscleGroup[];
  injuriesOrLimitations?: string;
  userNotes?: string;
}

export interface GeneratedDayExercise {
  name: string;
  muscleGroup: MuscleGroup;
  sets: number;
  repsMin: number;
  repsMax: number;
  targetRpe?: number;
  restSeconds: number;
  notes?: string;
}

export interface GeneratedDay {
  dayName: string;
  focus: string;
  exercises: GeneratedDayExercise[];
}

export interface AIRoutineGeneratorResponse {
  title: string;
  description: string;
  goalExplanation: string;
  days: GeneratedDay[];
  weeklyStrategyTip: string;
}

export interface AIWorkoutAnalysisRequest {
  exerciseName: string;
  muscleGroup: MuscleGroup;
  historySummary: Array<{
    date: string;
    sets: Array<{ weight: number; reps: number; rpe?: number }>;
    estimated1RM: number;
  }>;
}

export interface AIOverloadAdvice {
  action: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  suggestedWeightDeltaKg: number;
  suggestedRepsDelta: number;
  adviceText: string;
  rationale: string;
}
