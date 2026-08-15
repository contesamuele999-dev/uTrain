import React, { useState } from 'react';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { GeminiService } from '../../services/gemini';
import { StorageService } from '../../services/storage';
import type {
  AIRoutineGeneratorRequest,
  AIRoutineGeneratorResponse,
} from '../../types/gemini';
import type { Routine, EquipmentType, MuscleGroup } from '../../types/workout';
import { MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS } from '../../utils/calculations';

interface AIRoutineGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoutineCreated: (routine: Routine) => void;
  onOpenSettings: () => void;
}

export const AIRoutineGeneratorModal: React.FC<AIRoutineGeneratorModalProps> = ({
  isOpen,
  onClose,
  onRoutineCreated,
}) => {
  const settings = StorageService.getSettings();

  // Form State
  const [goal, setGoal] = useState<'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general_fitness'>('hypertrophy');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(settings.experienceLevel || 'intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [splitPreference, setSplitPreference] = useState<'auto' | 'ppl' | 'upper_lower' | 'full_body' | 'bro_split'>('auto');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [equipment, setEquipment] = useState<EquipmentType[]>(['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight']);
  const [focusMuscles, setFocusMuscles] = useState<MuscleGroup[]>([]);
  const [injuries, setInjuries] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');

  // Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<AIRoutineGeneratorResponse | null>(null);

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

  const toggleMuscleFocus = (mg: MuscleGroup) => {
    if (focusMuscles.includes(mg)) {
      setFocusMuscles(focusMuscles.filter((m) => m !== mg));
    } else {
      if (focusMuscles.length < 3) {
        setFocusMuscles([...focusMuscles, mg]);
      }
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedResult(null);

    const requestPayload: AIRoutineGeneratorRequest = {
      goal,
      level,
      daysPerWeek,
      splitPreference,
      equipment,
      sessionDurationMinutes: durationMinutes,
      focusMuscles: focusMuscles.length > 0 ? focusMuscles : undefined,
      injuriesOrLimitations: injuries.trim() || undefined,
      userNotes: userNotes.trim() || undefined,
    };

    try {
      const response = await GeminiService.generateWorkoutRoutine(requestPayload);
      setGeneratedResult(response);
    } catch (e: unknown) {
      const err = e as Error;
      setErrorMessage(err.message || 'Errore durante la generazione della scheda. Riprova.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndApply = () => {
    if (!generatedResult) return;

    const newRoutine: Routine = {
      id: `ai-routine-${Date.now()}`,
      title: generatedResult.title || 'Scheda Personalizzata AI',
      description: generatedResult.description || 'Creata su misura da Gemini AI Coach',
      goal,
      level,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isAiGenerated: true,
      aiPromptSummary: `${daysPerWeek}gg/sett, ${goal}, ${level}`,
      days: generatedResult.days.map((day, dIdx) => ({
        id: `day-${dIdx + 1}-${Date.now()}`,
        name: day.dayName,
        exercises: day.exercises.map((ex, eIdx) => ({
          id: `ex-inst-${dIdx}-${eIdx}-${Date.now()}`,
          exerciseId: `ai-ex-${ex.name.toLowerCase().replace(/\s+/g, '-')}`,
          name: ex.name,
          muscleGroup: ex.muscleGroup,
          targetSets: ex.sets || 3,
          targetRepsMin: ex.repsMin || 8,
          targetRepsMax: ex.repsMax || 10,
          targetRpe: ex.targetRpe || 8,
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
      padding: '16px',
    }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.6), 0 0 24px rgba(139, 92, 246, 0.2)',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(18, 21, 30, 0.9) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                Generatore Schede AI Gemini
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#c4b5fd', margin: 0 }}>
                Programmazione scientifica personalizzata in pochi istanti
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {errorMessage && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              color: '#fca5a5',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={18} /> {errorMessage}
            </div>
          )}

          {!generatedResult ? (
            /* WIZARD FORM */
            <>
              {/* 1. Obiettivo & Livello */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                    Obiettivo Primario:
                  </label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as 'hypertrophy' | 'strength' | 'endurance' | 'fat_loss' | 'general_fitness')}
                  >
                    <option value="hypertrophy">Ipertrofia (Massa Muscolare)</option>
                    <option value="strength">Forza & Carichi Massimali</option>
                    <option value="fat_loss">Definizione / Ricomposizione Corporea</option>
                    <option value="endurance">Resistenza & Conditioning</option>
                    <option value="general_fitness">Benessere & Tono Generale</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                    Livello di Esperienza:
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                  >
                    <option value="beginner">Principiante (&lt; 1 anno)</option>
                    <option value="intermediate">Intermedio (1 - 3 anni)</option>
                    <option value="advanced">Avanzato (&gt; 3 anni)</option>
                  </select>
                </div>
              </div>

              {/* 2. Frequenza & Durata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                    Giorni a settimana: <strong style={{ color: 'var(--accent-primary)' }}>{daysPerWeek} giorni</strong>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>2 gg</span>
                    <span>3 gg</span>
                    <span>4 gg</span>
                    <span>5 gg</span>
                    <span>6 gg</span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                    Durata Media Sessione:
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  >
                    <option value="45">45 minuti (Espresso / Alto Impatto)</option>
                    <option value="60">60 minuti (Standard)</option>
                    <option value="75">75 minuti (Completo)</option>
                    <option value="90">90 minuti (Volume Alto / Powerlifting)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                    Split Preferito:
                  </label>
                  <select
                    value={splitPreference}
                    onChange={(e) => setSplitPreference(e.target.value as 'auto' | 'ppl' | 'upper_lower' | 'full_body' | 'bro_split')}
                  >
                    <option value="auto">Automatico (Consigliato dall&apos;AI)</option>
                    <option value="ppl">Push - Pull - Legs</option>
                    <option value="upper_lower">Upper - Lower</option>
                    <option value="full_body">Full Body</option>
                    <option value="bro_split">Mono-frequenza (Bro Split)</option>
                  </select>
                </div>
              </div>

              {/* 3. Attrezzatura Disponibile */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Attrezzatura a disposizione:
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                          padding: '6px 12px',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {isSelected && <CheckCircle2 size={12} />}
                        {EQUIPMENT_LABELS[eq] || eq}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Focus Muscolare (Opzionale) */}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>
                  Focus Muscolare Speciale (seleziona fino a 3):
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                          padding: '5px 10px',
                          fontSize: '0.76rem',
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={14} color="#f59e0b" /> Infortuni o limitazioni articolari:
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Dolore alla cuffia dei rotatori spalla destra, no squat pesanti"
                    value={injuries}
                    onChange={(e) => setInjuries(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>
                    Note o preferenze speciali:
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Includi trazioni zavorrate, amo serie ad alte ripetizioni"
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            /* PREVIEW GENERATED ROUTINE */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(18, 21, 30, 0.8) 100%)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span className="chip chip-green">Scheda Generata con Successo</span>
                  <span className="chip chip-purple">{generatedResult.days.length} Giorni</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                  {generatedResult.title}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {generatedResult.description}
                </p>
                {generatedResult.goalExplanation && (
                  <div style={{
                    marginTop: 10,
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    color: '#c4b5fd',
                  }}>
                    💡 <strong>Strategia AI:</strong> {generatedResult.goalExplanation}
                  </div>
                )}
              </div>

              {/* Days breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {generatedResult.days.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8 }}>
                      {day.dayName}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {day.exercises.map((ex, eIdx) => (
                        <div
                          key={eIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.84rem',
                          }}
                        >
                          <div>
                            <strong style={{ color: '#fff' }}>{ex.name}</strong>
                            {ex.notes && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {ex.notes}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fbbf24' }}>
                              {ex.sets} × {ex.repsMin}-{ex.repsMax}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Clock size={12} /> {ex.restSeconds}s
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
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10,
          background: 'rgba(9, 10, 15, 0.95)',
        }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '10px 16px' }}>
            Chiudi
          </button>

          {!generatedResult ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="btn-ai"
              style={{ padding: '10px 22px' }}
            >
              {isGenerating ? (
                <>
                  <Sparkles size={18} style={{ animation: 'spin 1.5s linear infinite' }} />
                  Generazione in corso...
                </>
              ) : (
                <>
                  <Sparkles size={18} /> Genera Scheda con Gemini AI
                </>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setGeneratedResult(null)}
                className="btn-secondary"
              >
                Modifica Parametri
              </button>
              <button
                onClick={handleSaveAndApply}
                className="btn-primary"
              >
                <Save size={18} /> Salva & Imposta come Attiva
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
