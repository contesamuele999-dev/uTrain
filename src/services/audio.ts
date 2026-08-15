/**
 * Sintetizzatore audio con Web Audio API e feedback aptico per uTrain
 * Funziona al 100% offline e non richiede file audio esterni scaricabili
 */

class SoundService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Beep breve di countdown (es. 3, 2, 1)
   */
  playCountdownBeep(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // Nota A4

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);

      this.vibrate(50);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Chime melodico al termine del recupero (Ding-Dong!)
   */
  playRestCompletedChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6 - squillo brillante

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);

        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.45);
      });

      this.vibrate([100, 50, 200]);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Suono di celebrazione nuovo PR (Personal Record)
   */
  playPRFanfare(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const fanfare = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.12 }, // G5
        { f: 1046.5, d: 0.4 },  // C6
      ];

      let t = now;
      fanfare.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(item.f, t);

        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + item.d);

        t += item.d * 0.9;
      });

      this.vibrate([100, 50, 100, 50, 300]);
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  }

  /**
   * Click / Tap feedback sonoro discreto
   */
  playTapSound(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  /**
   * Vibrazione aptica per dispositivi mobili
   */
  vibrate(pattern: number | number[]): void {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }
}

export const Sound = new SoundService();
