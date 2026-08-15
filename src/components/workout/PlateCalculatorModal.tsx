import React, { useState } from 'react';
import { X, Dumbbell } from 'lucide-react';
import { calculateBarbellPlates } from '../../utils/calculations';

interface PlateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWeightKg?: number;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultWeightKg = 80,
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(defaultWeightKg);
  const [barWeight, setBarWeight] = useState<number>(20);

  if (!isOpen) return null;

  const calculation = calculateBarbellPlates(targetWeight, barWeight);

  const PLATE_COLORS: Record<number, string> = {
    25: '#ef4444', // Rosso
    20: '#3b82f6', // Blu
    15: '#eab308', // Giallo
    10: '#22c55e', // Verde
    5: '#ffffff',  // Bianco
    2.5: '#000000',// Nero
    1.25: '#94a3b8',// Grigio
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
    }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 480,
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          padding: '20px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Dumbbell size={22} color="var(--accent-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#fff' }}>
              Calcolatore Dischi Bilanciere
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Peso Totale Target (kg):
            </label>
            <input
              type="number"
              step="2.5"
              min="0"
              value={targetWeight}
              onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
              style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Peso Bilanciere:
            </label>
            <select
              value={barWeight}
              onChange={(e) => setBarWeight(parseFloat(e.target.value))}
            >
              <option value="20">20 kg (Olimpico Maschile)</option>
              <option value="15">15 kg (Olimpico Femminile)</option>
              <option value="10">10 kg (Bilanciere EZ / Corto)</option>
              <option value="0">0 kg (Smith Machine bilanciata)</option>
            </select>
          </div>
        </div>

        {/* Weight per Side Summary */}
        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px',
          textAlign: 'center',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Carico da inserire per singolo lato:
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 800,
            color: 'var(--accent-primary)',
            fontFamily: 'var(--font-mono)',
            marginTop: 2,
          }}>
            {calculation.weightPerSide} kg
          </div>
        </div>

        {/* Visual Barbell Representation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          padding: '24px 10px',
          background: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          minHeight: 110,
        }}>
          {/* Barbell sleeve left */}
          <div style={{
            width: 24,
            height: 12,
            background: '#64748b',
            borderRadius: '2px 0 0 2px',
          }} />

          {/* Plates per side visual */}
          {calculation.platesPerSide.length === 0 ? (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Solo bilanciere scarico ({barWeight} kg)
            </span>
          ) : (
            calculation.platesPerSide.map((plateGroup, idx) =>
              Array.from({ length: plateGroup.count }).map((_, cIdx) => {
                const color = PLATE_COLORS[plateGroup.weight] || '#94a3b8';
                const height = Math.max(30, Math.min(80, plateGroup.weight * 3 + 20));
                return (
                  <div
                    key={`${idx}-${cIdx}`}
                    style={{
                      width: 14,
                      height: height,
                      background: color,
                      borderRadius: 3,
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: plateGroup.weight === 5 ? '#000' : '#fff',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                    }}
                    title={`${plateGroup.weight} kg`}
                  >
                    {plateGroup.weight}
                  </div>
                );
              })
            )
          )}

          {/* Collar / Lock */}
          <div style={{
            width: 8,
            height: 24,
            background: '#f59e0b',
            borderRadius: 2,
          }} />

          {/* Bar Shaft */}
          <div style={{
            flex: 1,
            height: 8,
            background: '#94a3b8',
            maxWidth: 100,
          }} />
        </div>

        {/* Plates breakdown list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Dischi da caricare su OGNI lato:
          </div>
          {calculation.platesPerSide.map((p, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 12px',
                background: 'var(--bg-input)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.86rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: PLATE_COLORS[p.weight] || '#94a3b8',
                }} />
                <strong>Disco da {p.weight} kg</strong>
              </div>
              <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                × {p.count}
              </span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-primary" style={{ width: '100%', marginTop: 8 }}>
          Fatto
        </button>
      </div>
    </div>
  );
};
