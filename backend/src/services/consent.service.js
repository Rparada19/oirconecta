/**
 * Servicio de Consentimientos.
 *
 * Ley 1581/2012 art. 9 + Res. 2003/2014 + Res. 2654/2019 — registro versionado
 * de la voluntad del titular: tratamiento de datos, consentimiento clínico,
 * telemedicina y opt-in de marketing.
 *
 * Cada firma genera un PDF con el texto exacto aceptado + datos de la firma
 * (fecha, IP, método). Se hashea con SHA-256 para integridad y se archiva en
 * almacenamiento (S3/Cloudinary). En este F1.6 generamos el PDF en memoria
 * y lo guardamos vía storage.service (mismo helper usado para otros archivos).
 */

const crypto = require('node:crypto');
const PDFDocument = require('pdfkit');
const prisma = require('../db');
const { emitAudit } = require('../db');

/// Catálogo de textos vigentes por tipo. La versión sube cuando cambia el texto.
/// Para mantenerlos cortos aquí, el cuerpo se trae del módulo de templates.
const CONSENT_TEXTS = require('./consentTexts');

const VALID_TYPES = new Set([
  'DATA_TREATMENT', 'CLINICAL', 'TELEMEDICINE', 'MARKETING', 'IMAGE_USE',
]);
const VALID_METHODS = new Set([
  'CLICK', 'OTP_WHATSAPP', 'OTP_SMS', 'WET_SIGN_SCAN', 'BIOMETRIC',
]);

function buildPdfBuffer({ patient, type, version, body, signedAt, method, ip }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'LETTER', margin: 56 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc.font('Helvetica-Bold').fontSize(16).text('OÍR Conecta', { align: 'left' });
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text('Consentimiento informado / autorización de datos');
    doc.moveDown(0.5);
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text(prettyType(type));
    doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(`Versión ${version} · ${formatDateCO(signedAt)}`);
    doc.moveDown(1);

    // Datos del titular
    doc.fillColor('#000').fontSize(11).font('Helvetica-Bold').text('Titular:');
    doc.font('Helvetica').fontSize(11).text(
      `${patient.nombre || ''}\n` +
      `${patient.tipoDocumento || 'CC'} ${patient.numeroDocumento || '—'}\n` +
      `${patient.email || ''} · ${patient.telefono || ''}`
    );
    doc.moveDown(0.8);

    // Cuerpo del texto aceptado
    doc.font('Helvetica-Bold').text('Texto aceptado:');
    doc.font('Helvetica').fontSize(11).text(body, { align: 'justify' });
    doc.moveDown(1);

    // Bloque de firma
    doc.font('Helvetica-Bold').text('Constancia de firma:');
    doc.font('Helvetica').fontSize(10).text(
      `Método: ${method}\n` +
      `Fecha y hora: ${formatDateCO(signedAt, true)}\n` +
      `IP: ${ip || '—'}\n`
    );
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(
      'Este documento sustenta la autorización del titular conforme a la Ley 1581 de 2012, ' +
      'el Decreto 1377 de 2013 y las normas vigentes aplicables al servicio prestado por OÍR Conecta.'
    );
    doc.end();
  });
}

function prettyType(t) {
  return {
    DATA_TREATMENT: 'Autorización de tratamiento de datos personales',
    CLINICAL: 'Consentimiento informado clínico',
    TELEMEDICINE: 'Consentimiento para atención por telemedicina',
    MARKETING: 'Autorización para comunicaciones comerciales',
    IMAGE_USE: 'Autorización de uso de imagen y registros multimedia',
  }[t] || t;
}

function formatDateCO(d, withTime = false) {
  const opts = withTime
    ? { dateStyle: 'long', timeStyle: 'short', timeZone: 'America/Bogota' }
    : { dateStyle: 'long', timeZone: 'America/Bogota' };
  return new Intl.DateTimeFormat('es-CO', opts).format(new Date(d));
}

/**
 * Crea/firma un consent. No bloquea por unicidad: pueden existir múltiples
 * versiones a lo largo del tiempo; la "vigente" se calcula al consultar.
 */
async function createConsent({ patientId, type, method, signedAt, ip, userAgent, pdfStorage }) {
  if (!VALID_TYPES.has(type)) {
    const e = new Error(`type inválido: ${type}`);
    e.statusCode = 400;
    throw e;
  }
  if (!VALID_METHODS.has(method)) {
    const e = new Error(`method inválido: ${method}`);
    e.statusCode = 400;
    throw e;
  }

  const patient = await prisma.patient.findUnique({ where: { id: patientId } });
  if (!patient) {
    const e = new Error('paciente no encontrado');
    e.statusCode = 404;
    throw e;
  }

  const text = CONSENT_TEXTS[type];
  if (!text) {
    const e = new Error(`sin texto vigente para ${type}`);
    e.statusCode = 500;
    throw e;
  }

  const signedAtDate = signedAt ? new Date(signedAt) : new Date();
  const pdf = await buildPdfBuffer({
    patient, type, version: text.version, body: text.body,
    signedAt: signedAtDate, method, ip,
  });
  const pdfHash = crypto.createHash('sha256').update(pdf).digest('hex');

  // Subir PDF si hay almacenamiento; si no, queda solo el hash (mínimo legal:
  // texto + hash permiten reconstruir y verificar; el PDF puede regenerarse).
  let pdfUrl = null;
  if (typeof pdfStorage === 'function') {
    try {
      pdfUrl = await pdfStorage(pdf, { patientId, type, version: text.version });
    } catch (e) {
      console.error('[consent] storage falló:', e.message);
    }
  }

  const consent = await prisma.consent.create({
    data: {
      patientId,
      type,
      version: text.version,
      signedAt: signedAtDate,
      method,
      ip: ip || null,
      userAgent: userAgent || null,
      pdfUrl,
      pdfHash,
    },
  });

  // Audit explícito (SIGN), además del CREATE automático del cliente extendido.
  await emitAudit({
    action: 'SIGN',
    entity: 'Consent',
    entityId: consent.id,
    after: { type, version: text.version, method, pdfHash },
  });

  return { consent, pdfBase64: pdf.toString('base64') };
}

/**
 * Devuelve el consent vigente más reciente por tipo. Si tiene revokedAt o no
 * existe, retorna null para ese tipo.
 */
async function getActiveConsents(patientId) {
  const rows = await prisma.consent.findMany({
    where: { patientId },
    orderBy: { signedAt: 'desc' },
  });
  const latest = {};
  for (const r of rows) {
    if (!latest[r.type]) latest[r.type] = r;
  }
  // Marcar como inactivos los revocados.
  for (const k of Object.keys(latest)) {
    if (latest[k].revokedAt) latest[k] = null;
  }
  return latest;
}

async function listConsents(patientId) {
  return prisma.consent.findMany({
    where: { patientId },
    orderBy: { signedAt: 'desc' },
  });
}

async function revokeConsent({ id, reason }) {
  const before = await prisma.consent.findUnique({ where: { id } });
  if (!before) {
    const e = new Error('consent no encontrado'); e.statusCode = 404; throw e;
  }
  if (before.revokedAt) return before;
  return prisma.consent.update({
    where: { id },
    data: { revokedAt: new Date(), revokedReason: reason || null },
  });
}

/**
 * Helper para middleware: ¿el paciente tiene consent vigente del tipo?
 */
async function hasActiveConsent(patientId, type) {
  const c = await prisma.consent.findFirst({
    where: { patientId, type, revokedAt: null },
    orderBy: { signedAt: 'desc' },
  });
  return Boolean(c);
}

module.exports = {
  createConsent,
  getActiveConsents,
  listConsents,
  revokeConsent,
  hasActiveConsent,
  VALID_TYPES,
  VALID_METHODS,
};
