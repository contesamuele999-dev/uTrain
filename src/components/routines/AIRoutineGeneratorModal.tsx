import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { GeminiService } from '../../services/gemini';
import { StorageService } from '../../services/storage';
import type {
  Routine,
  MuscleGroup,
  EquipmentType,
} from '../../types/workout';
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from '../../utils/calculations';

interface AIRoutineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineCreated: (newRoutine: Routine) => void;
  onOpenSettings?: () => void;
}

export const AIRoutineGeneratorModal: React.FC<AIRoutineGeneratorModalProps> = ({
  isOpen,
  onClose,
  onRoutineCreated,
}) => {
  const settings = StorageService.getSettings();

  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general_fitness'>('hypertrophy');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(settings.experienceLevel || 'intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(3);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [equipment, setEquipment] = useState<EquipmentType[]>([
    'barbell',
    'dumbbell',
    'cable',
    'machine',
    'bodyweight',
  ]);
  const [focusMuscles, setFocusMuscles] = useState<MuscleGroup[]>([]);
  const [injuries, setInjuries] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [splitPreference, setSplitPreference] = useState<'auto' | 'ppl' | 'upper_lower' | 'full_body' | 'bro_split'>('auto');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    description: string;
    goalExplanation: string;
    days: Array<{
      dayName: string;
      exercises: Array<{
        name: string;
        muscleGroup: MuscleGroup;
        sets: number;
        repsMin: number;
        repsMax: number;
        restSeconds: number;
        notes?: string;
      }>;
    }>;
  } | null>(null);

  if (!isOpen) return null;

  const toggleEquipment = (eq: EquipmentType) => {
    if (equipment.includes(eq)) {
      if (equipment.length > 1) {
        setEquipment(equipment.filter((e) => e !== eq));
      }
    } else {
      setEquipment([...equipment, eq]);
    }
  };

  const toggleMuscleFocus = (muscle: MuscleGroup) => {
    if (focusMuscles.includes(muscle)) {
      setFocusMuscles(focusMuscles.filter((m) => m !== muscle));
    } else {
      if (focusMuscles.length < 3) {
        setFocusMuscles([...focusMuscles, muscle]);
      }
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const generated = await GeminiService.generateWorkoutRoutine({
        goal,
        level,
        daysPerWeek,
        sessionDurationMinutes: durationMinutes,
        equipment,
        focusMuscles: focusMuscles.length > 0 ? focusMuscles : undefined,
        injuriesOrLimitations: injuries.trim() || undefined,
        userNotes: userNotes.trim() || undefined,
        splitPreference,
      });

      setGeneratedResult(generated);
    } catch (e: unknown) {
      const err = e as Error;
      setErrorMessage(err.message || 'Errore durante la generazione della scheda con Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndApply = () => {
    if (!generatedResult) return;

    const newRoutine: Routine = {
      id: `routine-ai-${Date.now()}`,
      title: generatedResult.title,
      description: generatedResult.description,
      goal,
      level,
      isAiGenerated: true,
      aiPromptSummary: `${daysPerWeek}gg/settimana • ${goal} • ${durationMinutes}min`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: generatedResult.days.map((d, dIdx) => ({
        id: `day-ai-${dIdx + 1}-${Date.now()}`,
        name: d.dayName,
        exercises: d.exercises.map((ex, eIdx) => ({
          id: `ex-ai-${eIdx + 1}-${Date.now()}`,
          exerciseId: `custom-ai-ex-${eIdx}`,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.sets || 3,
          targetRepsMin: ex.repsMin || 8,
          targetRepsMax: ex.repsMax || 12,
          targetRestSeconds: ex.restSeconds || 90,
          notes: ex.notes,
        })),
      })),
    };

    StorageService.saveRoutine(newRoutine);
    StorageService.saveSettings({ activeRoutineId: newRoutine.id });
    onRoutineCreated(newRoutine);
    onClose();
  };

  const allEquipments: EquipmentType[] = [
    'barbell',
    'dumbbell',
    'cable',
    'machine',
    'bodyweight',
    'smith_machine',
    'kettlebell',
    'band',
  ];

  const mainMuscles: MuscleGroup[] = [
    'chest',
    'back',
    'quads',
    'hamstrings',
    'glutes',
    'shoulders',
    'biceps',
    'triceps',
    'core',
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
    }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 640,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(18, 21, 30, 0.95) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Generatore Schede AI Gemini
              </h2>
              <p style={{ fontSize: '0.68rem', color: '#c4b5fd', margin: 0 }}>
                Programmazione scientifica su misura
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '12px 14px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 10px',
              color: '#fca5a5',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <AlertCircle size={15} /> {errorMessage}
            </div>
          )}

          {!generatedResult ? (
            /* WIZARD FORM */
            <>
              {/* 1. Obiettivo & Livello */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
                    Obiettivo Primario:
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general_fitness')}
                    style={{ fontSize: '0.84rem' }}
                  >
                    <option value="hypertrophy">Ipertrofia (Massa)</option>
                    <option value="strength">Forza & Carichi</option>
                    <option value="fat_loss">Definizione</option>
                    <option value="endurance">Resistenza</option>
                    <option value="general_fitness">Tono Generale</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
                    Livello Esperienza:
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                    style={{ fontSize: '0.84rem' }}
                  >
                    <option value="beginner">Principiante (&lt; 1 anno)</option>
                    <option value="intermediate">Intermedio (1 - 3 anni)</option>
                    <option value="advanced">Avanzato (&gt; 3 anni)</option>
                  </select>
                </div>
              </div>

              {/* 2. Frequenza & Durata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
                    Frequenza: <strong style={{ color: 'var(--accent-primary)' }}>{daysPerWeek} gg/sett</strong>
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    step="1"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                    style={{ accentColor: 'var(--accent-primary)' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
                    Durata Sessione:
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                    style={{ fontSize: '0.84rem' }}
                  >
                    <option value="45">45 minuti (Espresso)</option>
                    <option value="60">60 minuti (Standard)</option>
                    <option value="75">75 minuti (Completo)</option>
                    <option value="90">90 minuti (Power)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
                    Split:
                  </label>
                  <select
                    value={splitPreference}
                    onChange={(e) => setSplitPreference(e.target.value as 'auto' | 'ppl' | 'upper_lower' | 'full_body' | 'bro_split')}
                    style={{ fontSize: '0.84rem' }}
                  >
                    <option value="auto">Auto (Consigliato AI)</option>
                    <option value="ppl">Push - Pull - Legs</option>
                    <option value="upper_lower">Upper - Lower</option>
                    <option value="full_body">Full Body</option>
                    <option value="bro_split">Bro Split</option>
                  </select>
                </div>
              </div>

              {/* 3. Attrezzatura Disponibile */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Attrezzatura disponibile:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {allEquipments.map((eq) => {
                    const isSelected = equipment.includes(eq);
                    return (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleEquipment(eq)}
                        style={{
                          background: isSelected ? 'rgba(16, 185, 129, 0.18)' : 'var(--bg-input)',
                          color: isSelected ? '#34d399' : 'var(--text-secondary)',
                          border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-full)',
                          padding: '4px 8px',
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {isSelected && <CheckCircle2 size={10} />}
                        {EQUIPMENT_LABELS[eq] || eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Focus Muscolare (Opzionale) */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                  Focus Muscolare (max 3):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {mainMuscles.map((mg) => {
                    const isSelected = focusMuscles.includes(mg);
                    return (
                      <button
                        key={mg}
                        type="button"
                        onClick={() => toggleMuscleFocus(mg)}
                        style={{
                          background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-input)',
                          color: isSelected ? '#c4b5fd' : 'var(--text-secondary)',
                          border: `1px solid ${isSelected ? 'var(--accent-purple)' : 'var(--border-subtle)'}`,
                          borderRadius: 'var(--radius-full)',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {MUSCLE_GROUP_LABELS[mg] || mg}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Infortuni & Note */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldAlert size={12} color="#f59e0b" /> Limitazioni articolari:
                  </label>
                  <input
                    type="text"
                    placeholder="Es. No squat pesanti"
                    value={injuries}
                    onChange={(e) => setInjuries(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 2, display: 'block' }}>
                    Note speciali:
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Includi trazioni"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </>
          ) : (
            /* PREVIEW GENERATED ROUTINE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(18, 21, 30, 0.8) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="chip chip-green" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>Generata</span>
                  <span className="chip chip-purple" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{generatedResult.days.length} Giorni</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: '2px 0' }}>
                  {generatedResult.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {generatedResult.description}
                </p>
                {generatedResult.goalExplanation && (
                  <div style={{
                    marginTop: 6,
                    padding: '6px 8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.74rem',
                    color: '#c4b5fd',
                  }}>
                    💡 <strong>Strategia:</strong> {generatedResult.goalExplanation}
                  </div>
                )}
              </div>

              {/* Days breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {generatedResult.days.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                    }}
                  >
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>
                      {day.dayName}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {day.exercises.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 6px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.76rem',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#fff' }}>{ex.name}</strong>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fbbf24' }}>
                              {ex.sets}×{ex.repsMin}-{ex.repsMax}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Clock size={10} /> {ex.restSeconds}s
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 8,
          background: 'rgba(9, 10, 15, 0.95)',
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            Chiudi
          </button>

          {!generatedResult ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-ai"
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            >
              {isGenerating ? (
                <>
                  <Sparkles size={14} style={{ animation: 'spin 1.5s linear infinite' }} />
                  Elaborazione...
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Genera Scheda AI
                </>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setGeneratedResult(null)}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.78rem' }}
              >
                Parametri
              </button>
              <button
                onClick={handleSaveAndApply}
                className="btn-primary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                <Save size={14} /> Salva & Attiva
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
