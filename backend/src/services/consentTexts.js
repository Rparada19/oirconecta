/**
 * Textos vigentes de cada tipo de consentimiento. Subir `version` cuando se
 * modifique el cuerpo. La versión queda registrada en cada firma.
 *
 * NOTA legal: estos textos son la BASE técnica; el contenido jurídico final
 * debe ser validado y aprobado por el DPO/asesor legal antes de producción.
 */

module.exports = {
  DATA_TREATMENT: {
    version: '1.0.0',
    body:
      'Autorizo a OÍR Conecta, identificada con NIT [NIT], como responsable del tratamiento, ' +
      'para que recolecte, almacene, use, circule y suprima mis datos personales con las ' +
      'finalidades de: (i) prestación del servicio de salud auditiva contratado; ' +
      '(ii) facturación, cobranza y obligaciones contables; ' +
      '(iii) gestión de agendamiento, recordatorios y seguimiento clínico; ' +
      '(iv) cumplimiento de obligaciones legales y reglamentarias. ' +
      'Declaro conocer que puedo ejercer los derechos de acceso, rectificación, actualización, ' +
      'supresión y revocatoria de la autorización ante OÍR Conecta a través del canal ' +
      'proteccion.datos@oirconecta.com, y que mis datos sensibles (incluida información de salud) ' +
      'serán tratados con medidas técnicas y administrativas de seguridad reforzadas, ' +
      'conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
  },

  CLINICAL: {
    version: '1.0.0',
    body:
      'Declaro que he sido informado(a) por el profesional tratante sobre el procedimiento de ' +
      'evaluación audiológica, sus alcances, beneficios esperados, posibles riesgos y ' +
      'alternativas, incluyendo la no intervención. Acepto voluntariamente que se me realicen ' +
      'las pruebas y procedimientos clínicos pertinentes (otoscopia, audiometría, ' +
      'impedanciometría, adaptación de ayudas auditivas u otros) y autorizo a OÍR Conecta a ' +
      'documentar mi historia clínica conforme a la Resolución 1995 de 1999 y normas vigentes. ' +
      'Manifiesto haber resuelto mis dudas con el profesional, y que puedo retirar este ' +
      'consentimiento en cualquier momento sin afectar la atención futura.',
  },

  TELEMEDICINE: {
    version: '1.0.0',
    body:
      'Acepto recibir atención por la modalidad de telemedicina/telesalud conforme a la ' +
      'Resolución 2654 de 2019. Entiendo que la teleconsulta implica el uso de medios ' +
      'tecnológicos y que algunos aspectos del examen clínico pueden requerir atención ' +
      'presencial complementaria. He sido informado(a) sobre las condiciones técnicas ' +
      'mínimas, la confidencialidad de la conexión y la posibilidad de grabar la sesión ' +
      'cuando sea clínicamente necesario, con mi autorización adicional.',
  },

  MARKETING: {
    version: '1.0.0',
    body:
      'Autorizo a OÍR Conecta para enviarme comunicaciones comerciales, promocionales y ' +
      'educativas a través de WhatsApp, correo electrónico, SMS y otros canales que elija. ' +
      'Puedo revocar esta autorización en cualquier momento respondiendo BAJA al mensaje ' +
      'o desde el canal proteccion.datos@oirconecta.com.',
  },

  IMAGE_USE: {
    version: '1.0.0',
    body:
      'Autorizo a OÍR Conecta para capturar fotografías, audios o videos durante la atención ' +
      'con fines clínicos (registro de hallazgos, evolución, soporte de procesos) y, cuando ' +
      'medie autorización adicional escrita, con fines educativos o de divulgación científica ' +
      'sin identificación personal. Conservo el derecho a revocar esta autorización.',
  },
};
