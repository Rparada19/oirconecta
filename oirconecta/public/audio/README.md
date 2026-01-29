# Archivos de Audio para el Simulador

Esta carpeta contiene archivos de audio que simulan **sonidos reales** como los escucha una persona con pérdida auditiva, basados en investigación audiométrica.

## 🎵 Archivos disponibles:

- `familia_conversacion.wav` - Conversación familiar con múltiples voces
- `nieto_llamada.wav` - Voz infantil llamando
- `alarma_emergencia.wav` - Alarma de emergencia
- `te_amo.wav` - Palabras de cariño "Te amo"
- `llamada_telefono.wav` - Llamada telefónica
- `television.wav` - Sonido de televisión

## 🔬 Base Científica:

### Tipos de Pérdida Auditiva Simulados:

#### **Pérdida Auditiva Neurosensorial** (más común):
- **Causa**: Daño en cóclea o nervio auditivo
- **Efectos**: 
  - Pérdida selectiva de frecuencias altas
  - Dificultad para distinguir consonantes
  - Reclutamiento (sonidos fuertes son dolorosos)
  - Deterioro de la discriminación del habla

#### **Niveles de Severidad**:

**Leve (20-40 dB)**:
- Dificultad con voces suaves
- Problemas en ambientes ruidosos
- Pérdida de consonantes sibilantes (s, f, th)

**Moderada (40-60 dB)**:
- Dificultad con conversación normal
- Pérdida de consonantes explosivas (p, t, k)
- Problemas con voces infantiles y femeninas

**Moderadamente Severa (60-80 dB)**:
- Solo escucha voces muy fuertes
- Pérdida de la mayoría de consonantes
- Dificultad extrema en ambientes ruidosos

**Severa (80-90 dB)**:
- Solo sonidos muy fuertes
- Pérdida de inteligibilidad del habla
- Dependencia de lectura labial

**Profunda (>90 dB)**:
- Solo percibe vibraciones
- No puede entender el habla
- Dependencia total de lectura labial o señas

### 🗣️ Efectos en la Comprensión del Habla:

#### **Consonantes Afectadas por Frecuencia**:
- **Bajas frecuencias (125-500 Hz)**: m, n, ng
- **Medias frecuencias (500-2000 Hz)**: a, e, i, o, u
- **Altas frecuencias (2000-8000 Hz)**: s, f, th, p, t, k, ch, sh

#### **Ejemplos de Distorsión**:
1. **"Te amo"** → **"amo"** (pérdida de "t")
2. **"Hola papá"** → **"ola aá"** (pérdida de h, p)
3. **"Gracias"** → **"raia"** (pérdida de g, c, s)

## 🎛️ Procesamiento de Audio Aplicado:

### **Algoritmos de Distorsión**:
1. **Filtro de Frecuencias**: Reducir frecuencias altas según audiograma
2. **Compresión Dinámica**: Simular reclutamiento
3. **Distorsión Armónica**: Simular daño coclear
4. **Reducción de Consonantes**: Eliminar frecuencias específicas

### **Parámetros por Severidad**:

| Severidad | Filtro (Hz) | Compresión | Distorsión | Volumen |
|-----------|-------------|------------|------------|---------|
| Leve | 2000 | 2:1 | 5% | 0.7 |
| Moderada | 1500 | 4:1 | 15% | 0.5 |
| Moderadamente Severa | 1000 | 8:1 | 30% | 0.3 |
| Severa | 500 | 12:1 | 50% | 0.15 |
| Profunda | 250 | 20:1 | 70% | 0.05 |

## 🎯 Características de los Archivos:

- **Audio realista** que simula habla humana
- **Múltiples voces** y frecuencias
- **Modulación natural** para simular palabras
- **Armónicos vocales** apropiados
- **Ruido de fondo** sutil para realismo

## 📝 Nota Importante:

Estos archivos son **generados sintéticamente** para simular habla humana realista. El simulador aplica **distorsión adicional** basada en el audiograma específico del usuario, creando una experiencia más precisa de cómo escucha una persona con pérdida auditiva.

**El objetivo es educar y crear empatía**, no reemplazar la evaluación profesional de un audiólogo. 