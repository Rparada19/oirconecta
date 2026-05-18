/**
 * Notificaciones por correo al agendar cita.
 * Con SMTP_* en .env se envía con nodemailer; si no, en desarrollo se loguea el cuerpo y en producción solo un aviso (sin datos del paciente).
 */

const nodemailer = require('nodemailer');
const config = require('../config');

function formatAppointmentSummary(apt) {
  const fecha = apt.fecha instanceof Date ? apt.fecha.toISOString().slice(0, 10) : String(apt.fecha || '').slice(0, 10);
  return [
    `Fecha: ${fecha}`,
    `Hora: ${apt.hora}`,
    `Paciente: ${apt.patientName || '—'}`,
    `Email paciente: ${apt.patientEmail || '—'}`,
    `Teléfono: ${apt.patientPhone || '—'}`,
    `Motivo: ${apt.motivo || '—'}`,
  ].join('\n');
}

let cachedTransport;
function getTransport() {
  if (cachedTransport !== undefined) return cachedTransport;
  const host = process.env.SMTP_HOST;
  if (!host) {
    cachedTransport = null;
    return null;
  }
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
    // Timeouts cortos: si Render bloquea SMTP (puerto 25/465 en free tier) o el
    // host no responde, falla rápido en lugar de colgar 2+ minutos.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
  return cachedTransport;
}

async function deliver(to, subject, text) {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const transport = getTransport();
  if (transport && from) {
    await transport.sendMail({ from, to, subject, text });
    return;
  }
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd) {
    // eslint-disable-next-line no-console
    console.warn('[email] Correo no enviado (configure SMTP_HOST y SMTP_FROM):', subject);
  } else {
    // eslint-disable-next-line no-console
    console.log('[email → dev]', to, subject, '\n', text);
  }
}

/**
 * @param {import('@prisma/client').Appointment} appointment
 * @param {{ professionalName?: string }} [meta]
 */
async function sendBookingConfirmations(appointment, meta = {}) {
  const body = formatAppointmentSummary(appointment);
  const proName = meta.professionalName || 'Profesional';

  if (appointment.patientEmail) {
    const subject = `OírConecta — Confirmación de cita (${proName})`;
    const text = `Hola ${appointment.patientName || ''},\n\nTu cita quedó registrada:\n\n${body}\n\nSi necesitas cambiar la cita, contacta al centro indicado en el perfil del profesional.\n\n— OírConecta`;
    await deliver(appointment.patientEmail, subject, text);
  }

  if (appointment.professionalNotifyEmail) {
    const subject = `OírConecta — Nueva cita agendada (${appointment.patientName || 'paciente'})`;
    const text = `Se agendó una cita desde el perfil público:\n\n${body}\n\n— OírConecta`;
    await deliver(appointment.professionalNotifyEmail, subject, text);
  }

  // Citas del consultorio retail: notifica también a audióloga y admin
  // (sin duplicar al paciente ni a quien ya recibió en professionalNotifyEmail).
  const retailId = config.retail.professionalId;
  if (retailId && appointment.professionalId === retailId) {
    const sent = new Set();
    if (appointment.patientEmail) sent.add(appointment.patientEmail.trim().toLowerCase());
    if (appointment.professionalNotifyEmail) sent.add(appointment.professionalNotifyEmail.trim().toLowerCase());
    const recipients = [config.retail.professionalEmail, config.admin.email]
      .map((e) => (e || '').trim().toLowerCase())
      .filter((e) => e && !sent.has(e));
    const subject = `OírConecta — Nueva cita agendada (${appointment.patientName || 'paciente'})`;
    const text = `Se agendó una cita en el consultorio OírConecta:\n\n${body}\n\n— OírConecta`;
    for (const to of new Set(recipients)) {
      await deliver(to, subject, text);
    }
  }
}

module.exports = {
  sendBookingConfirmations,
};
