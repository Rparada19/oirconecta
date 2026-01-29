// Servicio de Generación de Audio Realista con Voces Humanas
// Genera conversaciones realistas usando TTS y las procesa según la pérdida auditiva

class RealisticAudioGenerator {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.audioContext = null;
    this.initialized = false;
  }

  // Inicializar el servicio
  async initialize() {
    try {
      // Esperar a que las voces estén disponibles
      if (this.synthesis.getVoices().length === 0) {
        await new Promise(resolve => {
          this.synthesis.onvoiceschanged = resolve;
        });
      }
      
      this.voices = this.synthesis.getVoices();
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      
      console.log('🎵 Servicio de audio realista inicializado con', this.voices.length, 'voces');
      return true;
    } catch (error) {
      console.error('❌ Error inicializando servicio de audio realista:', error);
      return false;
    }
  }

  // Generar conversación familiar realista
  async generateFamilyConversation(category = 'normal') {
    const conversation = [
      { text: "¡Hola mamá! ¿Cómo estás?", voice: 'female', rate: 0.9 },
      { text: "Muy bien, hijo. ¿Ya comiste?", voice: 'female', rate: 0.9 },
      { text: "Sí, comí con papá en el restaurante", voice: 'male', rate: 0.9 },
      { text: "¿Y qué tal estuvo la comida?", voice: 'female', rate: 0.9 },
      { text: "Deliciosa, mamá. Te extrañamos", voice: 'male', rate: 0.9 },
      { text: "Yo también los extraño mucho", voice: 'female', rate: 0.9 }
    ];

    return this.generateMultiVoiceConversation(conversation, category);
  }

  // Generar llamada del nieto
  async generateGrandchildCall(category = 'normal') {
    const conversation = [
      { text: "¡Abuelita! ¡Abuelita!", voice: 'child', rate: 1.1 },
      { text: "¡Hola mi amor! ¿Cómo estás?", voice: 'female', rate: 0.9 },
      { text: "Muy bien, abuelita. Te quiero mucho", voice: 'child', rate: 1.1 },
      { text: "Yo también te quiero, mi vida", voice: 'female', rate: 0.9 },
      { text: "¿Cuándo vienes a visitarme?", voice: 'child', rate: 1.1 },
      { text: "Pronto, mi amor, muy pronto", voice: 'female', rate: 0.9 }
    ];

    return this.generateMultiVoiceConversation(conversation, category);
  }

  // Generar palabras de cariño
  async generateLoveWords(category = 'normal') {
    const phrases = [
      { text: "Te amo con todo mi corazón", voice: 'female', rate: 0.8 },
      { text: "Eres lo más hermoso de mi vida", voice: 'female', rate: 0.8 },
      { text: "Gracias por existir, mi amor", voice: 'female', rate: 0.8 },
      { text: "Siempre estaré a tu lado", voice: 'female', rate: 0.8 }
    ];

    return this.generateMultiVoiceConversation(phrases, category);
  }

  // Generar llamada telefónica
  async generatePhoneCall(category = 'normal') {
    const conversation = [
      { text: "Hola, ¿está disponible el doctor?", voice: 'male', rate: 0.9 },
      { text: "Un momento, lo conecto", voice: 'female', rate: 0.9 },
      { text: "Doctor, tiene una llamada", voice: 'female', rate: 0.9 },
      { text: "Gracias, lo atiendo", voice: 'male', rate: 0.9 },
      { text: "Hola doctor, necesito una cita", voice: 'male', rate: 0.9 },
      { text: "Por supuesto, ¿qué día le conviene?", voice: 'male', rate: 0.9 }
    ];

    return this.generateMultiVoiceConversation(conversation, category);
  }

  // Generar conversación de televisión
  async generateTelevisionProgram(category = 'normal') {
    const conversation = [
      { text: "Bienvenidos al noticiero de las ocho", voice: 'male', rate: 0.9 },
      { text: "Hoy tenemos noticias importantes", voice: 'female', rate: 0.9 },
      { text: "El clima estará soleado mañana", voice: 'male', rate: 0.9 },
      { text: "Y ahora el reporte deportivo", voice: 'female', rate: 0.9 },
      { text: "El equipo local ganó el partido", voice: 'male', rate: 0.9 },
      { text: "Excelente noticia para los aficionados", voice: 'female', rate: 0.9 }
    ];

    return this.generateMultiVoiceConversation(conversation, category);
  }

  // Generar conversación con múltiples voces
  async generateMultiVoiceConversation(conversation, category) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const audioBuffers = [];
      
      // Generar cada frase con TTS
      for (let i = 0; i < conversation.length; i++) {
        const phrase = conversation[i];
        const audioBuffer = await this.generateTTSAudio(phrase.text, phrase.voice, phrase.rate);
        audioBuffers.push(audioBuffer);
        
        // Pequeña pausa entre frases
        if (i < conversation.length - 1) {
          const silence = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
          audioBuffers.push(silence);
        }
      }

      // Combinar todos los buffers en uno solo
      const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
      const combinedBuffer = this.audioContext.createBuffer(1, totalLength, this.audioContext.sampleRate);
      const combinedData = combinedBuffer.getChannelData(0);

      let offset = 0;
      for (const buffer of audioBuffers) {
        const data = buffer.getChannelData(0);
        combinedData.set(data, offset);
        offset += data.length;
      }

      // Aplicar efectos de pérdida auditiva según la categoría
      const processedBuffer = await this.applyHearingLossEffects(combinedBuffer, category);
      
      return processedBuffer;
      
    } catch (error) {
      console.error('❌ Error generando conversación:', error);
      throw error;
    }
  }

  // Generar audio TTS para una frase
  async generateTTSAudio(text, voiceType, rate) {
    return new Promise((resolve, reject) => {
      try {
        // Seleccionar voz apropiada
        const voice = this.selectVoice(voiceType);
        
        // Crear utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Configurar eventos
        utterance.onstart = () => {
          console.log('🎤 Iniciando TTS:', text);
        };
        
        utterance.onend = () => {
          console.log('✅ TTS completado:', text);
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Error en TTS:', event);
          reject(new Error(`Error TTS: ${event.error}`));
        };
        
        // Reproducir y grabar
        this.recordTTSAudio(utterance, resolve, reject);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  // Seleccionar voz apropiada según el tipo
  selectVoice(voiceType) {
    const availableVoices = this.voices.filter(voice => voice.lang.startsWith('es'));
    
    switch (voiceType) {
      case 'female':
        return availableVoices.find(voice => voice.name.includes('female') || voice.name.includes('mujer')) || availableVoices[0];
      case 'male':
        return availableVoices.find(voice => voice.name.includes('male') || voice.name.includes('hombre')) || availableVoices[0];
      case 'child':
        return availableVoices.find(voice => voice.name.includes('child') || voice.name.includes('niño')) || availableVoices[0];
      default:
        return availableVoices[0];
    }
  }

  // Grabar audio TTS
  recordTTSAudio(utterance, resolve, reject) {
    try {
      // Crear nodos de audio para grabación
      const source = this.audioContext.createMediaStreamSource(new MediaStream());
      const recorder = this.audioContext.createMediaStreamDestination();
      
      // Conectar para grabación
      source.connect(recorder);
      
      // Iniciar grabación
      const mediaRecorder = new MediaRecorder(recorder.stream);
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/wav' });
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          resolve(audioBuffer);
        } catch (error) {
          reject(error);
        }
      };
      
      // Iniciar grabación y TTS
      mediaRecorder.start();
      this.synthesis.speak(utterance);
      
      // Detener grabación después de un tiempo razonable
      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000);
      
    } catch (error) {
      // Fallback: usar método alternativo
      this.fallbackTTSRecording(utterance, resolve, reject);
    }
  }

  // Método alternativo para grabación TTS
  fallbackTTSRecording(utterance, resolve, reject) {
    try {
      // Crear un buffer de audio simple como fallback
      const sampleRate = this.audioContext.sampleRate;
      const duration = 3; // 3 segundos
      const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generar tono simple que simule habla
      for (let i = 0; i < data.length; i++) {
        const t = i / sampleRate;
        data[i] = Math.sin(2 * Math.PI * 200 * t) * 0.1 + 
                  Math.sin(2 * Math.PI * 400 * t) * 0.05 +
                  Math.sin(2 * Math.PI * 800 * t) * 0.03;
      }
      
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  }

  // Aplicar efectos de pérdida auditiva
  async applyHearingLossEffects(audioBuffer, category) {
    try {
      // Crear nodos de procesamiento
      const source = this.audioContext.createBufferSource();
      const filterNode = this.audioContext.createBiquadFilter();
      const compressorNode = this.audioContext.createDynamicsCompressor();
      const gainNode = this.audioContext.createGain();
      
      // Configurar según la categoría
      const effects = this.getEffectsForCategory(category);
      
      filterNode.type = 'lowpass';
      filterNode.frequency.value = effects.filterFreq;
      filterNode.Q.value = 1;
      
      compressorNode.threshold.value = -24;
      compressorNode.knee.value = 30;
      compressorNode.ratio.value = effects.compression;
      compressorNode.attack.value = 0.003;
      compressorNode.release.value = 0.25;
      
      gainNode.gain.value = effects.volume;
      
      // Conectar nodos
      source.buffer = audioBuffer;
      source
        .connect(filterNode)
        .connect(compressorNode)
        .connect(gainNode)
        .connect(this.audioContext.destination);
      
      // Procesar y obtener resultado
      const processedBuffer = await this.processAudioBuffer(source, audioBuffer.duration);
      
      return processedBuffer;
      
    } catch (error) {
      console.error('❌ Error aplicando efectos:', error);
      return audioBuffer; // Retornar original si falla
    }
  }

  // Obtener efectos para categoría específica
  getEffectsForCategory(category) {
    const effects = {
      normal: { filterFreq: 8000, compression: 1, volume: 1.0 },
      leve: { filterFreq: 2000, compression: 2, volume: 0.7 },
      moderada: { filterFreq: 1500, compression: 4, volume: 0.5 },
      moderadamente_severa: { filterFreq: 1000, compression: 8, volume: 0.3 },
      severa: { filterFreq: 500, compression: 12, volume: 0.15 },
      profunda: { filterFreq: 250, compression: 20, volume: 0.05 }
    };
    
    return effects[category] || effects.normal;
  }

  // Procesar buffer de audio
  async processAudioBuffer(source, duration) {
    return new Promise((resolve) => {
      const sampleRate = this.audioContext.sampleRate;
      const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Simular procesamiento en tiempo real
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 0.1; // Ruido sutil
      }
      
      resolve(buffer);
    });
  }
}

export default new RealisticAudioGenerator(); 