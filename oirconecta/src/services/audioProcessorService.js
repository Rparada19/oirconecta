// Servicio de Procesamiento de Audio en Tiempo Real
// Aplica diferentes efectos según la categoría de pérdida auditiva

import { hearingLossProfiles } from '../utils/hearingLossProfiles';

class AudioProcessorService {
  constructor() {
    this.audioContext = null;
    this.currentProfile = null;
    this.audioNodes = new Map();
  }

  // Inicializar el contexto de audio
  async initialize() {
    try {
      console.log('🎵 Inicializando AudioContext...');
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('✅ AudioContext inicializado:', this.audioContext.state);
      return true;
    } catch (error) {
      console.error('❌ Error inicializando AudioContext:', error);
      return false;
    }
  }

  // Aplicar perfil de pérdida auditiva
  setHearingLossProfile(category) {
    console.log('🎯 Estableciendo perfil de pérdida auditiva:', category);
    this.currentProfile = hearingLossProfiles[category] || hearingLossProfiles.normal;
    console.log(`✅ Perfil aplicado: ${this.currentProfile.name}`, this.currentProfile);
  }

  // Procesar audio en tiempo real según el perfil
  async processAudio(audioFile, category) {
    console.log('🎵 Iniciando procesamiento de audio:', { audioFile, category });
    
    if (!this.audioContext) {
      console.log('🔧 Inicializando AudioContext...');
      await this.initialize();
    }

    try {
      // Obtener el perfil de pérdida auditiva
      const profile = hearingLossProfiles[category] || hearingLossProfiles.normal;
      console.log('📊 Perfil de pérdida auditiva:', profile);
      
      // Cargar el archivo de audio
      console.log('📁 Cargando archivo de audio:', audioFile);
      const response = await fetch(audioFile);
      console.log('📡 Respuesta del fetch:', response.status, response.ok);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log('📦 ArrayBuffer obtenido, tamaño:', arrayBuffer.byteLength);
      
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      console.log('🎼 AudioBuffer decodificado:', audioBuffer);
      
      // Crear nodos de procesamiento
      console.log('🔧 Creando nodos de audio...');
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      const filterNode = this.audioContext.createBiquadFilter();
      const compressorNode = this.audioContext.createDynamicsCompressor();
      const distortionNode = this.createDistortionNode();
      
      // Configurar el filtro de frecuencias
      console.log('🎛️ Configurando filtro:', profile.filterFreq, 'Hz');
      filterNode.type = 'lowpass';
      filterNode.frequency.value = profile.filterFreq;
      filterNode.Q.value = 1;
      
      // Configurar la compresión
      console.log('🎚️ Configurando compresión:', profile.compression, ':1');
      compressorNode.threshold.value = -24;
      compressorNode.knee.value = 30;
      compressorNode.ratio.value = profile.compression;
      compressorNode.attack.value = 0.003;
      compressorNode.release.value = 0.25;
      
      // Configurar la distorsión
      console.log('🎭 Configurando distorsión:', profile.distortion);
      this.configureDistortion(distortionNode, profile.distortion);
      
      // Configurar el volumen
      console.log('🔊 Configurando volumen:', profile.volume);
      gainNode.gain.value = profile.volume;
      
      // Conectar los nodos
      console.log('🔗 Conectando nodos de audio...');
      source.buffer = audioBuffer;
      source
        .connect(filterNode)
        .connect(compressorNode)
        .connect(distortionNode)
        .connect(gainNode)
        .connect(this.audioContext.destination);
      
      // Guardar referencia para control
      const audioId = `${category}_${Date.now()}`;
      this.audioNodes.set(audioId, {
        source,
        gainNode,
        filterNode,
        compressorNode,
        distortionNode,
        profile
      });
      
      console.log('✅ Audio procesado exitosamente, ID:', audioId);
      
      return {
        audioId,
        source,
        play: () => {
          console.log('▶️ Reproduciendo audio procesado...');
          source.start(0);
        },
        stop: () => {
          console.log('⏹️ Deteniendo audio...');
          source.stop();
        },
        pause: () => {
          console.log('⏸️ Pausando audio...');
          source.stop();
        }
      };
      
    } catch (error) {
      console.error('Error procesando audio:', error);
      throw error;
    }
  }

  // Crear nodo de distorsión personalizado
  createDistortionNode() {
    const distortionNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    distortionNode.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      const output = event.outputBuffer.getChannelData(0);
      
      for (let i = 0; i < input.length; i++) {
        // Aplicar distorsión según el perfil
        if (this.currentProfile) {
          const distortionAmount = this.currentProfile.distortion;
          output[i] = input[i] * (1 + distortionAmount * Math.sin(input[i] * 10));
        } else {
          output[i] = input[i];
        }
      }
    };
    
    return distortionNode;
  }

  // Configurar la distorsión
  configureDistortion(distortionNode, distortionAmount) {
    // La distorsión se aplica en el procesamiento del script
    // Este método permite ajustar parámetros adicionales si es necesario
  }

  // Aplicar efectos específicos según la categoría
  applyCategorySpecificEffects(audioId, category) {
    const audioNode = this.audioNodes.get(audioId);
    if (!audioNode) return;

    const profile = hearingLossProfiles[category];
    if (!profile) return;

    // Aplicar filtro de frecuencias específico
    if (audioNode.filterNode) {
      audioNode.filterNode.frequency.setValueAtTime(profile.filterFreq, this.audioContext.currentTime);
    }

    // Aplicar compresión específica
    if (audioNode.compressorNode) {
      audioNode.compressorNode.ratio.setValueAtTime(profile.compression, this.audioContext.currentTime);
    }

    // Aplicar volumen específico
    if (audioNode.gainNode) {
      audioNode.gainNode.gain.setValueAtTime(profile.volume, this.audioContext.currentTime);
    }
  }

  // Obtener descripción de efectos aplicados
  getAppliedEffectsDescription(category) {
    const profile = hearingLossProfiles[category];
    if (!profile) return 'Sin efectos aplicados';

    return {
      filtro: `Filtra frecuencias superiores a ${profile.filterFreq} Hz`,
      compresion: `Compresión ${profile.compression}:1`,
      distorsion: `${Math.round(profile.distortion * 100)}% de distorsión`,
      volumen: `Volumen al ${Math.round(profile.volume * 100)}%`
    };
  }

  // Limpiar recursos
  cleanup() {
    this.audioNodes.forEach((nodes, id) => {
      if (nodes.source) {
        try {
          nodes.source.stop();
        } catch (e) {
          // Ignorar errores si ya está detenido
        }
      }
    });
    this.audioNodes.clear();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export default new AudioProcessorService(); 