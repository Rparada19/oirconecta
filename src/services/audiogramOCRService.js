import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';

class AudiogramOCRService {
  constructor() {
    this.worker = null;
    this.initialized = false;
  }

  // Inicializar el worker de Tesseract
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.worker = await Tesseract.createWorker('spa+eng');
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789.-',
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      });
      this.initialized = true;
      console.log('OCR Service initialized successfully');
    } catch (error) {
      console.error('Error initializing OCR service:', error);
      throw error;
    }
  }

  // Convertir PDF a imagen
  async pdfToImage(pdfFile) {
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const page = pdfDoc.getPages()[0];
      
      // Crear un canvas para renderizar el PDF
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Configurar dimensiones del canvas
      const { width, height } = page.getSize();
      canvas.width = width;
      canvas.height = height;
      
      // Renderizar PDF en canvas (simplificado)
      // En una implementación real, usarías pdf2pic o similar
      
      return canvas;
    } catch (error) {
      console.error('Error converting PDF to image:', error);
      throw error;
    }
  }

  // Extraer valores del audiograma usando OCR
  async extractAudiogramValues(imageElement) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Configurar parámetros específicos para audiogramas
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789.-',
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      });

      // Realizar OCR en la imagen
      const { data } = await this.worker.recognize(imageElement);
      
      // Procesar el texto extraído para encontrar valores del audiograma
      const audiogramData = this.parseAudiogramText(data.text);
      
      return audiogramData;
    } catch (error) {
      console.error('Error extracting audiogram values:', error);
      throw error;
    }
  }

  // Parsear el texto extraído para identificar valores del audiograma
  parseAudiogramText(text) {
    const audiogramData = {
      oidoDerecho: {},
      oidoIzquierdo: {}
    };

    // Frecuencias estándar del audiograma
    const frecuencias = [125, 250, 500, 1000, 2000, 4000, 8000];
    
    // Buscar patrones de números en el texto
    const numberPattern = /-?\d+/g;
    const numbers = text.match(numberPattern);
    
    if (numbers) {
      // Mapear números encontrados a frecuencias (simplificado)
      // En una implementación real, necesitarías lógica más sofisticada
      // para identificar la posición exacta de cada valor
      
      frecuencias.forEach((freq, index) => {
        if (numbers[index * 2]) {
          audiogramData.oidoDerecho[freq] = parseInt(numbers[index * 2]);
        }
        if (numbers[index * 2 + 1]) {
          audiogramData.oidoIzquierdo[freq] = parseInt(numbers[index * 2 + 1]);
        }
      });
    }

    return audiogramData;
  }

  // Procesar archivo PDF completo
  async processAudiogramPDF(pdfFile) {
    try {
      // Convertir PDF a imagen
      const imageElement = await this.pdfToImage(pdfFile);
      
      // Extraer valores usando OCR
      const audiogramValues = await this.extractAudiogramValues(imageElement);
      
      return audiogramValues;
    } catch (error) {
      console.error('Error processing audiogram PDF:', error);
      throw error;
    }
  }

  // Limpiar recursos
  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

export default new AudiogramOCRService(); 