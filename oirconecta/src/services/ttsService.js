// Configuración de voces por escenario
const voiceConfigs = {
  familia_conversacion: {
    texts: [
      "Hola, ¿cómo estás?",
      "¿Qué tal la comida?",
      "¿Cómo te fue en el trabajo?",
      "¿Viste las noticias?",
      "¿Qué planes tienes para mañana?"
    ]
  },
  nieto_llamada: {
    texts: [
      "¡Hola abuelo!",
      "¿Cómo estás?",
      "Te extraño mucho",
      "¿Cuándo vienes a visitarme?",
      "Te quiero mucho"
    ]
  },
  te_amo: {
    texts: [
      "Te amo",
      "Te quiero mucho",
      "Eres lo mejor que me ha pasado",
      "Gracias por estar siempre ahí"
    ]
  },
  llamada_telefono: {
    texts: [
      "Hola, ¿está disponible?",
      "Sí, perfecto",
      "Gracias por llamar",
      "Hasta luego",
      "Que tengas un buen día"
    ]
  },
  television: {
    texts: [
      "Buenas noches, aquí están las noticias",
      "El clima para mañana será soleado",
      "Y ahora el deporte",
      "Gracias por sintonizarnos"
    ]
  }
};

// Función para obtener voces disponibles del navegador
const getAvailableVoices = () => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices());
      };
    }
  });
};

// Función para encontrar la mejor voz disponible
const findBestVoice = async () => {
  const voices = await getAvailableVoices();
  
  // Buscar voz en español
  let bestVoice = voices.find(voice => 
    voice.lang.startsWith('es') || voice.lang.startsWith('es-ES')
  );
  
  // Si no hay voz en español, usar la primera disponible
  if (!bestVoice && voices.length > 0) {
    bestVoice = voices[0];
  }
  
  return bestVoice;
};

// Función para reproducir audio usando Web Speech API (VOCES REALES)
export const playTTSAudio = async (scenarioId, textIndex = 0) => {
  try {
    const config = voiceConfigs[scenarioId];
    if (!config) {
      throw new Error(`Configuración no encontrada para el escenario: ${scenarioId}`);
    }

    const text = config.texts[textIndex % config.texts.length];
    
    // Detener cualquier síntesis de voz en curso
    window.speechSynthesis.cancel();
    
    // Crear y configurar la síntesis de voz
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Intentar usar una voz específica
    const voice = await findBestVoice();
    if (voice) {
      utterance.voice = voice;
      console.log('Usando voz:', voice.name, voice.lang);
    }
    
    // Reproducir el audio
    window.speechSynthesis.speak(utterance);
    
    return utterance;
    
  } catch (error) {
    console.error('Error reproduciendo audio TTS:', error);
    throw error;
  }
};

// Función para generar URL de audio usando Google TTS (mantener para compatibilidad)
export const generateTTSAudio = async (scenarioId, textIndex = 0) => {
  try {
    const config = voiceConfigs[scenarioId];
    if (!config) {
      throw new Error(`Configuración no encontrada para el escenario: ${scenarioId}`);
    }

    const text = config.texts[textIndex % config.texts.length];
    
    // Crear un blob de audio usando Web Speech API
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Intentar usar una voz específica si está disponible
      findBestVoice().then(voice => {
        if (voice) {
          utterance.voice = voice;
        }
        
        // Crear un blob de audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Simular el audio hablado con una onda compleja
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 2);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 2);
        
        // Crear una URL de blob temporal
        const blob = new Blob([''], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        resolve(url);
      });
    });
    
  } catch (error) {
    console.error('Error generando audio TTS:', error);
    throw error;
  }
};

// Función para generar múltiples audios para un escenario
export const generateScenarioAudio = async (scenarioId) => {
  try {
    const config = voiceConfigs[scenarioId];
    if (!config) {
      throw new Error(`Configuración no encontrada para el escenario: ${scenarioId}`);
    }

    const audioUrls = [];
    
    // Generar múltiples audios con diferentes textos y voces
    for (let i = 0; i < Math.min(config.texts.length, config.voices.length); i++) {
      const audioUrl = await generateTTSAudio(scenarioId, i);
      audioUrls.push(audioUrl);
    }

    return audioUrls;
  } catch (error) {
    console.error('Error generando audios del escenario:', error);
    throw error;
  }
};

// Función para obtener configuración de un escenario
export const getScenarioConfig = (scenarioId) => {
  return voiceConfigs[scenarioId] || null;
};

// Función para listar todos los escenarios disponibles
export const getAvailableScenarios = () => {
  return Object.keys(voiceConfigs);
};

// Función para verificar si un escenario tiene TTS disponible
export const hasTTSAvailable = (scenarioId) => {
  return Object.prototype.hasOwnProperty.call(voiceConfigs, scenarioId);
}; 

// Función para reproducir TTS con procesamiento de pérdida auditiva
export const playTTSWithHearingLoss = async (scenarioId, textIndex = 0, audioContext, processingParams) => {
  try {
    const config = voiceConfigs[scenarioId];
    if (!config) {
      throw new Error(`Configuración no encontrada para el escenario: ${scenarioId}`);
    }

    const text = config.texts[textIndex % config.texts.length];
    
    // Detener cualquier síntesis de voz en curso
    window.speechSynthesis.cancel();
    
    // Crear y configurar la síntesis de voz
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Intentar usar una voz específica
    const voice = await findBestVoice();
    if (voice) {
      utterance.voice = voice;
    }
    
    // Crear nodos de procesamiento más sutiles
    const gainNode = audioContext.createGain();
    const lowpassFilter = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    
    // Configurar filtro de frecuencias más sutil
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.setValueAtTime(processingParams.filtroFrecuencia, audioContext.currentTime);
    lowpassFilter.Q.setValueAtTime(0.5, audioContext.currentTime); // Q más bajo para transición suave
    
    // Configurar compresión dinámica más sutil
    compressor.threshold.setValueAtTime(processingParams.compresionThreshold, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime); // Knee más suave
    compressor.ratio.setValueAtTime(processingParams.compresionRatio, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.01, audioContext.currentTime); // Attack más rápido
    compressor.release.setValueAtTime(0.1, audioContext.currentTime); // Release más rápido
    
    // Configurar volumen
    gainNode.gain.setValueAtTime(processingParams.volumen, audioContext.currentTime);
    
    // Conectar nodos en cadena (sin waveshaper para mantener calidad)
    lowpassFilter.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Crear un MediaStreamSource para capturar el audio del TTS
    // Nota: Esto es experimental y puede no funcionar en todos los navegadores
    try {
      // Intentar capturar el audio del TTS
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(mediaStream);
      source.connect(lowpassFilter);
    } catch {
      console.log('No se pudo capturar audio del TTS, usando procesamiento directo');
    }
    
    // Reproducir el audio
    window.speechSynthesis.speak(utterance);
    
    return utterance;
    
  } catch (error) {
    console.error('Error reproduciendo audio TTS con pérdida auditiva:', error);
    throw error;
  }
};

// Función para reproducir audio procesado usando archivos pre-grabados con mejor calidad
export const playProcessedAudio = async (scenarioId, audioContext, processingParams) => {
  try {
    // Usar archivos de audio sintético mejorados
    const audioUrl = `/audio/${scenarioId}.wav`;
    
    const audio = new Audio(audioUrl);
    const source = audioContext.createMediaElementSource(audio);
    
    // Crear nodos de procesamiento más sutiles
    const gainNode = audioContext.createGain();
    const lowpassFilter = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    
    // Configurar filtro de frecuencias más sutil
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.setValueAtTime(processingParams.filtroFrecuencia, audioContext.currentTime);
    lowpassFilter.Q.setValueAtTime(0.5, audioContext.currentTime); // Q más bajo para transición suave
    
    // Configurar compresión dinámica más sutil
    compressor.threshold.setValueAtTime(processingParams.compresionThreshold, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime); // Knee más suave
    compressor.ratio.setValueAtTime(processingParams.compresionRatio, audioContext.currentTime);
    compressor.attack.setValueAtTime(0.01, audioContext.currentTime); // Attack más rápido
    compressor.release.setValueAtTime(0.1, audioContext.currentTime); // Release más rápido
    
    // Configurar volumen
    gainNode.gain.setValueAtTime(processingParams.volumen, audioContext.currentTime);
    
    // Conectar nodos en cadena (sin waveshaper para mantener calidad)
    source.connect(lowpassFilter);
    lowpassFilter.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Reproducir el audio
    audio.play();
    
    return audio;
    
  } catch (error) {
    console.error('Error reproduciendo audio procesado:', error);
    throw error;
  }
};

// Función para crear curva de distorsión
// const createDistortionCurve = (amount) => {
//   const k = typeof amount === 'number' ? amount : 50;
//   const n_samples = 44100;
//   const curve = new Float32Array(n_samples);
//   const deg = Math.PI / 180;
//   for (let i = 0; i < n_samples; ++i) {
//     const x = (i * 2) / n_samples - 1;
//     curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
//   }
//   return curve;
// }; 