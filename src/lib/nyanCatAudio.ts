/**
 * Nyan Cat 8-Bit Chiptune Synthesizer via Web Audio API
 * Genera de forma nativa e instantánea la mítica melodía de Nyan Cat
 * sin depender de archivos de audio externos, sin descargas y sin latencia.
 */

// Frecuencias exactas en Hz (Tonalidad F# / D#m)
const FS4 = 369.99;
const GS4 = 415.30;
const B4  = 493.88;
const CS5 = 554.37;
const D5  = 587.33;
const DS5 = 622.25;
const E5  = 659.25;
const FS5 = 739.99;
const GS5 = 830.61;
const DS4 = 311.13;
const E4  = 329.63;

// Patrón melódico de Nyan Cat: [frecuencia_hz, duracion_en_semicorcheas]
const NYAN_MELODY: [number, number][] = [
  [DS4, 1], [E4, 1], [FS4, 2], [B4, 1], [DS5, 1], [E5, 1], [DS5, 1], [CS5, 1], [B4, 1], [CS5, 2],
  [DS5, 1], [DS5, 1], [E5, 1], [FS5, 1], [B4, 1], [CS5, 1], [DS5, 1], [E5, 1], [CS5, 1], [DS5, 1], [B4, 1], [CS5, 1], [B4, 2],
  [DS5, 1], [FS5, 1], [GS5, 1], [FS5, 1], [DS5, 1], [FS5, 1], [CS5, 1], [DS5, 1], [B4, 1], [CS5, 1], [B4, 1], [DS5, 1], [FS5, 1], [GS5, 1],
  [FS5, 1], [DS5, 1], [FS5, 1], [CS5, 1], [DS5, 1], [B4, 1], [D5, 1], [DS5, 1], [D5, 1], [CS5, 1], [B4, 1], [CS5, 1],
  [D5, 1], [B4, 1], [CS5, 1], [DS5, 1], [FS5, 1], [CS5, 1], [DS5, 1], [CS5, 1], [B4, 1], [CS5, 1], [B4, 2],
  [B4, 1], [FS4, 1], [GS4, 1], [B4, 1], [FS4, 1], [GS4, 1], [B4, 1], [CS5, 1], [DS5, 1], [CS5, 1], [B4, 1], [CS5, 1], [DS5, 2],
  [FS4, 1], [GS4, 1], [B4, 1], [CS5, 1], [DS5, 1], [CS5, 1], [B4, 1], [CS5, 1], [B4, 1], [GS4, 1], [B4, 2],
  [FS4, 1], [GS4, 1], [B4, 1], [CS5, 1], [DS5, 1], [CS5, 1], [B4, 1], [CS5, 1], [B4, 1], [DS5, 1], [FS5, 1], [GS5, 1],
  [FS5, 1], [DS5, 1], [FS5, 1], [CS5, 1], [DS5, 1], [B4, 1], [CS5, 1], [B4, 2],
];

// Frecuencias para el bajo chiptune (8va baja)
const B2  = 123.47;
const FS2 = 92.50;
const GS2 = 103.83;
const E2  = 82.41;
const NYAN_BASS: number[] = [B2, FS2, B2, FS2, GS2, E2, B2, FS2];

class NyanCatPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private masterGain: GainNode | null = null;
  private sixteenthTime = 0.108; // ~138 BPM
  private currentStep = 0;
  private bassStep = 0;

  public start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.isPlaying = true;
      this.currentStep = 0;
      this.bassStep = 0;
      this.scheduleNextNote();
    } catch (e) {
      console.warn("No se pudo iniciar el audio de Nyan Cat:", e);
    }
  }

  public stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        // Fade out ultra suave de 30ms para evitar 'pop' en parlantes
        this.masterGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
        setTimeout(() => {
          this.ctx?.close().catch(() => {});
          this.ctx = null;
          this.masterGain = null;
        }, 50);
      } catch {
        this.ctx?.close().catch(() => {});
        this.ctx = null;
      }
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private playTone(freq: number, duration: number, isBass = false) {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isBass ? "triangle" : "square";
    osc.frequency.setValueAtTime(freq, now);

    const volume = isBass ? 0.08 : 0.14;
    gain.gain.setValueAtTime(volume, now);
    // Decaimiento rápido chiptune 8-bit
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.88);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration * 0.95);
  }

  private scheduleNextNote = () => {
    if (!this.isPlaying || !this.ctx) return;

    const [freq, durationSteps] = NYAN_MELODY[this.currentStep];
    const noteDuration = durationSteps * this.sixteenthTime;

    // Tocar nota de melodía principal (onda cuadrada 8-bit)
    this.playTone(freq, noteDuration, false);

    // Tocar bajo sincrónico (onda triangular)
    if (this.bassStep % 2 === 0) {
      const bassFreq = NYAN_BASS[(this.bassStep / 2) % NYAN_BASS.length];
      this.playTone(bassFreq, this.sixteenthTime * 1.8, true);
    }
    this.bassStep = (this.bassStep + 1) % 64;

    this.currentStep = (this.currentStep + 1) % NYAN_MELODY.length;

    // Programar la siguiente nota
    this.timerId = window.setTimeout(this.scheduleNextNote, noteDuration * 1000);
  };
}

export const nyanPlayer = new NyanCatPlayer();
