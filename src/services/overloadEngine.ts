import type { WorkoutSession, PersonalRecord, CompletedExerciseLog } from '../types/workout';
import { estimate1RM } from '../utils/calculations';

export interface OverloadSuggestion {
  action: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
  recommendedWeightDelta: number; // in kg (es. +2.5)
  recommendedRepsDelta: number; // es. +1
  confidence: number; // 0-100
  title: string;
  reason: string;
}

export class OverloadEngine {
  /**
   * Analizza lo storico di un esercizio e calcola la raccomandazione di sovraccarico progressivo
   * Basato sul modello Double Progression (progressione a doppia variabile: prima massimizza le rip, poi aumenta il peso)
   */
  static getProgressionAdvice(
    exerciseId: string,
    sessions: WorkoutSession[],
    targetRepsMin: number = 8,
    targetRepsMax: number = 10
  ): OverloadSuggestion {
    // Estrai tutti i log storici per questo esercizio in ordine cronologico inverso
    const logs: Array<{ date: string; log: CompletedExerciseLog }> = [];
    for (const session of sessions) {
      const match = session.exercises.find((e) => e.exerciseId === exerciseId);
      if (match && match.sets.filter((s) => s.completed).length > 0) {
        logs.push({ date: session.startTime, log: match });
      }
    }

    if (logs.length === 0) {
      return {
        action: 'maintain',
        recommendedWeightDelta: 0,
        recommendedRepsDelta: 0,
        confidence: 50,
        title: 'Prima sessione',
        reason: 'Esegui il primo allenamento per calibrare il peso di partenza a RPE 7-8.',
      };
    }

    const latest = logs[0].log;
    const completedSets = latest.sets.filter((s) => s.completed);
    if (completedSets.length === 0) {
      return {
        action: 'maintain',
        recommendedWeightDelta: 0,
        recommendedRepsDelta: 0,
        confidence: 50,
        title: 'Mantieni il carico',
        reason: 'Nessuna serie completata registrata nell\'ultima sessione.',
      };
    }

    // Controlla se tutte le serie hanno raggiunto o superato il limite massimo di ripetizioni
    const allHitMaxReps = completedSets.every((s) => s.reps >= targetRepsMax);
    const avgReps = completedSets.reduce((acc, s) => acc + s.reps, 0) / completedSets.length;
    const avgWeight = completedSets.reduce((acc, s) => acc + s.weight, 0) / completedSets.length;

    // Regola 1: Target max raggiunto in tutte le serie -> AUMENTA IL PESO (+2.5kg su multiarticolari / +1.25kg su isolamento)
    if (allHitMaxReps) {
      const weightDelta = avgWeight >= 50 ? 2.5 : 1.25;
      return {
        action: 'increase_weight',
        recommendedWeightDelta: weightDelta,
        recommendedRepsDelta: 0,
        confidence: 95,
        title: `🔥 Aumenta il peso di +${weightDelta} kg!`,
        reason: `Complimenti! Hai completato tutte le serie a ${targetRepsMax} ripetizioni. È il momento ideale per il sovraccarico progressivo.`,
      };
    }

    // Regola 2: Sei all'interno del range (es. 8 o 9 reps) -> PUNTA A +1 RIPETIZIONE
    if (avgReps >= targetRepsMin) {
      return {
        action: 'increase_reps',
        recommendedWeightDelta: 0,
        recommendedRepsDelta: 1,
        confidence: 85,
        title: 'Mantieni il peso e punta a +1 ripetizione',
        reason: `Hai una media di ${avgReps.toFixed(1)} reps. Punta a completare tutte le serie a quota ${targetRepsMax} rip con lo stesso carico.`,
      };
    }

    // Regola 3: Se ci sono almeno 3 sessioni e le rip sono in continuo calo -> Suggerisci Deload o Riposo
    if (logs.length >= 3) {
      const last3 = logs.slice(0, 3);
      const isDeclining =
        last3[0].log.sets.reduce((a, b) => a + b.reps, 0) <
        last3[1].log.sets.reduce((a, b) => a + b.reps, 0) &&
        last3[1].log.sets.reduce((a, b) => a + b.reps, 0) <
        last3[2].log.sets.reduce((a, b) => a + b.reps, 0);

      if (isDeclining) {
        return {
          action: 'deload',
          recommendedWeightDelta: -Math.round(avgWeight * 0.1),
          recommendedRepsDelta: 0,
          confidence: 80,
          title: 'Fase di stallo / Possibile Deload',
          reason: 'Le ripetizioni sono calate nelle ultime 3 sessioni. Valuta uno scarico del 10% sul carico o 2 giorni di riposo extra per recuperare il SNC.',
        };
      }
    }

    // Default: Mantieni e consolida tecnica
    return {
      action: 'maintain',
      recommendedWeightDelta: 0,
      recommendedRepsDelta: 1,
      confidence: 70,
      title: 'Consolida il carico attuale',
      reason: `Continua con il peso attuale cercando di avvicinarti a ${targetRepsMin} ripetizioni pulite su tutte le serie.`,
    };
  }

  /**
   * Trova e aggiorna i record personali (PRs) scansionando le sessioni
   */
  static evaluateNewPRs(
    session: WorkoutSession,
    existingPRs: Record<string, PersonalRecord>
  ): {
    updatedPRs: Record<string, PersonalRecord>;
    newAchievements: Array<{
      exerciseName: string;
      type: 'weight' | 'volume' | 'reps' | 'estimated1RM';
      value: string;
    }>;
  } {
    const updatedPRs = { ...existingPRs };
    const newAchievements: Array<{
      exerciseName: string;
      type: 'weight' | 'volume' | 'reps' | 'estimated1RM';
      value: string;
    }> = [];

    for (const ex of session.exercises) {
      const completedSets = ex.sets.filter((s) => s.completed && s.weight > 0 && s.reps > 0);
      if (completedSets.length === 0) continue;

      const currentPR = updatedPRs[ex.exerciseId];

      // Trova max peso e max 1RM di questa sessione
      let sessionMaxWeight = 0;
      let sessionMaxWeightReps = 0;
      let sessionMax1RM = 0;
      let sessionBestVolumeSet = 0;

      for (const s of completedSets) {
        const est1RM = estimate1RM(s.weight, s.reps);
        const setVolume = s.weight * s.reps;

        if (s.weight > sessionMaxWeight) {
          sessionMaxWeight = s.weight;
          sessionMaxWeightReps = s.reps;
        }
        if (est1RM > sessionMax1RM) {
          sessionMax1RM = est1RM;
        }
        if (setVolume > sessionBestVolumeSet) {
          sessionBestVolumeSet = setVolume;
        }
      }

      if (!currentPR) {
        // Primo PR registrato per questo esercizio
        updatedPRs[ex.exerciseId] = {
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          maxWeight: sessionMaxWeight,
          maxWeightReps: sessionMaxWeightReps,
          maxEstimated1RM: sessionMax1RM,
          bestVolumeSet: sessionBestVolumeSet,
          date: session.startTime,
        };
        newAchievements.push({
          exerciseName: ex.exerciseName,
          type: 'weight',
          value: `${sessionMaxWeight} kg × ${sessionMaxWeightReps} rip`,
        });
      } else {
        // Verifica se ha battuto il record di peso
        let hitNewPR = false;
        if (sessionMaxWeight > currentPR.maxWeight) {
          newAchievements.push({
            exerciseName: ex.exerciseName,
            type: 'weight',
            value: `${sessionMaxWeight} kg (prec: ${currentPR.maxWeight} kg)`,
          });
          currentPR.maxWeight = sessionMaxWeight;
          currentPR.maxWeightReps = sessionMaxWeightReps;
          hitNewPR = true;
        }

        // Verifica se ha battuto il record di 1RM stimato
        if (sessionMax1RM > currentPR.maxEstimated1RM) {
          newAchievements.push({
            exerciseName: ex.exerciseName,
            type: 'estimated1RM',
            value: `1RM: ${sessionMax1RM} kg (prec: ${currentPR.maxEstimated1RM} kg)`,
          });
          currentPR.maxEstimated1RM = sessionMax1RM;
          hitNewPR = true;
        }

        if (hitNewPR) {
          currentPR.date = session.startTime;
          updatedPRs[ex.exerciseId] = currentPR;
        }
      }
    }

    return { updatedPRs, newAchievements };
  }
}
