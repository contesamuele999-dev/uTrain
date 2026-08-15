/**
 * Formule e utility di calcolo matematico per uTrain
 */

/**
 * Calcola l'1RM stimato (One Repetition Maximum) usando la formula di Epley e Brzycki
 */
export function estimate1RM(weightKg: number, reps: number): number {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;
  
  // Formula di Epley: 1RM = W * (1 + R / 30)
  const epley = weightKg * (1 + reps / 30);
  // Formula di Brzycki: 1RM = W * (36 / (37 - R)) [se reps < 37]
  const brzycki = reps < 37 ? weightKg * (36 / (37 - reps)) : epley;
  
  // Media ponderata per accuratezza superiore nel range 2-15 reps
  const estimated = (epley + brzycki) / 2;
  return Math.round(estimated * 10) / 10;
}

/**
 * Calcola la ripartizione dei dischi per lato per un bilanciere
 * @param targetWeightKg Peso totale desiderato (es. 80kg)
 * @param barWeightKg Peso del bilanciere (standard: 20kg o 15kg)
 * @param availablePlates Dischi disponibili per lato (standard: 25, 20, 15, 10, 5, 2.5, 1.25)
 */
export interface PlateCalculation {
  barWeight: number;
  weightPerSide: number;
  platesPerSide: Array<{ weight: number; count: number }>;
  actualTotalWeight: number;
  remainder: number;
}

export function calculateBarbellPlates(
  targetWeightKg: number,
  barWeightKg: number = 20,
  availablePlates: number[] = [25, 20, 15, 10, 5, 2.5, 1.25]
): PlateCalculation {
  if (targetWeightKg <= barWeightKg) {
    return {
      barWeight: barWeightKg,
      weightPerSide: 0,
      platesPerSide: [],
      actualTotalWeight: barWeightKg,
      remainder: 0,
    };
  }

  const weightPerSide = (targetWeightKg - barWeightKg) / 2;
  let remaining = weightPerSide;
  const platesPerSide: Array<{ weight: number; count: number }> = [];

  // Ordina i dischi dal più pesante al più leggero
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);

  for (const plate of sortedPlates) {
    if (remaining >= plate) {
      const count = Math.floor(remaining / plate);
      platesPerSide.push({ weight: plate, count });
      remaining = Math.round((remaining - count * plate) * 100) / 100;
    }
  }

  const actualWeightPerSide = platesPerSide.reduce(
    (acc, curr) => acc + curr.weight * curr.count,
    0
  );
  const actualTotalWeight = barWeightKg + actualWeightPerSide * 2;

  return {
    barWeight: barWeightKg,
    weightPerSide,
    platesPerSide,
    actualTotalWeight,
    remainder: Math.round((targetWeightKg - actualTotalWeight) * 100) / 100,
  };
}

/**
 * Formatta i secondi in formato "MM:SS" o "HH:MM:SS"
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formatta data in formato leggibile italiano (es. "15 Ago 2026")
 */
export function formatDateIt(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Formatta data breve per grafici (es. "15/08")
 */
export function formatDateShort(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return isoString;
  }
}

/**
 * Traduzioni in italiano dei gruppi muscolari per UI
 */
export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  chest: 'Petto',
  back: 'Dorso / Schiena',
  quads: 'Quadricipiti',
  hamstrings: 'Femorali',
  glutes: 'Glutei',
  calves: 'Polpacci',
  shoulders: 'Spalle',
  biceps: 'Bicipiti',
  triceps: 'Tricipiti',
  forearms: 'Avambracci',
  core: 'Addominali / Core',
  cardio: 'Cardio',
  full_body: 'Full Body',
};

/**
 * Traduzioni in italiano dell'attrezzatura
 */
export const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Bilanciere',
  dumbbell: 'Manubri',
  cable: 'Cavi',
  machine: 'Macchinario',
  bodyweight: 'Corpo Libero',
  smith_machine: 'Multipower',
  kettlebell: 'Kettlebell',
  band: 'Elastici',
  other: 'Altro',
};

/**
 * Traduzioni obiettivi
 */
export const GOAL_LABELS: Record<string, string> = {
  hypertrophy: 'Ipertrofia (Massa Muscolare)',
  strength: 'Forza Massimale',
  endurance: 'Resistenza / Conditioning',
  fat_loss: 'Definizione / Dimagrimento',
  general_fitness: 'Benessere & Fitness Generale',
};
