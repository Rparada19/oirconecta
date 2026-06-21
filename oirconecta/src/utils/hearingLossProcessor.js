/**
 * Procesador Web Audio API para simular pérdida auditiva en vivo sobre un audio normal.
 *
 * Niveles basados en hearing_loss_research.md:
 * - normal: paso directo, sin filtros.
 * - leve (20-40 dB HL): pérdida suave de agudos + atenuación pequeña.
 * - moderada (40-60 dB HL): pérdida marcada >2kHz + atenuación + leve compresión (reclutamiento).
 * - severa (60-90 dB HL): solo frecuencias bajas, atenuación fuerte, compresión agresiva y
 *   ruido espectral tipo tinnitus de fondo para simular distorsión coclear.
 */

const PRESETS = {
  normal: {
    gainDb: 0,
    lowpassHz: 22000,
    highshelfHz: 4000,
    highshelfGainDb: 0,
    compThreshold: 0,
    compRatio: 1,
    noiseLevel: 0,
  },
  leve: {
    gainDb: -6,
    lowpassHz: 6000,
    highshelfHz: 3500,
    highshelfGainDb: -10,
    compThreshold: -24,
    compRatio: 2,
    noiseLevel: 0,
  },
  moderada: {
    gainDb: -14,
    lowpassHz: 2800,
    highshelfHz: 2000,
    highshelfGainDb: -22,
    compThreshold: -28,
    compRatio: 4,
    noiseLevel: 0.005,
  },
  severa: {
    gainDb: -20,
    lowpassHz: 1200,
    highshelfHz: 1500,
    highshelfGainDb: -38,
    compThreshold: -30,
    compRatio: 8,
    noiseLevel: 0.018,
  },
};

function dbToGain(db) {
  return Math.pow(10, db / 20);
}

export class HearingLossProcessor {
  constructor() {
    this.ctx = null;
    this.audioEl = null;
    this.source = null;
    this.gain = null;
    this.lowpass = null;
    this.highshelf = null;
    this.compressor = null;
    this.noiseSource = null;
    this.noiseGain = null;
    this.currentLevel = 'normal';
  }

  attach(audioEl) {
    if (this.audioEl === audioEl && this.ctx) return;
    if (this.ctx) {
      try { this.ctx.close(); } catch (e) { /* ignore */ }
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.audioEl = audioEl;
    this.source = this.ctx.createMediaElementSource(audioEl);

    this.gain = this.ctx.createGain();
    this.lowpass = this.ctx.createBiquadFilter();
    this.lowpass.type = 'lowpass';
    this.highshelf = this.ctx.createBiquadFilter();
    this.highshelf.type = 'highshelf';
    this.compressor = this.ctx.createDynamicsCompressor();

    // Cadena: source → lowpass → highshelf → compressor → gain → destino
    this.source.connect(this.lowpass);
    this.lowpass.connect(this.highshelf);
    this.highshelf.connect(this.compressor);
    this.compressor.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    // Ruido espectral (pink-ish) para simular distorsión coclear en pérdidas severas.
    const bufSize = 2 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
    }
    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.ctx.destination);
    this.noiseSource.start(0);

    this.applyLevel(this.currentLevel);
  }

  applyLevel(level) {
    if (!this.ctx) return;
    const p = PRESETS[level] || PRESETS.normal;
    const t = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.linearRampToValueAtTime(dbToGain(p.gainDb), t + 0.15);
    this.lowpass.frequency.cancelScheduledValues(t);
    this.lowpass.frequency.linearRampToValueAtTime(p.lowpassHz, t + 0.15);
    this.highshelf.frequency.value = p.highshelfHz;
    this.highshelf.gain.cancelScheduledValues(t);
    this.highshelf.gain.linearRampToValueAtTime(p.highshelfGainDb, t + 0.15);
    this.compressor.threshold.value = p.compThreshold;
    this.compressor.ratio.value = p.compRatio;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.15;
    this.noiseGain.gain.cancelScheduledValues(t);
    this.noiseGain.gain.linearRampToValueAtTime(p.noiseLevel, t + 0.15);
    this.currentLevel = level;
  }

  async ensureRunning() {
    if (this.ctx && this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (e) { /* ignore */ }
    }
  }

  destroy() {
    try { this.noiseSource && this.noiseSource.stop(); } catch (e) { /* ignore */ }
    try { this.ctx && this.ctx.close(); } catch (e) { /* ignore */ }
    this.ctx = null;
    this.audioEl = null;
  }
}

export const LEVELS = [
  { id: 'normal', label: 'Normal', shortDb: 'Audición sana', tagline: 'Así escuchas tú.' },
  { id: 'leve', label: 'Leve', shortDb: '20–40 dB', tagline: 'Cuesta entender en susurros o en lugares con ruido.' },
  { id: 'moderada', label: 'Moderada', shortDb: '40–60 dB', tagline: 'Las consonantes se pierden, las voces suenan apagadas.' },
  { id: 'severa', label: 'Severa', shortDb: '60–90 dB', tagline: 'Solo se perciben sonidos graves y bordes de la voz.' },
];
