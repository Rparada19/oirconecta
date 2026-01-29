const fs = require('fs');
const path = require('path');

// Configuración de audio
const SAMPLE_RATE = 44100;
const DURATION = 5; // segundos
const NUM_SAMPLES = SAMPLE_RATE * DURATION;

// Función para generar voces distorsionadas realistas
function generateRealisticDistortedVoice(text, outputPath, distortionType = 'moderate') {
  const samples = new Float32Array(NUM_SAMPLES);
  
  // Simular características de voz humana realista
  const baseFreq = 120; // Frecuencia fundamental (voz masculina)
  const harmonics = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Más armónicos para realismo
  const amplitudes = [1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.15, 0.1, 0.08, 0.05]; // Amplitudes naturales
  
  // Parámetros de distorsión según tipo
  const distortionParams = {
    mild: {
      noiseLevel: 0.02,
      vibratoDepth: 0.01,
      vibratoRate: 5,
      formantShift: 1.0,
      compression: 1.2
    },
    moderate: {
      noiseLevel: 0.05,
      vibratoDepth: 0.02,
      vibratoRate: 6,
      formantShift: 0.8,
      compression: 2.0
    },
    severe: {
      noiseLevel: 0.1,
      vibratoDepth: 0.03,
      vibratoRate: 7,
      formantShift: 0.6,
      compression: 4.0
    },
    profound: {
      noiseLevel: 0.15,
      vibratoDepth: 0.04,
      vibratoRate: 8,
      formantShift: 0.4,
      compression: 8.0
    }
  };
  
  const params = distortionParams[distortionType];
  
  // Simular modulación de frecuencia (vibrato natural)
  const vibratoDepth = params.vibratoDepth;
  const vibratoRate = params.vibratoRate;
  
  // Simular formantes vocales (características del tracto vocal)
  const formantFreqs = [500, 1500, 2500, 3500]; // Formantes típicos
  const formantGains = [1.0, 0.7, 0.5, 0.3];
  
  for (let i = 0; i < NUM_SAMPLES; i++) {
    let sample = 0;
    const time = i / SAMPLE_RATE;
    
    // Generar señal fundamental con vibrato
    const vibrato = Math.sin(2 * Math.PI * vibratoRate * time);
    const modulatedFreq = baseFreq * (1 + vibratoDepth * vibrato);
    
    // Generar armónicos con características vocales
    for (let h = 0; h < harmonics.length; h++) {
      const harmonicFreq = modulatedFreq * harmonics[h];
      const amplitude = amplitudes[h];
      
      // Aplicar formantes (resonancias del tracto vocal)
      let formantGain = 1.0;
      for (let f = 0; f < formantFreqs.length; f++) {
        const formantFreq = formantFreqs[f] * params.formantShift;
        const formantQ = 10;
        const formantResponse = 1 / (1 + Math.pow((harmonicFreq - formantFreq) / (formantFreq / formantQ), 2));
        formantGain *= (1 + formantResponse * formantGains[f]);
      }
      
      sample += amplitude * formantGain * Math.sin(2 * Math.PI * harmonicFreq * time);
    }
    
    // Agregar ruido para simular respiración y articulación
    const noise = (Math.random() - 0.5) * 2 * params.noiseLevel;
    sample += noise;
    
    // Aplicar compresión dinámica (simular reclutamiento)
    const compressionThreshold = 0.3;
    const compressionRatio = params.compression;
    if (Math.abs(sample) > compressionThreshold) {
      const excess = Math.abs(sample) - compressionThreshold;
      const compressedExcess = excess / compressionRatio;
      sample = Math.sign(sample) * (compressionThreshold + compressedExcess);
    }
    
    // Normalizar y aplicar ganancia
    sample = Math.max(-0.9, Math.min(0.9, sample));
    samples[i] = sample;
  }
  
  // Convertir a WAV
  const wavBuffer = createWAVBuffer(samples, SAMPLE_RATE);
  fs.writeFileSync(outputPath, wavBuffer);
  console.log(`✅ Generado: ${outputPath} (${distortionType})`);
}

// Función para crear buffer WAV
function createWAVBuffer(samples, sampleRate) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  let offset = 0;
  
  // WAV header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + samples.length * 2, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt16LE(1, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(sampleRate * 2, offset); offset += 4;
  buffer.writeUInt16LE(2, offset); offset += 2;
  buffer.writeUInt16LE(16, offset); offset += 2;
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(samples.length * 2, offset); offset += 4;
  
  // Audio data
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(sample * 32767), offset);
    offset += 2;
  }
  
  return buffer;
}

// Generar diferentes tipos de voces distorsionadas
const scenarios = [
  { id: 'familia_conversacion', text: 'Hola, ¿cómo estás? ¿Qué tal el día?', type: 'moderate' },
  { id: 'nieto_llamada', text: '¡Abuelo! ¡Abuelo! ¿Dónde estás?', type: 'mild' },
  { id: 'alarma_emergencia', text: '¡Atención! ¡Emergencia! ¡Evacúen inmediatamente!', type: 'severe' },
  { id: 'te_amo', text: 'Te amo, te amo mucho', type: 'moderate' },
  { id: 'llamada_telefono', text: '¿Hola? ¿Me escuchas? ¿Estás ahí?', type: 'moderate' },
  { id: 'television', text: 'Bienvenidos al noticiero de las ocho', type: 'mild' }
];

// Crear directorio si no existe
const outputDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generar archivos de audio
console.log('🎵 Generando voces distorsionadas realistas...\n');

scenarios.forEach(scenario => {
  const outputPath = path.join(outputDir, `${scenario.id}_distorted.wav`);
  generateRealisticDistortedVoice(scenario.text, outputPath, scenario.type);
});

console.log('\n✅ ¡Generación completada!');
console.log('📁 Archivos guardados en: public/audio/');
console.log('🎯 Tipos de distorsión aplicados:');
console.log('   - mild: Pérdida auditiva leve');
console.log('   - moderate: Pérdida auditiva moderada');
console.log('   - severe: Pérdida auditiva severa');
console.log('   - profound: Pérdida auditiva profunda'); 