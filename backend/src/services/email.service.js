/**
 * OírConecta — Servicio de correo electrónico
 * Proveedor principal: Sender.com (SENDER_API_KEY)
 * Fallback:           Resend    (RESEND_API_KEY)
 * Dev:                console.log
 *
 * Correos implementados:
 *  1. sendBookingConfirmation   — cita agendada (paciente + profesional)
 *  2. sendProfessionalWelcome   — bienvenida al registrarse en el directorio
 *  3. sendProfessionalApproved  — perfil aprobado, ya visible
 *  4. sendProfessionalRejected  — perfil rechazado (con motivo)
 *  5. sendNewInquiry            — nueva consulta recibida (al profesional)
 *  6. sendInquiryConfirmation   — confirmación al visitante que escribió
 *  7. sendPasswordReset         — enlace de restablecimiento de contraseña
 *  8. sendContactFormNotification — formulario de contacto web al equipo
 */

// ─── Constantes ─────────────────────────────────────────────────────────────
const SENDER_ENDPOINT  = 'https://api.sender.net/v2/emails';
const RESEND_ENDPOINT  = 'https://api.resend.com/emails';
const FROM_NAME        = 'OírConecta';
const FROM_EMAIL       = process.env.EMAIL_FROM || 'no-reply@oirconecta.com';
const ADMIN_EMAIL      = process.env.ADMIN_EMAIL || null;
const LOGO_URL         = 'https://oirconecta.com/logo-oirconecta.png';
const SITE_URL         = 'https://oirconecta.com';

// Único punto de verdad para el número corporativo — no hardcodear en el body.
// Config por env: CENTRO_WHATSAPP=573171503944  CENTRO_TELEFONO='+57 317 150 3944'
const WA_NUMBER  = (process.env.CENTRO_WHATSAPP || '573171503944').replace(/\D/g, '');
const WA_DISPLAY = process.env.CENTRO_TELEFONO || '+57 317 150 3944';
const WA_HREF    = `https://wa.me/${WA_NUMBER}`;
const TEL_HREF   = `tel:+${WA_NUMBER}`;

// ─── HTML base template ──────────────────────────────────────────────────────
function baseTemplate({ preheader = '', title, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
    a { color:#085946; }
    .btn { display:inline-block; padding:14px 32px; background:#085946; color:#ffffff !important; text-decoration:none; border-radius:10px; font-weight:700; font-size:15px; letter-spacing:-0.01em; }
    .btn:hover { background:#0d7a5f; }
    @media (max-width:600px) { .card { border-radius:0 !important; } }
  </style>
</head>
<body>
  <!-- Preheader hidden -->
  <div style="display:none;max-height:0;overflow:hidden;color:#f4f6f8;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f4f6f8;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;">

        <!-- HEADER -->
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="${SITE_URL}" target="_blank">
            <img src="${LOGO_URL}" alt="OírConecta" height="44" style="display:block;" />
          </a>
        </td></tr>

        <!-- CARD -->
        <tr><td class="card" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(8,89,70,0.10);">

          <!-- Card green bar -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="background:linear-gradient(135deg,#085946,#0d7a5f);height:6px;font-size:0;">&nbsp;</td></tr>
          </table>

          <!-- Card body -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="padding:40px 40px 32px;">
              ${bodyHtml}
            </td></tr>
          </table>

        </td></tr>

        <!-- FOOTER -->
        <tr><td style="padding-top:28px;text-align:center;">
          <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">
            © ${new Date().getFullYear()} OírConecta &middot; Bogotá, Colombia
          </p>
          <p style="margin:0 0 6px;font-size:13px;color:#9ca3af;">
            Cr 10 #96-25 Cons. 320, Edificio Centro Ejecutivo
          </p>
          <p style="margin:0;font-size:13px;color:#9ca3af;">
            <a href="mailto:conversemos@oirconecta.com" style="color:#9ca3af;">conversemos@oirconecta.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://instagram.com/oirconecta" style="color:#9ca3af;">@oirconecta</a>
          </p>
          <p style="margin:10px 0 0;font-size:12px;color:#d1d5db;">
            Si no esperabas este correo, puedes ignorarlo.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function h1(text) {
  return `<h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#0f1923;letter-spacing:-0.03em;line-height:1.2;">${text}</h1>`;
}
function p(text) {
  return `<p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.75;">${text}</p>`;
}
function btn(href, label) {
  return `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;">
    <tr><td><a href="${href}" class="btn" target="_blank">${label}</a></td></tr>
  </table>`;
}
function divider() {
  return `<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />`;
}
function highlight(rows) {
  const cells = rows.map(([k, v]) =>
    `<tr>
      <td style="padding:8px 0;font-size:13px;color:#6b7280;font-weight:600;white-space:nowrap;padding-right:16px;">${k}</td>
      <td style="padding:8px 0;font-size:14px;color:#0f1923;font-weight:500;">${v}</td>
    </tr>`
  ).join('');
  return `<table cellpadding="0" cellspacing="0" role="presentation"
    style="background:#f9fafb;border-radius:12px;padding:4px 20px;margin:20px 0;width:100%;">
    <tbody>${cells}</tbody>
  </table>`;
}

// ─── Delivery ────────────────────────────────────────────────────────────────
async function deliver({ to, toName, subject, html, text, fromEmail, fromName, replyTo }) {
  const isProd = process.env.NODE_ENV === 'production';

  // ── Sender.com (primario) ──
  if (process.env.SENDER_API_KEY) {
    try {
      const res = await fetch(SENDER_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDER_API_KEY}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          from: { name: fromName || FROM_NAME, email: fromEmail || FROM_EMAIL },
          to: [{ name: toName || to, email: to }],
          subject,
          html,
          ...(text ? { text } : {}),
          ...(replyTo ? { reply_to: [{ email: replyTo }] } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        console.error('[email] Sender.com error', res.status, err.slice(0, 300), '→ intento Resend si está configurado');
        // No return: caer al respaldo (Resend) si existe.
      } else {
        console.log('[email] Sender.com →', to, subject);
        return;
      }
    } catch (e) {
      console.error('[email] Sender.com exception:', e.message, '→ intento Resend si está configurado');
    }
  }

  // ── Resend (fallback) ──
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch(RESEND_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName || FROM_NAME} <${fromEmail || FROM_EMAIL}>`,
          to, subject, html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) console.error('[email] Resend error', res.status);
      else console.log('[email] Resend →', to, subject);
      return;
    } catch (e) {
      console.error('[email] Resend exception:', e.message);
    }
  }

  // ── Dev fallback ──
  if (isProd) {
    console.warn('[email] No se envió correo (configura SENDER_API_KEY). Asunto:', subject);
  } else {
    console.log(`\n📧 [email → dev]\nTo: ${to}\nSubject: ${subject}\n${text || '(HTML only)'}\n`);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 0. SALES OUTREACH — email directo del ejecutivo comercial al profesional
// ════════════════════════════════════════════════════════════════════════════
const SALES_FROM_EMAIL = process.env.SALES_FROM_EMAIL || 'servicioalcliente@oirconecta.com';
const SALES_FROM_NAME  = process.env.SALES_FROM_NAME  || 'OírConecta · Servicio al cliente';

/**
 * Email outbound desde el CRM Sales hacia un lead profesional.
 * @param {{ to, toName, subject, bodyText, executiveName, executiveEmail }} input
 *   - executiveName / executiveEmail van como reply-to para que la respuesta
 *     llegue directo al ejecutivo (no al buzón central).
 */
async function sendSalesOutreach({ to, toName, subject, bodyText, executiveName, executiveEmail }) {
  if (!to || !subject || !bodyText) throw new Error('to, subject y bodyText son requeridos');

  const cleanBody = String(bodyText).replace(/\n/g, '<br/>');
  const html = baseTemplate({
    title: subject,
    bodyHtml: `
      ${h1(subject)}
      ${p(cleanBody)}
      ${divider()}
      ${p(`${executiveName ? `<strong>${executiveName}</strong><br/>` : ''}${executiveEmail ? `<a href="mailto:${executiveEmail}" style="color:#085946;">${executiveEmail}</a><br/>` : ''}OírConecta · Red de profesionales auditivos en Colombia`)}
    `,
  });

  await deliver({
    to,
    toName: toName || to,
    subject,
    html,
    fromEmail: SALES_FROM_EMAIL,
    fromName:  SALES_FROM_NAME,
    replyTo:   executiveEmail || undefined,
  });
}

/**
 * Bienvenida con credenciales temporales para profesional captado por
 * el Ejecutivo Comercial. Incluye email + clave temporal y CTA al portal
 * profesional. El destinatario DEBE cambiar la clave al primer login.
 */
async function sendDirectoryWelcomeWithCredentials({ to, nombre, tempPassword, executiveName, executiveEmail }) {
  const portalUrl = `${SITE_URL}/login-directorio`;
  const html = baseTemplate({
    title: 'Bienvenido a OírConecta',
    bodyHtml: `
      ${h1(`Hola ${nombre || 'profesional'},`)}
      ${p(`Ya te registramos en <strong>OírConecta</strong>. Tu cuenta queda activa por <strong>120 días gratis</strong> en el portal profesional.`)}
      ${highlight([
        ['Email', to],
        ['Clave temporal', `<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-family:ui-monospace,monospace">${tempPassword}</code>`],
      ])}
      ${p(`Al ingresar por primera vez te pediremos que <strong>cambies la clave</strong> por una propia.`)}
      ${btn(portalUrl, 'Entrar al portal profesional')}
      ${divider()}
      ${p(`Tu contacto de captación:<br/><strong>${executiveName || 'Equipo OírConecta'}</strong><br/>${executiveEmail ? `<a href="mailto:${executiveEmail}" style="color:#085946;">${executiveEmail}</a>` : ''}`)}
    `,
  });
  await deliver({
    to, toName: nombre, subject: 'Bienvenido a OírConecta — tus credenciales',
    html,
    fromEmail: SALES_FROM_EMAIL, fromName: SALES_FROM_NAME,
    replyTo: executiveEmail || undefined,
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 1. CONFIRMACIÓN DE CITA
// ════════════════════════════════════════════════════════════════════════════
async function sendBookingConfirmation(appointment, meta = {}) {
  const proName  = meta.professionalName || 'el profesional';
  const fechaRaw = appointment.fecha instanceof Date
    ? appointment.fecha.toISOString().slice(0, 10)
    : String(appointment.fecha || '').slice(0, 10);
  const hora     = appointment.hora || '—';
  const paciente = appointment.patientName || 'Paciente';
  const motivo   = appointment.motivo || '—';
  const [fy, fm, fd] = fechaRaw.split('-').map(Number);
  const fecha = new Date(fy, fm - 1, fd).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Al paciente ──
  if (appointment.patientEmail) {
    const html = baseTemplate({
      preheader: `Tu cita quedó confirmada para el ${fecha} a las ${hora}.`,
      title: 'Cita confirmada — OírConecta',
      bodyHtml: [
        h1('Tu cita está confirmada ✓'),
        p(`Hola <strong>${paciente}</strong>, tu cita quedó registrada exitosamente.`),
        highlight([
          ['Profesional', proName],
          ['Fecha',       fecha],
          ['Hora',        hora],
          ['Motivo',      motivo],
        ]),
        appointment.directoryProfileId && appointment.rescheduleToken
          ? [
              `<div style="text-align:center;margin:24px 0;">`,
              `<a href="${SITE_URL}/agendar/reagendar?token=${appointment.rescheduleToken}" style="display:inline-block;margin:4px;padding:13px 22px;background:#15803d;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Reagendar mi cita</a>`,
              `<a href="${SITE_URL}/agendar/cancelar?token=${appointment.rescheduleToken}" style="display:inline-block;margin:4px;padding:13px 22px;background:#f9fafb;color:#dc2626;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;border:1.5px solid #dc2626;">Cancelar mi cita</a>`,
              `</div>`,
            ].join('')
          : p('Para reprogramar o cancelar tu cita llámanos al <a href="${TEL_HREF}"><strong>${WA_DISPLAY}</strong></a> o escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>.'),
        appointment.directoryProfileId ? '' : btn(`${SITE_URL}/blog`, 'Leer artículos de salud auditiva'),
        divider(),
        p(`<span style="font-size:13px;color:#6b7280;">¿Preguntas? Escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a></span>`),
      ].join(''),
    });
    await deliver({ to: appointment.patientEmail, toName: paciente, subject: `Cita confirmada con ${proName} — OírConecta`, html });
  }

  // ── Al profesional ──
  if (appointment.professionalNotifyEmail) {
    const html = baseTemplate({
      preheader: `Nueva cita agendada: ${paciente} el ${fecha} a las ${hora}.`,
      title: 'Nueva cita — OírConecta',
      bodyHtml: [
        h1('Nueva cita agendada'),
        p(`Se registró una nueva cita desde tu perfil en OírConecta.`),
        highlight([
          ['Paciente',   paciente],
          ['Email',      appointment.patientEmail || '—'],
          ['Teléfono',   appointment.patientPhone || '—'],
          ['Fecha',      fecha],
          ['Hora',       hora],
          ['Motivo',     motivo],
        ]),
        btn(`${SITE_URL}/portal-profesional`, 'Ver en mi portal'),
      ].join(''),
    });
    await deliver({ to: appointment.professionalNotifyEmail, toName: proName, subject: `Nueva cita: ${paciente} — OírConecta`, html });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 2. BIENVENIDA AL REGISTRARSE (profesional)
// ════════════════════════════════════════════════════════════════════════════
async function sendProfessionalWelcome({ email, nombre, nombreConsultorio }) {
  const html = baseTemplate({
    preheader: '¡Gracias por registrarte! Revisaremos tu perfil en menos de 24 horas.',
    title: 'Bienvenido/a a OírConecta',
    bodyHtml: [
      h1(`¡Bienvenido/a, ${nombre || 'profesional'}! 🎉`),
      p(`Recibimos tu registro${nombreConsultorio ? ` de <strong>${nombreConsultorio}</strong>` : ''} en el directorio de OírConecta.`),
      p('Nuestro equipo revisará tu información en <strong>menos de 24 horas</strong>. Te notificaremos cuando tu perfil esté aprobado y visible para los pacientes.'),
      `<table cellpadding="0" cellspacing="0" role="presentation"
        style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #085946;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#085946;">¿Qué sigue?</p>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
            <li>Revisión de tu perfil por el equipo OírConecta</li>
            <li>Aprobación y activación del perfil público</li>
            <li>Apareces en el directorio para pacientes en Colombia</li>
          </ul>
        </td></tr>
      </table>`,
      btn(`${SITE_URL}/portal-profesional`, 'Acceder a mi portal'),
      divider(),
      p(`<span style="font-size:13px;color:#6b7280;">¿Tienes preguntas? Escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> o por WhatsApp al <a href="${WA_HREF}">${WA_DISPLAY}</a>.</span>`),
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: '¡Bienvenido/a a OírConecta! Revisaremos tu perfil pronto', html });

  // Aviso al admin para que revise y apruebe
  if (ADMIN_EMAIL) {
    const adminHtml = baseTemplate({
      preheader: `Nuevo profesional registrado: ${nombre}. Pendiente de aprobación.`,
      title: 'Nuevo profesional — OírConecta',
      bodyHtml: [
        h1('Nuevo profesional registrado 🩺'),
        p('Un profesional se registró en el directorio y está pendiente de aprobación.'),
        highlight([
          ['Nombre',       nombre || '—'],
          ['Consultorio',  nombreConsultorio || '—'],
          ['Email',        email],
        ]),
        btn(`${SITE_URL}/portal-admin/directorio`, 'Revisar en el panel'),
      ].join(''),
    });
    deliver({ to: ADMIN_EMAIL, toName: 'Admin OírConecta', subject: `Nuevo profesional por aprobar: ${nombre} — OírConecta`, html: adminHtml })
      .catch(() => {});
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 3. PERFIL APROBADO
// ════════════════════════════════════════════════════════════════════════════
async function sendProfessionalApproved({ email, nombre, profileId }) {
  const profileUrl = profileId ? `${SITE_URL}/directorio/profesional/${profileId}` : `${SITE_URL}/directorio`;
  const html = baseTemplate({
    preheader: '¡Tu perfil fue aprobado! Ya apareces en el directorio de OírConecta.',
    title: 'Perfil aprobado — OírConecta',
    bodyHtml: [
      h1('¡Tu perfil fue aprobado! ✓'),
      p(`Hola <strong>${nombre || 'profesional'}</strong>, tu ficha ya está activa y visible en el directorio de OírConecta.`),
      p('Los pacientes podrán encontrarte, ver tu información y contactarte directamente desde tu perfil.'),
      `<table cellpadding="0" cellspacing="0" role="presentation"
        style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #085946;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#085946;">Recuerda completar tu perfil:</p>
          <ul style="margin:0;padding-left:20px;font-size:14px;color:#374151;line-height:2;">
            <li>Foto de perfil y banner</li>
            <li>Descripción profesional</li>
            <li>Sedes y horarios de atención</li>
            <li>Servicios en el marketplace</li>
          </ul>
        </td></tr>
      </table>`,
      btn(profileUrl, 'Ver mi perfil público'),
      `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:12px;">
        <tr><td><a href="${SITE_URL}/portal-profesional" style="font-size:14px;color:#085946;font-weight:600;">Gestionar mi portal →</a></td></tr>
      </table>`,
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: '¡Tu perfil en OírConecta fue aprobado!', html });
}

// ════════════════════════════════════════════════════════════════════════════
// 4. PERFIL RECHAZADO
// ════════════════════════════════════════════════════════════════════════════
async function sendProfessionalRejected({ email, nombre, rejectionReason }) {
  const html = baseTemplate({
    preheader: 'Tu perfil necesita ajustes. Revisa los comentarios del equipo.',
    title: 'Revisión de perfil — OírConecta',
    bodyHtml: [
      h1('Tu perfil necesita ajustes'),
      p(`Hola <strong>${nombre || 'profesional'}</strong>, revisamos tu solicitud de registro y encontramos algunos puntos que requieren corrección antes de publicar tu perfil.`),
      rejectionReason ? `<table cellpadding="0" cellspacing="0" role="presentation"
        style="background:#fef2f2;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #dc2626;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;">Motivo</p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;">${rejectionReason}</p>
        </td></tr>
      </table>` : '',
      p('Accede a tu portal, realiza los ajustes indicados y vuelve a enviar tu perfil para revisión.'),
      btn(`${SITE_URL}/portal-profesional/perfil`, 'Corregir mi perfil'),
      divider(),
      p(`<span style="font-size:13px;color:#6b7280;">¿Necesitas ayuda? Escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a></span>`),
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: 'Tu perfil en OírConecta necesita ajustes', html });
}

// ════════════════════════════════════════════════════════════════════════════
// 5. NUEVA CONSULTA RECIBIDA (al profesional)
// ════════════════════════════════════════════════════════════════════════════
async function sendNewInquiry({ professionalEmail, professionalName, inquiry }) {
  const { nombre, email, telefono, mensaje, tipoConsulta } = inquiry;
  const html = baseTemplate({
    preheader: `${nombre || 'Un visitante'} te envió una consulta desde tu perfil en OírConecta.`,
    title: 'Nueva consulta — OírConecta',
    bodyHtml: [
      h1('Tienes una nueva consulta 💬'),
      p(`Hola <strong>${professionalName || 'profesional'}</strong>, un visitante te envió un mensaje desde tu perfil público.`),
      highlight([
        ['Nombre',   nombre || '—'],
        ['Email',    email  || '—'],
        ['Teléfono', telefono || '—'],
        ['Tipo',     tipoConsulta || '—'],
      ]),
      `<table cellpadding="0" cellspacing="0" role="presentation"
        style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:16px 0 24px;width:100%;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Mensaje</p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.75;">${mensaje || '—'}</p>
        </td></tr>
      </table>`,
      btn(`${SITE_URL}/portal-profesional/consultas`, 'Ver en mi portal'),
    ].join(''),
  });
  await deliver({ to: professionalEmail, toName: professionalName, subject: `Nueva consulta de ${nombre || 'un visitante'} — OírConecta`, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 6. CONFIRMACIÓN AL VISITANTE QUE ESCRIBIÓ
// ════════════════════════════════════════════════════════════════════════════
async function sendInquiryConfirmation({ visitorEmail, visitorName, professionalName }) {
  const html = baseTemplate({
    preheader: `Recibimos tu mensaje para ${professionalName}. Te responderán pronto.`,
    title: 'Mensaje recibido — OírConecta',
    bodyHtml: [
      h1('Recibimos tu mensaje ✓'),
      p(`Hola <strong>${visitorName || ''}</strong>, confirmamos que tu mensaje para <strong>${professionalName || 'el profesional'}</strong> fue enviado correctamente.`),
      p('El profesional revisará tu consulta y se pondrá en contacto contigo directamente.'),
      `<table cellpadding="0" cellspacing="0" role="presentation"
        style="background:#f0fdf4;border-radius:12px;padding:16px 24px;margin:20px 0;border-left:4px solid #085946;">
        <tr><td>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.75;">
            Mientras esperas, puedes explorar otros profesionales de salud auditiva en nuestro directorio o leer artículos de salud en el blog de OírConecta.
          </p>
        </td></tr>
      </table>`,
      btn(`${SITE_URL}/directorio`, 'Explorar el directorio'),
    ].join(''),
  });
  await deliver({ to: visitorEmail, toName: visitorName, subject: `Recibimos tu mensaje — OírConecta`, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 7. RESTABLECER CONTRASEÑA
// ════════════════════════════════════════════════════════════════════════════
async function sendPasswordReset({ email, nombre, resetUrl, expiresInMinutes = 30 }) {
  const html = baseTemplate({
    preheader: 'Solicitud de restablecimiento de contraseña para tu cuenta OírConecta.',
    title: 'Restablecer contraseña — OírConecta',
    bodyHtml: [
      h1('Restablece tu contraseña'),
      p(`Hola <strong>${nombre || ''}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en OírConecta.`),
      p(`Este enlace es válido por <strong>${expiresInMinutes} minutos</strong>. Si no solicitaste este cambio, puedes ignorar este correo.`),
      btn(resetUrl, 'Restablecer contraseña'),
      divider(),
      p(`<span style="font-size:13px;color:#6b7280;">Si el botón no funciona, copia este enlace en tu navegador:<br/><a href="${resetUrl}" style="color:#085946;word-break:break-all;">${resetUrl}</a></span>`),
      p(`<span style="font-size:13px;color:#9ca3af;">¿No solicitaste esto? Tu cuenta sigue segura. Escríbenos si tienes dudas.</span>`),
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: 'Restablece tu contraseña — OírConecta', html });
}

// ════════════════════════════════════════════════════════════════════════════
// 8. FORMULARIO DE CONTACTO WEB (al equipo interno)
// ════════════════════════════════════════════════════════════════════════════
async function sendContactFormNotification({ nombre, email, telefono, asunto, mensaje }) {
  const internalEmail = process.env.INTERNAL_NOTIFY_EMAIL || FROM_EMAIL;
  const html = baseTemplate({
    preheader: `Nuevo mensaje de ${nombre} desde el formulario de contacto.`,
    title: 'Nuevo contacto web — OírConecta',
    bodyHtml: [
      h1('Nuevo mensaje del formulario web'),
      highlight([
        ['Nombre',   nombre   || '—'],
        ['Email',    email    || '—'],
        ['Teléfono', telefono || '—'],
        ['Asunto',   asunto   || '—'],
      ]),
      `<table cellpadding="0" cellspacing="0" role="presentation"
        style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:16px 0;width:100%;">
        <tr><td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">Mensaje</p>
          <p style="margin:0;font-size:15px;color:#374151;line-height:1.75;">${mensaje || '—'}</p>
        </td></tr>
      </table>`,
      email ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:8px;">
        <tr><td><a href="mailto:${email}" class="btn">Responder a ${nombre}</a></td></tr>
      </table>` : '',
    ].join(''),
  });
  await deliver({ to: internalEmail, toName: 'Equipo OírConecta', subject: `Contacto web: ${asunto || nombre} — OírConecta`, html });

  // Confirmación al visitante
  if (email) {
    const confirmHtml = baseTemplate({
      preheader: 'Recibimos tu mensaje. Te responderemos pronto.',
      title: 'Mensaje recibido — OírConecta',
      bodyHtml: [
        h1('Recibimos tu mensaje ✓'),
        p(`Hola <strong>${nombre || ''}</strong>, gracias por contactarnos. Revisaremos tu mensaje y te responderemos en menos de 24 horas.`),
        divider(),
        p(`<span style="font-size:13px;color:#6b7280;">¿Urgente? Escríbenos al WhatsApp <a href="${WA_HREF}">${WA_DISPLAY}</a></span>`),
      ].join(''),
    });
    await deliver({ to: email, toName: nombre, subject: 'Recibimos tu mensaje — OírConecta', html: confirmHtml });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 9. RECORDATORIO DE CITA (5 días / 1 día / 5 horas antes)
// ════════════════════════════════════════════════════════════════════════════
async function sendAppointmentReminder({ email, nombre, fecha, hora, tipo, confirmUrl, rescheduleUrl }) {
  const labels = { '5d': 'en 5 días', '1d': 'mañana', '5h': 'en 5 horas' };
  const label = labels[tipo] || 'próximamente';

  const html = baseTemplate({
    preheader: `Recuerda tu cita de valoración ${label} — ${fecha} a las ${hora}.`,
    title: `Recordatorio de cita — OírConecta`,
    bodyHtml: [
      h1(`Tu cita es ${label} 🗓️`),
      p(`Hola <strong>${nombre || ''}</strong>, te recordamos que tienes una cita de valoración auditiva agendada en OírConecta.`),
      highlight([
        ['Fecha', fecha],
        ['Hora',  hora],
        ['Duración', '50 minutos'],
        ['Consultorio', 'Carrera 10 #96-25 Cons. 320, Edificio Centro Ejecutivo, Bogotá'],
      ]),
      `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:24px 0;width:100%;">
        <tr>
          <td style="padding-right:12px;">
            <a href="${confirmUrl}" style="display:inline-block;padding:13px 24px;background:linear-gradient(135deg,#085946,#0d7a5f);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
              ✓ Confirmar cita
            </a>
          </td>
          <td>
            <a href="${rescheduleUrl}" style="display:inline-block;padding:13px 24px;background:#f9fafb;color:#085946;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;border:1.5px solid #085946;">
              ↺ Reagendar cita
            </a>
          </td>
        </tr>
      </table>`,
      divider(),
      p(`<span style="font-size:13px;color:#6b7280;">Para cancelar o más información: <a href="${WA_HREF}">WhatsApp ${WA_DISPLAY}</a> o <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a></span>`),
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: `Recordatorio: tu cita es ${label} — OírConecta`, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 10. NOTIFICACIÓN DE REAGENDAMIENTO (a audiologa y admin)
// ════════════════════════════════════════════════════════════════════════════
async function sendRescheduledNotification({ to, patientName, patientEmail, oldFecha, oldHora, newFecha, newHora }) {
  // Aviso al paciente
  if (patientEmail) {
    const html = baseTemplate({
      preheader: `Tu cita fue reagendada al ${newFecha} a las ${newHora}.`,
      title: 'Cita reagendada — OírConecta',
      bodyHtml: [
        h1('Tu cita fue reagendada ✓'),
        p(`Hola <strong>${patientName || ''}</strong>, tu cita quedó reprogramada exitosamente.`),
        highlight([
          ['Nueva fecha', newFecha],
          ['Nueva hora',  newHora],
        ]),
        p('Para más información escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> o al <a href="${WA_HREF}">${WA_DISPLAY}</a>.'),
      ].join(''),
    });
    await deliver({ to: patientEmail, toName: patientName, subject: `Tu cita fue reagendada — OírConecta`, html });
  }
  const html = baseTemplate({
    preheader: `${patientName} reagendó su cita del ${oldFecha} al ${newFecha}.`,
    title: 'Cita reagendada — OírConecta',
    bodyHtml: [
      h1('Cita reagendada por el paciente'),
      p(`El paciente <strong>${patientName || '—'}</strong> seleccionó un nuevo horario desde el correo de recordatorio.`),
      `<table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin:20px 0;">
        <tr>
          <td style="width:48%;background:#fef2f2;border-radius:12px;padding:16px 20px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.08em;">Cita anterior</p>
            <p style="margin:0;font-size:15px;color:#374151;font-weight:600;">${oldFecha} — ${oldHora}</p>
          </td>
          <td style="width:4%;"></td>
          <td style="width:48%;background:#f0fdf4;border-radius:12px;padding:16px 20px;vertical-align:top;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#085946;text-transform:uppercase;letter-spacing:0.08em;">Nueva cita</p>
            <p style="margin:0;font-size:15px;color:#374151;font-weight:600;">${newFecha} — ${newHora}</p>
          </td>
        </tr>
      </table>`,
      btn('https://oirconecta.com/portal-crm/citas', 'Ver en el CRM'),
    ].join(''),
  });
  await deliver({ to, subject: `Reagendamiento: ${patientName} — OírConecta`, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 10b. CANCELACIÓN — el paciente canceló por link; alerta al profesional
// ════════════════════════════════════════════════════════════════════════════
async function sendCancellationAlert({ to, professionalName, patientName, patientEmail, patientPhone, fecha, hora, tipoConsulta, reason }) {
  const proName = professionalName || 'Profesional';
  const patient = patientName || 'Paciente';
  const phoneClean = String(patientPhone || '').replace(/\D+/g, '');
  const telHref = phoneClean ? `tel:+${phoneClean.startsWith('57') ? phoneClean : `57${phoneClean}`}` : null;
  const waHref = phoneClean ? `https://wa.me/${phoneClean.startsWith('57') ? phoneClean : `57${phoneClean}`}` : null;
  const [fy, fm, fd] = String(fecha).split('-').map(Number);
  const fechaLarga = new Date(fy, fm - 1, fd).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const contactBtnRow = [
    telHref ? `<a href="${telHref}" style="display:inline-block;margin:4px;padding:12px 22px;background:#dc2626;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">📞 Llamar al paciente</a>` : '',
    waHref  ? `<a href="${waHref}" style="display:inline-block;margin:4px;padding:12px 22px;background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">💬 WhatsApp</a>` : '',
  ].join('');

  const html = baseTemplate({
    preheader: `${patient} canceló su cita del ${fecha} ${hora}. Contáctalo para saber qué pasó.`,
    title: 'Cita cancelada — OírConecta',
    bodyHtml: [
      h1('⚠️ Cita cancelada por el paciente'),
      p(`Hola ${proName}, <strong>${patient}</strong> canceló su cita usando el link del correo. Te recomendamos contactarlo para saber qué pasó y ofrecerle reagendar.`),
      highlight([
        ['Paciente',       patient],
        ['Teléfono',       patientPhone || '—'],
        ['Email',          patientEmail || '—'],
        ['Fecha original', fechaLarga],
        ['Hora original',  hora],
        ['Tipo consulta',  tipoConsulta || '—'],
        ['Motivo',         reason || '(no lo indicó)'],
      ]),
      `<div style="text-align:center;margin:24px 0;">${contactBtnRow}</div>`,
      p(`Cuando lo contactes, márcalo como <strong>contactado</strong> en tu portal para que la alerta desaparezca.`),
      btn(`${SITE_URL}/portal-profesional/agenda`, 'Ir a mi agenda'),
    ].join(''),
  });
  await deliver({ to, toName: proName, subject: `⚠️ ${patient} canceló su cita — OírConecta`, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 11. COMPARADOR — confirmación al paciente + aviso del lead al equipo
// ════════════════════════════════════════════════════════════════════════════
async function sendComparadorLeadEmails({ nombre, telefono, email, ciudad, marcaSugerida }) {
  // ── Aviso al equipo (conversemos@oirconecta.com) ──
  const adminEmail = 'conversemos@oirconecta.com';
  const adminHtml = baseTemplate({
    preheader: `Nuevo lead del comparador: ${nombre} (${telefono}).`,
    title: 'Nuevo lead del comparador — OírConecta',
    bodyHtml: [
      h1('Nuevo lead del comparador 📞'),
      p('Un paciente pidió orientación tras usar el comparador de audífonos.'),
      highlight([
        ['Nombre',          nombre   || '—'],
        ['Teléfono',        telefono || '—'],
        ['Email',           email    || '—'],
        ['Ciudad',          ciudad   || '—'],
        ['Opción sugerida', marcaSugerida || '—'],
      ]),
      btn(`${SITE_URL}/portal-admin/comparador`, 'Ver en el panel'),
    ].join(''),
  });
  await deliver({ to: adminEmail, toName: 'Equipo OírConecta', subject: `Nuevo lead del comparador: ${nombre} — OírConecta`, html: adminHtml });
  if (ADMIN_EMAIL && ADMIN_EMAIL !== adminEmail) {
    await deliver({ to: ADMIN_EMAIL, toName: 'Admin OírConecta', subject: `Nuevo lead del comparador: ${nombre} — OírConecta`, html: adminHtml });
  }

  // ── Confirmación al paciente (si dejó email) ──
  if (email) {
    const html = baseTemplate({
      preheader: 'Recibimos tu solicitud. Un asesor te contactará pronto.',
      title: 'Recibimos tu solicitud — OírConecta',
      bodyHtml: [
        h1('¡Gracias por tu interés! 👂'),
        p(`Hola <strong>${nombre || ''}</strong>, recibimos tu solicitud de orientación desde el comparador de audífonos.`),
        p('Un asesor te contactará pronto para ayudarte a elegir y adaptar la mejor opción según tu pérdida auditiva.'),
        marcaSugerida ? highlight([['Opción sugerida', marcaSugerida]]) : '',
        p('Mientras tanto, puedes explorar nuestro contenido de salud auditiva.'),
        btn(`${SITE_URL}/blog`, 'Leer artículos'),
        divider(),
        p(`<span style="font-size:13px;color:#6b7280;">¿Dudas? Escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> o WhatsApp <a href="${WA_HREF}">${WA_DISPLAY}</a>.</span>`),
      ].join(''),
    });
    await deliver({ to: email, toName: nombre, subject: 'Recibimos tu solicitud — OírConecta', html });
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 12. TIENDA — confirmación de pedido (cliente, con cross-sell) + aviso al equipo
// ════════════════════════════════════════════════════════════════════════════
function fmtCOP(n) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n || 0);
}

async function sendShopOrderEmails({ order, items = [], sugerencias = [] }) {
  const itemsHtml = items.map((it) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;color:#0f1923;">${it.cantidad}× ${it.nombre}${it.variante ? ` <span style="color:#6b7280;">(${it.variante})</span>` : ''}</td>
      <td style="padding:6px 0;font-size:14px;color:#0f1923;font-weight:600;text-align:right;white-space:nowrap;">${fmtCOP(it.subtotal)}</td>
    </tr>`).join('');

  const crossHtml = sugerencias.length ? (
    divider() +
    `<p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#085946;">También te puede servir</p>` +
    sugerencias.map((s) => `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:8px;">
        <tr>
          <td style="font-size:14px;color:#374151;">${s.nombre}</td>
          <td style="font-size:14px;color:#085946;font-weight:700;text-align:right;white-space:nowrap;">${fmtCOP(s.precio)}</td>
        </tr>
      </table>`).join('') +
    btn(`${SITE_URL}/ecommerce`, 'Ver en la tienda')
  ) : '';

  // ── Al cliente ──
  if (order.envioEmail) {
    const html = baseTemplate({
      preheader: `Recibimos tu pedido #${order.numero}. Te contactaremos para el pago y envío.`,
      title: 'Pedido recibido — OírConecta',
      bodyHtml: [
        h1(`¡Gracias por tu pedido! 🛍️`),
        p(`Hola <strong>${order.envioNombre || ''}</strong>, registramos tu pedido <strong>#${order.numero}</strong>. Te contactaremos para coordinar el pago y el envío.`),
        `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border-radius:12px;padding:8px 20px;margin:16px 0;">
          <tbody>${itemsHtml}
            <tr><td style="padding:10px 0 4px;font-size:15px;font-weight:800;color:#0f1923;border-top:1px solid #e5e7eb;">Total</td>
            <td style="padding:10px 0 4px;font-size:15px;font-weight:800;color:#085946;text-align:right;border-top:1px solid #e5e7eb;">${fmtCOP(order.total)}</td></tr>
          </tbody>
        </table>`,
        p(`<span style="font-size:13px;color:#6b7280;">Envío a: ${order.envioDireccion}, ${order.envioCiudad}${order.envioDepartamento ? ', ' + order.envioDepartamento : ''}.</span>`),
        crossHtml,
        divider(),
        p(`<span style="font-size:13px;color:#6b7280;">¿Dudas? <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> · WhatsApp <a href="${WA_HREF}">${WA_DISPLAY}</a></span>`),
      ].join(''),
    });
    await deliver({ to: order.envioEmail, toName: order.envioNombre, subject: `Pedido #${order.numero} recibido — OírConecta`, html });
  }

  // ── Al equipo ──
  const adminHtml = baseTemplate({
    preheader: `Nuevo pedido #${order.numero} por ${fmtCOP(order.total)}.`,
    title: 'Nuevo pedido — OírConecta',
    bodyHtml: [
      h1(`Nuevo pedido #${order.numero} 🛒`),
      highlight([
        ['Cliente',  order.envioNombre || '—'],
        ['Teléfono', order.envioTelefono || '—'],
        ['Email',    order.envioEmail || '—'],
        ['Ciudad',   order.envioCiudad || '—'],
        ['Total',    fmtCOP(order.total)],
      ]),
      `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0;">
        <tbody>${itemsHtml}</tbody>
      </table>`,
      btn(`${SITE_URL}/portal-admin/pedidos`, 'Ver en el panel'),
    ].join(''),
  });
  await deliver({ to: 'conversemos@oirconecta.com', toName: 'Equipo OírConecta', subject: `Nuevo pedido #${order.numero} — OírConecta`, html: adminHtml });
  if (ADMIN_EMAIL && ADMIN_EMAIL !== 'conversemos@oirconecta.com') {
    await deliver({ to: ADMIN_EMAIL, toName: 'Admin OírConecta', subject: `Nuevo pedido #${order.numero} — OírConecta`, html: adminHtml });
  }
}

// ─── Exports ─────────────────────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════
// NEWSLETTER — bienvenida y envío de edición
// ════════════════════════════════════════════════════════════════════════════

async function sendNewsletterWelcome({ email, nombre, unsubscribeUrl }) {
  const bodyHtml =
    h1(`¡Bienvenido a OírConecta, ${nombre || 'hola'}! 👂`) +
    p('Gracias por suscribirte a nuestro boletín. Cada quince días te enviaremos información útil sobre salud auditiva, audífonos, implantes y novedades del sector — escrita en lenguaje claro.') +
    p('Mientras tanto, puedes explorar profesionales verificados cerca de ti:') +
    btn(`${SITE_URL}/directorio`, 'Explorar el directorio') +
    divider() +
    `<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">Recibes este correo porque te suscribiste en oirconecta.com. Si no deseas seguir recibiéndolo, <a href="${unsubscribeUrl}" style="color:#6b7280;">cancela tu suscripción aquí</a>.</p>`;

  const html = baseTemplate({
    preheader: 'Gracias por suscribirte al boletín de OírConecta.',
    title: 'Bienvenido a OírConecta',
    bodyHtml,
  });

  await deliver({
    to: email,
    toName: nombre,
    subject: '👂 Bienvenido al boletín de OírConecta',
    html,
    text: `Bienvenido a OírConecta, ${nombre || ''}. Te enviaremos información de salud auditiva cada 15 días. Cancela: ${unsubscribeUrl}`,
  });

  // Aviso al admin de nuevo suscriptor
  if (ADMIN_EMAIL) {
    const adminHtml = baseTemplate({
      preheader: `Nuevo suscriptor al boletín: ${nombre} (${email}).`,
      title: 'Nuevo suscriptor — OírConecta',
      bodyHtml: [
        h1('Nuevo suscriptor al boletín 📧'),
        highlight([['Nombre', nombre || '—'], ['Email', email]]),
      ].join(''),
    });
    deliver({ to: ADMIN_EMAIL, toName: 'Admin OírConecta', subject: `Nuevo suscriptor: ${nombre} — OírConecta`, html: adminHtml })
      .catch(() => {});
  }
}

/**
 * Envía una edición del boletín a un suscriptor, inyectando el pixel de
 * apertura y reescribiendo el CTA para registrar el clic.
 * @param {{ email, nombre, subject, preheader, contentHtml, pixelUrl, unsubscribeUrl }} args
 */
async function sendNewsletterEdition({ email, nombre, subject, preheader, contentHtml, pixelUrl, unsubscribeUrl }) {
  const footer =
    divider() +
    `<p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">Recibes este correo porque te suscribiste en oirconecta.com. <a href="${unsubscribeUrl}" style="color:#6b7280;">Cancelar suscripción</a>.</p>`;
  const pixel = pixelUrl
    ? `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;border:0;" />`
    : '';
  const html = baseTemplate({
    preheader: preheader || '',
    title: subject,
    bodyHtml: contentHtml + footer + pixel,
  });
  return deliver({ to: email, toName: nombre, subject, html });
}

// ════════════════════════════════════════════════════════════════════════════
// SUSCRIPCIÓN — Despedida (cancelación)
// ════════════════════════════════════════════════════════════════════════════

async function sendSubscriptionCanceled({ email, nombre, motivo, vigenteHasta, reactivacionUrl }) {
  const html = baseTemplate({
    preheader: 'Hemos procesado la cancelación de tu suscripción en OírConecta.',
    title: 'Hemos cancelado tu suscripción',
    bodyHtml: [
      h1(`Gracias por habernos acompañado${nombre ? `, ${nombre}` : ''} 🌿`),
      p('Hemos procesado la cancelación de tu suscripción en OírConecta. Lamentamos verte partir.'),
      vigenteHasta
        ? p(`Tu perfil seguirá visible hasta el <strong>${new Date(vigenteHasta).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>. Después de esa fecha, dejará de aparecer en el directorio público.`)
        : p('Tu perfil ya no aparece en el directorio público.'),
      motivo
        ? `<table cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin:16px 0;border-left:4px solid #6b7280;">
            <tr><td>
              <p style="margin:0;font-size:13px;color:#6b7280;"><strong>Motivo registrado:</strong> ${motivo}</p>
            </td></tr>
          </table>`
        : '',
      `<table cellpadding="0" cellspacing="0" role="presentation" style="background:#f0fdf4;border-radius:12px;padding:20px 24px;margin:20px 0;border-left:4px solid #085946;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#085946;">Tu información sigue segura</p>
          <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
            No borramos tus datos. Si decides volver, tu perfil, reseñas e historial
            estarán esperándote tal como los dejaste.
          </p>
        </td></tr>
      </table>`,
      reactivacionUrl ? btn(reactivacionUrl, 'Reactivar mi suscripción') : '',
      divider(),
      p('Antes de irte, nos encantaría saber qué podríamos mejorar. Una respuesta a este correo basta — la leemos toda.'),
      p(`<span style="font-size:13px;color:#6b7280;">¿Cambiaste de opinión? Escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> o por WhatsApp al <a href="${WA_HREF}">${WA_DISPLAY}</a>.</span>`),
      p('<span style="font-size:13px;color:#6b7280;">Gracias por confiar en nosotros para conectar tu práctica con los pacientes que más te necesitan. Te deseamos lo mejor en el camino que sigues.</span>'),
      p('<span style="font-size:13px;color:#085946;font-weight:600;">— El equipo OírConecta</span>'),
    ].join(''),
  });
  await deliver({
    to: email,
    toName: nombre,
    subject: 'Hemos cancelado tu suscripción — OírConecta',
    html,
  });

  // Aviso al admin
  if (ADMIN_EMAIL) {
    const adminHtml = baseTemplate({
      preheader: `Cancelación procesada: ${nombre || email}`,
      title: 'Cancelación de suscripción',
      bodyHtml: [
        h1('Suscripción cancelada'),
        highlight([
          ['Profesional', nombre || '—'],
          ['Email', email],
          ['Vigente hasta', vigenteHasta ? new Date(vigenteHasta).toLocaleDateString('es-CO') : 'Inmediato'],
          ['Motivo', motivo || 'No especificado'],
        ]),
      ].join(''),
    });
    deliver({
      to: ADMIN_EMAIL,
      toName: 'Admin OírConecta',
      subject: `Cancelación: ${nombre || email} — OírConecta`,
      html: adminHtml,
    }).catch(() => {});
  }
}

async function sendSubscriptionReactivated({ email, nombre }) {
  const html = baseTemplate({
    preheader: '¡Bienvenido/a de regreso a OírConecta!',
    title: '¡Bienvenido/a de regreso!',
    bodyHtml: [
      h1(`¡Qué bueno tenerte de vuelta${nombre ? `, ${nombre}` : ''}! 🎉`),
      p('Tu suscripción está activa de nuevo. Tu perfil ya volvió al directorio y los pacientes pueden encontrarte.'),
      btn(`${SITE_URL}/portal-profesional`, 'Acceder a mi portal'),
      divider(),
      p('<span style="font-size:13px;color:#6b7280;">Si necesitas ayuda con tu perfil, escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>.</span>'),
    ].join(''),
  });
  await deliver({
    to: email,
    toName: nombre,
    subject: '¡Bienvenido/a de regreso! Tu suscripción está activa — OírConecta',
    html,
  });
}

/**
 * T2-Gap4 — Cumpleaños del paciente. Un envío al año, cerca del cumpleaños.
 */
async function sendBirthday({ to, nombre, referralCode = null }) {
  const primerNombre = (nombre || '').split(' ')[0] || 'querido/a';
  const referralUrl = referralCode ? `${SITE_URL}/invita/${referralCode}` : null;

  // T5 — Intenta obtener template editable desde DB.
  try {
    const templates = require('./emailTemplates.service');
    const { subject, body } = await templates.renderEmail('BIRTHDAY', {
      nombre: primerNombre, referralCode: referralCode || '',
    });
    if (subject && body) {
      const html = baseTemplate({ title: subject, preheader: 'Te deseamos un año lleno de sonidos hermosos', bodyHtml: body });
      await deliver({ to, toName: nombre, subject, html });
      return;
    }
  } catch (e) {
    console.warn('[email/birthday] fallback a hardcoded:', e.message);
  }

  // Fallback hardcoded si algo falla
  const html = baseTemplate({
    title: `¡Feliz cumpleaños, ${primerNombre}!`,
    preheader: 'Te deseamos un año lleno de sonidos hermosos',
    bodyHtml: [
      `<div style="text-align:center;margin:0 0 24px;">
        <div style="font-family:'Playfair Display',Georgia,serif;font-size:52px;line-height:1;color:#6d28d9;font-weight:500;">♪</div>
      </div>`,
      h1(`Feliz cumpleaños, ${primerNombre}`),
      p(`Hoy es tu día. Desde OírConecta y todo el equipo que te acompaña queremos desearte un año lleno de las conversaciones, la música y los sonidos que amas.`),
      p('Cuidar tu audición es cuidar tus recuerdos, tus vínculos y las risas que están por venir. Gracias por confiar en nosotros para acompañarte en ese camino.'),
      referralUrl
        ? [
            `<div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px 24px;margin:28px 0;text-align:center;">
              <div style="font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#6b21a8;margin-bottom:8px;">Un regalo para compartir</div>
              <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 16px;">Si conoces a alguien que necesita cuidar su audición, envíale este enlace único de tu parte. Le damos preferencia en agendamiento y te avisamos cuando agende.</p>
              <a href="${referralUrl}" style="display:inline-block;padding:12px 24px;background:#6d28d9;color:#fff !important;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Invitar a un amigo</a>
            </div>`,
          ].join('')
        : btn(`${SITE_URL}/directorio`, 'Explorar profesionales'),
      p(`<span style="font-size:13px;color:#6b7280;">Con cariño,<br/>El equipo OírConecta</span>`),
    ].join(''),
  });
  await deliver({ to, toName: nombre, subject: `¡Feliz cumpleaños, ${primerNombre}!`, html });
}

/**
 * T2-Gap4 — Notificación al referidor cuando su código es usado.
 */
async function sendReferralUsed({ to, referrerName, newPatientName }) {
  const primerNombre = (referrerName || '').split(' ')[0] || '';
  const newFirstName = (newPatientName || 'alguien').split(' ')[0];

  // T5 — Template editable desde admin
  try {
    const templates = require('./emailTemplates.service');
    const { subject, body } = await templates.renderEmail('REFERRAL_USED', {
      referrerName: primerNombre, newPatientName: newFirstName,
    });
    if (subject && body) {
      const html = baseTemplate({ title: subject, preheader: 'Gracias por compartir el cuidado auditivo', bodyHtml: body });
      await deliver({ to, toName: referrerName, subject, html });
      return;
    }
  } catch (e) {
    console.warn('[email/referral] fallback:', e.message);
  }

  const html = baseTemplate({
    title: `${primerNombre}, ${newFirstName} agendó con tu enlace`,
    preheader: 'Gracias por compartir el cuidado auditivo',
    bodyHtml: [
      h1(`${primerNombre}, gracias por compartir`),
      p(`${newFirstName} usó tu enlace único y acaba de agendar una cita con un profesional del directorio. Gracias por ayudar a que más personas cuiden su audición.`),
      p(`Cuando ${newFirstName} complete su valoración, activaremos un beneficio en tu próxima consulta como agradecimiento por la recomendación.`),
      btn(`${SITE_URL}/portal-crm`, 'Ver detalle en mi cuenta'),
      p(`<span style="font-size:13px;color:#6b7280;">Con aprecio,<br/>El equipo OírConecta</span>`),
    ].join(''),
  });
  await deliver({ to, toName: referrerName, subject: `Gracias, ${primerNombre}. Alguien usó tu invitación.`, html });
}

/**
 * T2-Gap1 — Nurture de lead sin cita. 3 emails a 24h/3d/7d.
 * Todos incluyen link de opt-out para respetar Ley 1581 (habeas data).
 */
async function sendLeadNurture({ to, nombre, step, interes, unsubscribeUrl }) {
  const primerNombre = (nombre || '').split(' ')[0] || 'hola';
  const bookUrl = `${SITE_URL}/directorio`;
  const blogUrl = `${SITE_URL}/blog`;

  // T5 — Template editable desde admin
  const codeMap = { 1: 'LEAD_NURTURE_1', 3: 'LEAD_NURTURE_2', 7: 'LEAD_NURTURE_3' };
  const code = codeMap[step];
  if (code) {
    try {
      const templates = require('./emailTemplates.service');
      const { subject, body } = await templates.renderEmail(code, {
        nombre: primerNombre, interes: interes || 'salud auditiva',
      });
      if (subject && body) {
        const optOutFooter = unsubscribeUrl
          ? `<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;"><a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;">No quiero recibir más correos</a></div>`
          : '';
        const html = baseTemplate({ preheader: subject, title: subject, bodyHtml: body + optOutFooter });
        await deliver({ to, toName: nombre, subject, html });
        return;
      }
    } catch (e) {
      console.warn(`[email/nurture-${step}] fallback:`, e.message);
    }
  }

  // Fallback hardcoded
  const optOutFooter = unsubscribeUrl
    ? `<div style="text-align:center;margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;">
         <a href="${unsubscribeUrl}" style="font-size:12px;color:#94a3b8;">No quiero recibir más correos</a>
       </div>`
    : '';

  let subject, bodyHtml;

  if (step === 1) {
    // Email 1 · 24h · Educativo, sin venta
    subject = `${primerNombre}, ¿sabías esto sobre tu audición?`;
    bodyHtml = [
      h1(`Hola ${primerNombre},`),
      p(`Gracias por consultarnos sobre ${interes ? `"${interes.toLowerCase()}"` : 'salud auditiva'}. Queremos que sepas que dar el primer paso es lo más difícil — y ya lo diste.`),
      p(`<strong>Un dato que muchos no conocen:</strong> el 90% de los problemas de audición son tratables si se detectan temprano. La mayoría de personas espera 7 años antes de consultar. Tú acabas de adelantarte.`),
      p('En OírConecta encontrarás profesionales verificados en toda Colombia, con precios y horarios reales. Puedes explorar sin compromiso.'),
      btn(bookUrl, 'Explorar profesionales cercanos'),
      p(`<span style="font-size:13px;color:#6b7280;">También puedes leer nuestros artículos: <a href="${blogUrl}">Blog OírConecta</a></span>`),
      optOutFooter,
    ].join('');
  } else if (step === 3) {
    // Email 2 · 3d · Testimonial
    subject = `${primerNombre}, así fue la historia de María`;
    bodyHtml = [
      h1(`${primerNombre}, un testimonio que quiero compartir contigo`),
      p(`María Camila (52 años, Bogotá) llevaba <strong>4 años</strong> pidiendo a su familia que "hablaran más duro". Pensaba que era normal a su edad.`),
      `<blockquote style="border-left:3px solid #6d28d9;padding:8px 20px;margin:20px 0;font-style:italic;color:#334155;background:#faf5ff;border-radius:0 10px 10px 0;">
         "Cuando entré por primera vez a la valoración, tenía miedo. Al final me sentí escuchada por primera vez en años. Salí con un plan claro y ganas de intentarlo."
       </blockquote>`,
      p('Ese primer paso — la valoración — dura 45 minutos y te da respuestas concretas. No compromiso, no venta forzada. Solo información honesta sobre tu audición.'),
      btn(bookUrl, 'Agendar mi valoración'),
      p(`<span style="font-size:13px;color:#6b7280;">Si tienes preguntas antes, escríbenos: <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a></span>`),
      optOutFooter,
    ].join('');
  } else {
    // Email 3 · 7d · CTA suave con oferta
    subject = `${primerNombre}, tu valoración auditiva te está esperando`;
    bodyHtml = [
      h1(`${primerNombre}, un último recordatorio`),
      p(`Hace una semana consultaste sobre ${interes ? `"${interes.toLowerCase()}"` : 'salud auditiva'}. Sabemos que la vida se atraviesa y a veces los proyectos importantes quedan en pausa.`),
      p(`<strong>Solo queremos recordarte:</strong> agendar tu valoración con un profesional verificado toma menos de 2 minutos. Los precios son claros. Puedes agendar hoy y evaluar sin compromiso.`),
      `<div style="background:#faf5ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
         <div style="font-weight:700;color:#6b21a8;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:8px;">Beneficios de agendar por OírConecta</div>
         <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.7;">
           <li>Profesionales <strong>verificados</strong> (RETHUS + tarjeta profesional)</li>
           <li>Precios <strong>reales antes de agendar</strong> — sin sorpresas</li>
           <li>Recordatorios automáticos por email y WhatsApp</li>
           <li>Cancelar o reagendar en 1 clic</li>
         </ul>
       </div>`,
      btn(bookUrl, 'Ver profesionales disponibles'),
      p(`<span style="font-size:13px;color:#6b7280;">Este es el último correo de esta serie. Si te unes en el futuro, estaremos aquí.</span>`),
      optOutFooter,
    ].join('');
  }

  const html = baseTemplate({ preheader: subject, title: subject, bodyHtml });
  await deliver({ to, toName: nombre, subject, html });
}

/**
 * F6 — Solicitud de reseña post-cita.
 * Se envía ~24h después de que el profesional marque la cita como COMPLETED.
 * Incluye link único con reviewToken para dejar reseña sin login.
 */
async function sendReviewRequest({ to, patientName, professionalName, reviewToken, fecha, tipoConsulta }) {
  const reviewUrl = `${SITE_URL}/dejar-resena/${reviewToken}`;
  const stars = '<span style="letter-spacing:6px;font-size:22px;">☆ ☆ ☆ ☆ ☆</span>';
  const primerNombre = (patientName || '').split(' ')[0] || '';

  // T5 — Template editable
  try {
    const templates = require('./emailTemplates.service');
    const { subject, body } = await templates.renderEmail('REVIEW_REQUEST', {
      nombre: primerNombre, professionalName,
      tipoConsulta: tipoConsulta || 'consulta',
      fecha: fecha || '', reviewUrl,
    });
    if (subject && body) {
      const html = baseTemplate({ preheader: 'Tu opinión ayuda a otros pacientes', title: subject, bodyHtml: body });
      await deliver({ to, toName: patientName, subject, html });
      return;
    }
  } catch (e) {
    console.warn('[email/review] fallback:', e.message);
  }
  const html = baseTemplate({
    title: `¿Cómo fue tu consulta con ${professionalName}?`,
    preheader: 'Tu opinión ayuda a otros pacientes a decidir',
    bodyHtml: [
      h1(`Hola ${primerNombre},`),
      p(`Gracias por confiar en <strong>${professionalName}</strong>${fecha ? ` para tu ${tipoConsulta || 'consulta'} del ${fecha}` : ''}. Nos encantaría saber cómo te fue.`),
      p('Tu reseña ayuda a otros pacientes a encontrar el profesional adecuado y le da a los profesionales el reconocimiento que merecen.'),
      `<div style="text-align:center;margin:32px 0 24px;">${stars}</div>`,
      `<div style="text-align:center;margin:0 0 32px;">`,
      `<a href="${reviewUrl}" style="display:inline-block;padding:14px 32px;background:#6d28d9;color:#ffffff !important;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;">Dejar mi reseña</a>`,
      `</div>`,
      p(`<span style="font-size:13px;color:#6b7280;">Toma menos de 1 minuto. Tu reseña será revisada antes de publicarse.</span>`),
    ].join(''),
  });
  await deliver({
    to,
    toName: patientName,
    subject: `¿Cómo fue tu consulta con ${professionalName}?`,
    html,
  });
}

/**
 * T2-Gap3 — Control 15 días post-cita.
 * Se envía cuando el paciente lleva 15 días desde su cita COMPLETED.
 * Puramente acompañamiento: sin CTA agresivo de venta.
 */
async function sendControl15d({ to, patientName, professionalName, tipoConsulta }) {
  const primerNombre = (patientName || '').split(' ')[0] || '';
  try {
    const templates = require('./emailTemplates.service');
    const { subject, body } = await templates.renderEmail('CONTROL_15D', {
      nombre: primerNombre,
      professionalName: professionalName || 'tu profesional',
      tipoConsulta: tipoConsulta || 'consulta',
    });
    if (subject && body) {
      const html = baseTemplate({ preheader: 'Un check-in a 15 días', title: subject, bodyHtml: body });
      await deliver({ to, toName: patientName, subject, html });
      return;
    }
  } catch (e) {
    console.warn('[email/control15d] fallback:', e.message);
  }
  const subject = `${primerNombre}, ¿cómo va tu adaptación?`;
  const html = baseTemplate({
    title: subject,
    preheader: 'Un check-in a 15 días de tu consulta',
    bodyHtml: [
      h1(`Hola ${primerNombre},`),
      p(`Han pasado dos semanas desde tu ${tipoConsulta || 'consulta'} con <strong>${professionalName || 'tu profesional'}</strong>. Queríamos saber cómo te has sentido.`),
      p('La adaptación auditiva es un proceso: los primeros días el cerebro está aprendiendo a interpretar sonidos que había olvidado. Algunas personas se sienten cómodas en una semana, otras necesitan uno o dos meses. Ambos son ritmos normales.'),
      p(`Si algo no se siente bien, no esperes: contactar a ${professionalName || 'tu profesional'} y ajustar el plan es parte del proceso.`),
      p('Con cariño,<br/>El equipo OírConecta'),
    ].join(''),
  });
  await deliver({ to, toName: patientName, subject, html });
}

/**
 * F8 — Recordatorio de control de adaptación (T-7 / T-1 / OVERDUE).
 * @param {object} p
 * @param {'T7'|'T1'|'OVERDUE'} p.stage — cuál template usar
 * @param {string} p.to
 * @param {string} p.patientName
 * @param {string} p.controlLabel — "Control 3 meses", etc.
 * @param {number} [p.diasDesdeAdaptacion]
 * @param {string} [p.bookingUrl]
 */
async function sendControlReminder({ stage, to, patientName, controlLabel, diasDesdeAdaptacion, bookingUrl }) {
  const code = stage === 'T7' ? 'CONTROL_T7' : stage === 'T1' ? 'CONTROL_T1' : 'CONTROL_OVERDUE';
  const primerNombre = (patientName || '').split(' ')[0] || '';
  const payload = {
    nombre: primerNombre,
    controlLabel: controlLabel || 'control',
    diasDesdeAdaptacion: diasDesdeAdaptacion != null ? String(diasDesdeAdaptacion) : '',
    bookingUrl: bookingUrl || `${SITE_URL}/agendar`,
    telefonoCentro: process.env.CENTRO_TELEFONO || '+57 300 000 0000',
  };
  try {
    const templates = require('./emailTemplates.service');
    const { subject, body } = await templates.renderEmail(code, payload);
    if (subject && body) {
      const html = baseTemplate({ preheader: 'Recordatorio de control OírConecta', title: subject, bodyHtml: body });
      await deliver({ to, toName: patientName, subject, html });
      return;
    }
  } catch (e) {
    console.warn(`[email/${code}] fallback:`, e.message);
  }
  // Fallback minimalista
  const subject = stage === 'OVERDUE'
    ? `${primerNombre}, tu ${controlLabel || 'control'} quedó pendiente`
    : `${primerNombre}, tu ${controlLabel || 'control'} se acerca`;
  const html = baseTemplate({
    title: subject, preheader: 'Recordatorio de control',
    bodyHtml: [
      h1(`Hola ${primerNombre},`),
      p(`Se acerca tu <strong>${controlLabel || 'control'}</strong>. Agéndalo cuando quieras respondiendo este email o entrando a <a href="${payload.bookingUrl}">tu portal</a>.`),
    ].join(''),
  });
  await deliver({ to, toName: patientName, subject, html });
}

module.exports = {
  sendSalesOutreach,
  sendDirectoryWelcomeWithCredentials,
  sendBookingConfirmation,
  sendProfessionalWelcome,
  sendNewsletterWelcome,
  sendNewsletterEdition,
  sendProfessionalApproved,
  sendProfessionalRejected,
  sendNewInquiry,
  sendInquiryConfirmation,
  sendPasswordReset,
  sendContactFormNotification,
  sendComparadorLeadEmails,
  sendShopOrderEmails,
  sendSubscriptionCanceled,
  sendSubscriptionReactivated,

  sendAppointmentReminder,
  sendRescheduledNotification,
  sendCancellationAlert,
  sendReviewRequest,
  sendLeadNurture,
  sendBirthday,
  sendReferralUsed,
  sendControl15d,
  sendControlReminder,

  // T5 — Envío de prueba desde el admin buzón
  sendTemplatePreview: async ({ to, subject, body }) => {
    const html = baseTemplate({
      preheader: '[PRUEBA] ' + subject,
      title: subject,
      bodyHtml: `<div style="background:#fef3c7;border:1px solid #fbbf24;color:#78350f;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:600;margin-bottom:16px;">✓ Este es un envío de prueba desde el buzón de templates</div>${body}`,
    });
    return deliver({ to, toName: 'Admin', subject: '[PRUEBA] ' + subject, html });
  },

  // Alias para compatibilidad con código anterior
  sendBookingConfirmations: sendBookingConfirmation,
};
