import React, { useState } from 'react';
import {
  Search,
  Plus,
  Sparkles,
} from 'lucide-react';
import type { Exercise, MuscleGroup, EquipmentType } from '../../types/workout';
import { StorageService } from '../../services/storage';
import { GeminiService } from '../../services/gemini';
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from '../../utils/calculations';

export const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>(StorageService.getExercises());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment] = useState<string>('all');

  // Custom Exercise Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newExName, setNewExName] = useState<string>('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('chest');
  const [newExEquipment, setNewExEquipment] = useState<EquipmentType>('barbell');
  const [newExInstructions, setNewExInstructions] = useState<string>('');

  // AI Exercise Substitution Drawer
  const [substituteModalExercise, setSubstituteModalExercise] = useState<Exercise | null>(null);
  const [aiSubstitutes, setAiSubstitutes] = useState<Array<{ name: string; reason: string }> | null>(null);
  const [isSubLoading, setIsSubLoading] = useState<boolean>(false);

  const handleAddCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    StorageService.addCustomExercise({
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      equipment: newExEquipment,
      instructions: newExInstructions.trim() || undefined,
    });

    setExercises(StorageService.getExercises());
    setIsAddModalOpen(false);
    setNewExName('');
    setNewExInstructions('');
  };

  const handleRequestSubstitute = async (exercise: Exercise) => {
    setSubstituteModalExercise(exercise);
    setAiSubstitutes(null);
    setIsSubLoading(true);

    try {
      const subs = await GeminiService.suggestExerciseSubstitution(
        exercise.name,
        'Palestra standard (Manubri, Cavi, Macchine e Bilanciere)'
      );
      setAiSubstitutes(subs);
    } catch {
      setAiSubstitutes([
        { name: 'Variante con Manubri', reason: 'Consente maggiore libertà di movimento e stimolo isolato.' },
        { name: 'Variante ai Cavi', reason: 'Mantiene la tensione costante lungo tutto il ROM.' },
      ]);
    } finally {
      setIsSubLoading(false);
    }
  };

  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle = selectedMuscle === 'all' || ex.muscleGroup === selectedMuscle;
    const matchesEquipment = selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const muscleGroupsList: MuscleGroup[] = [
    'chest',
    'back',
    'quads',
    'hamstrings',
    'glutes',
    'shoulders',
    'biceps',
    'triceps',
    'calves',
    'core',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Libreria Esercizi ({exercises.length})
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0 }}>
            Sfoglia il database degli esercizi con istruzioni biomeccaniche e suggerimenti di varianti AI
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <Plus size={16} /> Aggiungi Esercizio
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Cerca esercizio per nome o muscolo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>

        {/* Filter chips by muscle */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            type="button"
            onClick={() => setSelectedMuscle('all')}
            style={{
              background: selectedMuscle === 'all' ? 'var(--accent-primary)' : 'var(--bg-input)',
              color: selectedMuscle === 'all' ? '#000' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '5px 12px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Tutti ({exercises.length})
          </button>
          {muscleGroupsList.map((mg) => (
            <button
              key={mg}
              type="button"
              onClick={() => setSelectedMuscle(mg)}
              style={{
                background: selectedMuscle === mg ? 'var(--accent-primary)' : 'var(--bg-input)',
                color: selectedMuscle === mg ? '#000' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {MUSCLE_GROUP_LABELS[mg] || mg}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid-cards">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="glass-card"
            style={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="chip chip-blue" style={{ fontSize: '0.72rem' }}>
                  {MUSCLE_GROUP_LABELS[ex.muscleGroup] || ex.muscleGroup}
                </span>
                <span className="chip chip-amber" style={{ fontSize: '0.72rem' }}>
                  {EQUIPMENT_LABELS[ex.equipment] || ex.equipment}
                </span>
              </div>

              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '4px 0' }}>
                {ex.name}
              </h2>

              {ex.instructions && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '6px 0 0 0' }}>
                  {ex.instructions}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {ex.isCustom ? '★ Personalizzato' : 'Libreria uTrain'}
              </span>

              <button
                onClick={() => handleRequestSubstitute(ex)}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', color: '#a78bfa', padding: '4px 8px' }}
                title="Chiedi a Gemini varianti se la macchina o attrezzo è occupato"
              >
                <Sparkles size={14} /> Trova Alternative AI
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Substitute Modal */}
      {substituteModalExercise && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 500, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} color="#a78bfa" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  Alternative per {substituteModalExercise.name}
                </h3>
              </div>
              <button onClick={() => setSubstituteModalExercise(null)} className="btn-ghost" style={{ padding: 4 }}>
                Chiudi
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
              Attrezzo occupato in palestra? Ecco i migliori sostituti con la stessa attivazione muscolare:
            </p>

            {isSubLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#c4b5fd' }}>
                <Sparkles size={24} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 8px' }} />
                Ricerca varianti biomeccaniche con Gemini AI...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiSubstitutes?.map((sub, i) => (
                  <div key={i} style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                      {sub.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {sub.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Custom Exercise Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <form onSubmit={handleAddCustomExercise} className="glass-card" style={{ width: '100%', maxWidth: 480, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Nuovo Esercizio Personalizzato
            </h3>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Nome Esercizio:
              </label>
              <input
                type="text"
                required
                placeholder="Es. Spinte con Manubri a Terra (Floor Press)"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Gruppo Muscolare:
                </label>
                <select value={newExMuscle} onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}>
                  {muscleGroupsList.map((mg) => (
                    <option key={mg} value={mg}>{MUSCLE_GROUP_LABELS[mg] || mg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                  Attrezzatura:
                </label>
                <select value={newExEquipment} onChange={(e) => setNewExEquipment(e.target.value as EquipmentType)}>
                  <option value="barbell">Bilanciere</option>
                  <option value="dumbbell">Manubri</option>
                  <option value="cable">Cavi</option>
                  <option value="machine">Macchinario</option>
                  <option value="bodyweight">Corpo Libero</option>
                  <option value="smith_machine">Multipower</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                Istruzioni / Focus Esecuzione:
              </label>
              <textarea
                rows={2}
                placeholder="Es. Piedi a terra, gomiti a 45 gradi, tocca il pavimento e spingi con forza."
                value={newExInstructions}
                onChange={(e) => setNewExInstructions(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 6 }}>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
                Annulla
              </button>
              <button type="submit" className="btn-primary">
                Salva Esercizio
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
