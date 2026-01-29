// Servicio de Audio Simple y Efectivo
// Usa archivos de audio reales y aplica efectos de pérdida auditiva

class SimpleAudioService {
  constructor() {
    this.audioContext = null;
    this.currentAudio = null;
    this.initialized = false;
  }

  // Inicializar el servicio
  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      console.log('✅ AudioContext inicializado');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando AudioContext:', error);
      return false;
    }
  }

  // Reproducir audio con efectos de pérdida auditiva
  async playAudioWithEffects(audioUrl, category) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Detener audio anterior
      if (this.currentAudio) {
        this.currentAudio.stop();
      }

      // Cargar archivo de audio
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      // Crear nodos de audio
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const filterNode = this.audioContext.createBiquadFilter();
      const compressorNode = this.audioContext.createDynamicsCompressor();

      // Configurar efectos según la categoría
      const effects = this.getEffectsForCategory(category);
      
      // Filtro de frecuencias (simula pérdida en altas frecuencias)
      filterNode.type = 'lowpass';
      filterNode.frequency.value = effects.filterFreq;
      filterNode.Q.value = 1;

      // Compresión dinámica (simula reclutamiento)
      compressorNode.threshold.value = -24;
      compressorNode.knee.value = 30;
      compressorNode.ratio.value = effects.compression;
      compressorNode.attack.value = 0.003;
      compressorNode.release.value = 0.25;

      // Volumen
      gainNode.gain.value = effects.volume;

      // Conectar nodos
      source.buffer = audioBuffer;
      source
        .connect(filterNode)
        .connect(compressorNode)
        .connect(gainNode)
        .connect(this.audioContext.destination);

      // Reproducir
      source.start(0);
      this.currentAudio = source;

      console.log(`🎵 Reproduciendo audio con perfil: ${category}`);
      
      // Configurar evento de finalización
      source.onended = () => {
        this.currentAudio = null;
        console.log('🏁 Audio terminado');
      };

      return source;

    } catch (error) {
      console.error('❌ Error reproduciendo audio:', error);
      throw error;
    }
  }

  // Obtener efectos para categoría específica
  getEffectsForCategory(category) {
    const effects = {
      normal: { 
        filterFreq: 8000, 
        compression: 1, 
        volume: 1.0,
        description: 'Sin efectos - Audio original'
      },
      leve: { 
        filterFreq: 2000, 
        compression: 2, 
        volume: 0.7,
        description: 'Filtra frecuencias > 2000 Hz, volumen al 70%'
      },
      moderada: { 
        filterFreq: 1500, 
        compression: 4, 
        volume: 0.5,
        description: 'Filtra frecuencias > 1500 Hz, volumen al 50%'
      },
      moderadamente_severa: { 
        filterFreq: 1000, 
        compression: 8, 
        volume: 0.3,
        description: 'Filtra frecuencias > 1000 Hz, volumen al 30%'
      },
      severa: { 
        filterFreq: 500, 
        compression: 12, 
        volume: 0.15,
        description: 'Filtra frecuencias > 500 Hz, volumen al 15%'
      },
      profunda: { 
        filterFreq: 250, 
        compression: 20, 
        volume: 0.05,
        description: 'Filtra frecuencias > 250 Hz, volumen al 5%'
      }
    };
    
    return effects[category] || effects.normal;
  }

  // Detener audio actual
  stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.stop();
      this.currentAudio = null;
      console.log('⏹️ Audio detenido');
    }
  }

  // Limpiar recursos
  cleanup() {
    this.stopAudio();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}

export default new SimpleAudioService(); 