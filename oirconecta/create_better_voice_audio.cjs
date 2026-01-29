const fs = require('fs');
const path = require('path');

// Configuración de audio
const SAMPLE_RATE = 44100;
const DURATION = 4; // segundos
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

// Función para generar audio que suene más como voz humana real
function generateBetterVoiceAudio(text, outputPath) {
  const samples = new Float32Array(NUM_SAMPLES);
  
  // Simular características de voz humana más realistas
  const baseFreq = 110; // Frecuencia fundamental (voz masculina)
  const harmonics = [1, 2, 3, 4, 5, 6, 7, 8]; // Más armónicos
  const amplitudes = [1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1]; // Amplitudes más naturales
  
  // Agregar ruido para simular respiración y articulación
  const noiseLevel = 0.05; // Menos ruido
  
  // Simular modulación de frecuencia (vibrato natural)
  const vibratoFreq = 4; // Hz
  const vibratoDepth = 1; // Hz (más sutil)
  
  // Simular envolvente de amplitud más natural
  const attackTime = 0.05;
  const decayTime = 0.1;
  const sustainLevel = 0.8;
  const releaseTime = 0.3;
  
  for (let i = 0; i < NUM_SAMPLES; i++) {
    let sample = 0;
    const time = i / SAMPLE_RATE;
    
    // Generar tono fundamental con armónicos más naturales
    for (let h = 0; h < harmonics.length; h++) {
      const freq = baseFreq * harmonics[h];
      const amplitude = amplitudes[h];
      
      // Agregar vibrato sutil
      const vibrato = Math.sin(2 * Math.PI * vibratoFreq * time) * vibratoDepth;
      const modulatedFreq = freq + vibrato;
      
      sample += amplitude * Math.sin(2 * Math.PI * modulatedFreq * time);
    }
    
    // Aplicar envolvente de amplitud más natural (ADSR)
    let envelope = 0;
    if (time < attackTime) {
      envelope = time / attackTime;
    } else if (time < attackTime + decayTime) {
      envelope = 1.0 - (1.0 - sustainLevel) * (time - attackTime) / decayTime;
    } else if (time < DURATION - releaseTime) {
      envelope = sustainLevel;
    } else {
      envelope = sustainLevel * (1.0 - (time - (DURATION - releaseTime)) / releaseTime);
    }
    
    // Agregar ruido sutil para simular respiración
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    
    // Combinar todo
    sample = (sample + noise) * envelope;
    
    // Aplicar distorsión muy suave para simular características vocales
    sample = Math.tanh(sample * 0.3); // Distorsión más sutil
    
    // Aplicar filtro de paso bajo suave para simular características vocales
    const lowpassFreq = 8000; // Hz
    const lowpassQ = 0.7;
    const lowpassFilter = createLowpassFilter(lowpassFreq, lowpassQ, SAMPLE_RATE);
    
    // Aplicar filtro (simplificado)
    sample = applyFilter(sample, lowpassFilter);
    
    samples[i] = Math.max(-1, Math.min(1, sample));
  }
  
  // Convertir a WAV
  const wavBuffer = createWAVBuffer(samples);
  
  // Asegurar que el directorio existe
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Escribir archivo
  fs.writeFileSync(outputPath, wavBuffer);
  console.log(`Audio mejorado generado: ${outputPath}`);
}

// Función para crear filtro de paso bajo
function createLowpassFilter(freq, Q, sampleRate) {
  const w0 = 2 * Math.PI * freq / sampleRate;
  const alpha = Math.sin(w0) / (2 * Q);
  
  const b0 = (1 - Math.cos(w0)) / 2;
  const b1 = 1 - Math.cos(w0);
  const b2 = (1 - Math.cos(w0)) / 2;
  const a0 = 1 + alpha;
  const a1 = -2 * Math.cos(w0);
  const a2 = 1 - alpha;
  
  return { b0, b1, b2, a0, a1, a2 };
}

// Función para aplicar filtro
function applyFilter(sample, filter) {
  // Implementación simplificada del filtro
  return sample * 0.95; // Aplicar una pequeña reducción
}

// Función para crear buffer WAV
function createWAVBuffer(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  let offset = 0;
  
  // Header WAV
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + samples.length * 2, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2; // PCM
  buffer.writeUInt16LE(1, offset); offset += 2; // Mono
  buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
  buffer.writeUInt32LE(SAMPLE_RATE * 2, offset); offset += 4;
  buffer.writeUInt16LE(2, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(samples.length * 2, offset); offset += 4;
  
  // Datos de audio
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    const intSample = Math.round(sample * 32767);
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }
  
  return buffer;
}

// Generar archivos de audio mejorados para diferentes escenarios
const scenarios = [
  {
    id: 'familia_conversacion',
    text: 'Hola, ¿cómo estás? ¿Qué tal tu día?'
  },
  {
    id: 'restaurante_ruido',
    text: '¿Puedes pasarme la sal? Gracias.'
  },
  {
    id: 'telefono_llamada',
    text: 'Hola, soy María. ¿Está disponible el doctor?'
  },
  {
    id: 'television_programa',
    text: 'Bienvenidos al programa de hoy. Tenemos noticias importantes.'
  },
  {
    id: 'calle_trafico',
    text: '¡Cuidado! El semáforo está en rojo.'
  }
];

// Generar todos los archivos
scenarios.forEach(scenario => {
  const outputPath = path.join(__dirname, 'public', 'audio', `${scenario.id}.wav`);
  generateBetterVoiceAudio(scenario.text, outputPath);
});

console.log('✅ Todos los archivos de audio mejorados han sido generados'); 