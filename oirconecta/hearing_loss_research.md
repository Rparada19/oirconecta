# Investigación: Cómo Escuchan las Personas con Pérdida Auditiva

## Tipos de Pérdida Auditiva

### 1. Pérdida Auditiva Conductiva
- **Causa**: Problemas en oído externo o medio
- **Efecto**: Reducción general del volumen
- **Características**: 
  - Todos los sonidos suenan más bajos
  - Mantiene la claridad pero con menos volumen
  - Fácil de compensar con amplificación

### 2. Pérdida Auditiva Neurosensorial
- **Causa**: Daño en cóclea o nervio auditivo
- **Efecto**: Pérdida selectiva de frecuencias + distorsión
- **Características**:
  - Pérdida en frecuencias altas (presbiacusia)
  - Dificultad para distinguir consonantes
  - Reclutamiento (sonidos fuertes son dolorosos)
  - Deterioro de la discriminación del habla

### 3. Pérdida Auditiva Mixta
- **Causa**: Combinación de conductiva y neurosensorial
- **Efecto**: Combinación de ambos efectos

## Niveles de Severidad

### Leve (20-40 dB)
- **Efectos**: 
  - Dificultad con voces suaves
  - Problemas en ambientes ruidosos
  - Pérdida de consonantes sibilantes (s, f, th)
- **Simulación**: Reducción de volumen + filtro suave de altas frecuencias

### Moderada (40-60 dB)
- **Efectos**:
  - Dificultad con conversación normal
  - Pérdida de consonantes explosivas (p, t, k)
  - Problemas con voces infantiles y femeninas
- **Simulación**: Filtro más agresivo + compresión dinámica

### Moderadamente Severa (60-80 dB)
- **Efectos**:
  - Solo escucha voces muy fuertes
  - Pérdida de la mayoría de consonantes
  - Dificultad extrema en ambientes ruidosos
- **Simulación**: Filtro agresivo + compresión fuerte + distorsión

### Severa (80-90 dB)
- **Efectos**:
  - Solo sonidos muy fuertes
  - Pérdida de inteligibilidad del habla
  - Dependencia de lectura labial
- **Simulación**: Filtro muy agresivo + compresión extrema + distorsión severa

### Profunda (>90 dB)
- **Efectos**:
  - Solo percibe vibraciones
  - No puede entender el habla
  - Dependencia total de lectura labial o señas
- **Simulación**: Filtro extremo + distorsión máxima

## Características Específicas del Habla

### Consonantes Afectadas por Frecuencia:
- **Bajas frecuencias (125-500 Hz)**: m, n, ng
- **Medias frecuencias (500-2000 Hz)**: a, e, i, o, u
- **Altas frecuencias (2000-8000 Hz)**: s, f, th, p, t, k, ch, sh

### Efectos en la Comprensión:
1. **"Te amo"** → **"amo"** (pérdida de "t")
2. **"Hola papá"** → **"ola aá"** (pérdida de h, p)
3. **"Gracias"** → **"raia"** (pérdida de g, c, s)

## Simulación Realista

### Algoritmos Necesarios:
1. **Filtro de Frecuencias**: Reducir frecuencias altas según audiograma
2. **Compresión Dinámica**: Simular reclutamiento
3. **Distorsión Armónica**: Simular daño coclear
4. **Reducción de Consonantes**: Eliminar frecuencias específicas
5. **Aumento de Ruido**: Simular tinnitus

### Parámetros por Severidad:

#### Leve:
- Filtro: -6dB en frecuencias >2000 Hz
- Compresión: 2:1
- Distorsión: 5%

#### Moderada:
- Filtro: -12dB en frecuencias >1500 Hz
- Compresión: 4:1
- Distorsión: 15%

#### Moderadamente Severa:
- Filtro: -18dB en frecuencias >1000 Hz
- Compresión: 8:1
- Distorsión: 30%

#### Severa:
- Filtro: -24dB en frecuencias >500 Hz
- Compresión: 12:1
- Distorsión: 50%

#### Profunda:
- Filtro: -30dB en frecuencias >250 Hz
- Compresión: 20:1
- Distorsión: 70%

## Implementación Técnica

### Web Audio API:
```javascript
// Filtro de frecuencias
const lowpassFilter = audioContext.createBiquadFilter();
lowpassFilter.type = 'lowpass';
lowpassFilter.frequency.setValueAtTime(frequency, audioContext.currentTime);

// Compresión dinámica
const compressor = audioContext.createDynamicsCompressor();
compressor.threshold.setValueAtTime(-24, audioContext.currentTime);
compressor.ratio.setValueAtTime(ratio, audioContext.currentTime);

// Distorsión armónica
const waveshaper = audioContext.createWaveShaper();
waveshaper.curve = createDistortionCurve(amount);
```

### Archivos de Audio Necesarios:
1. **Conversación Normal**: "Hola, ¿cómo estás?"
2. **Voz Infantil**: "Abuelo, ¿me escuchas?"
3. **Alarma**: Sonido de emergencia
4. **Palabras de Cariño**: "Te amo, te quiero"
5. **Llamada Telefónica**: Conversación por teléfono
6. **Televisión**: Noticias o programa

### Procesamiento en Tiempo Real:
- Aplicar filtros según audiograma
- Simular reclutamiento con compresión
- Agregar distorsión armónica
- Reducir inteligibilidad del habla 