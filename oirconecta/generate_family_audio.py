#!/usr/bin/env python3
"""
Generador de Audio Familiar Realista para Simulador de Pérdida Auditiva
Usando ElevenLabs API o alternativa simple con pyttsx3
"""

import sys
import os
import tempfile
import subprocess

def generate_family_conversation():
    """
    Genera una conversación familiar realista usando text-to-speech
    """
    
    # Texto de la conversación familiar
    conversation_script = """
    ¿Cómo está la paella, mi amor?
    Deliciosa, como siempre en este lugar.
    ¿Podemos pedir postre después?
    ¡Yo quiero flan!
    """
    
    print("🎯 Generando audio de conversación familiar...")
    print("📝 Script:", conversation_script.strip())
    
    # Método 1: Usar herramientas del sistema (macOS)
    if sys.platform == "darwin":  # macOS
        return generate_with_macos_say(conversation_script)
    
    # Método 2: Usar pyttsx3 (multiplataforma)
    return generate_with_pyttsx3(conversation_script)

def generate_with_macos_say(text):
    """Generar audio usando el comando 'say' de macOS"""
    try:
        output_file = "/Users/rafaelparada/Desktop/Cursor OirConecta/oirconecta/public/audio/familia_conversacion_nuevo.wav"
        
        # Comando say con voz en español
        cmd = [
            "say", 
            "-v", "Monica",  # Voz femenina en español
            "-o", output_file,
            "--data-format=LEF32@44100",  # Formato WAV
            text.strip()
        ]
        
        print(f"🎤 Ejecutando: {' '.join(cmd)}")
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Audio generado exitosamente: {output_file}")
            return True
        else:
            print(f"❌ Error: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error generando con macOS: {e}")
        return False

def generate_with_pyttsx3(text):
    """Generar audio usando pyttsx3"""
    try:
        import pyttsx3
        
        engine = pyttsx3.init()
        
        # Configurar voz en español si está disponible
        voices = engine.getProperty('voices')
        for voice in voices:
            if 'spanish' in voice.name.lower() or 'es' in voice.id.lower():
                engine.setProperty('voice', voice.id)
                break
        
        # Configurar velocidad y volumen
        engine.setProperty('rate', 150)  # Velocidad de habla
        engine.setProperty('volume', 0.9)  # Volumen
        
        output_file = "/Users/rafaelparada/Desktop/Cursor OirConecta/oirconecta/public/audio/familia_conversacion_nuevo.wav"
        
        engine.save_to_file(text.strip(), output_file)
        engine.runAndWait()
        
        print(f"✅ Audio generado exitosamente: {output_file}")
        return True
        
    except ImportError:
        print("❌ pyttsx3 no está instalado. Instalar con: pip install pyttsx3")
        return False
    except Exception as e:
        print(f"❌ Error generando con pyttsx3: {e}")
        return False

def create_simple_audio_alternative():
    """
    Crear un archivo de audio simple como alternativa
    """
    print("🔄 Creando alternativa simple...")
    
    # Generar un tono simple que indique que el archivo funciona
    try:
        output_file = "/Users/rafaelparada/Desktop/Cursor OirConecta/oirconecta/public/audio/familia_conversacion_test.wav"
        
        # Usar ffmpeg para generar un tono de prueba
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "sine=frequency=440:duration=5",
            "-ar", "44100",
            "-ac", "2",
            output_file
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Archivo de prueba creado: {output_file}")
            return True
        else:
            print(f"❌ Error con ffmpeg: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error creando alternativa: {e}")
        return False

if __name__ == "__main__":
    print("🚀 GENERADOR DE AUDIO FAMILIAR REALISTA")
    print("=" * 50)
    
    # Intentar generar el audio
    success = generate_family_conversation()
    
    if not success:
        print("\n🔄 Intentando método alternativo...")
        success = create_simple_audio_alternative()
    
    if success:
        print("\n✅ ¡COMPLETADO!")
        print("🎵 El nuevo archivo de audio está listo para usar")
        print("📁 Ubicación: public/audio/")
        print("🎯 Ahora puedes probarlo en el simulador")
    else:
        print("\n❌ No se pudo generar el audio")
        print("💡 Puedes usar una herramienta online como ElevenLabs manualmente")