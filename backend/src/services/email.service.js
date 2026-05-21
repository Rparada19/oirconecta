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
const LOGO_URL         = 'https://oirconecta.com/logo-oirconecta.png';
const SITE_URL         = 'https://oirconecta.com';

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
async function deliver({ to, toName, subject, html, text }) {
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
          from: { name: FROM_NAME, email: FROM_EMAIL },
          to: [{ name: toName || to, email: to }],
          subject,
          html,
          ...(text ? { text } : {}),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        const err = await res.text().catch(() => '');
        console.error('[email] Sender.com error', res.status, err.slice(0, 300));
      } else {
        console.log('[email] Sender.com →', to, subject);
      }
      return;
    } catch (e) {
      console.error('[email] Sender.com exception:', e.message);
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
        body: JSON.stringify({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html }),
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
        p('Para reprogramar o cancelar tu cita llámanos al <a href="tel:+573157939569"><strong>+57 315 793 9569</strong></a> o escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>.'),
        btn(`${SITE_URL}/blog`, 'Leer artículos de salud auditiva'),
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
      p(`<span style="font-size:13px;color:#6b7280;">¿Tienes preguntas? Escríbenos a <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> o por WhatsApp al <a href="https://wa.me/573157939569">+57 315 793 9569</a>.</span>`),
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: '¡Bienvenido/a a OírConecta! Revisaremos tu perfil pronto', html });
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
      p(`<span style="font-size:13px;color:#6b7280;">Para cancelar o más información: <a href="https://wa.me/573157939569">WhatsApp +57 315 793 9569</a> o <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a></span>`),
    ].join(''),
  });
  await deliver({ to: email, toName: nombre, subject: `Recordatorio: tu cita es ${label} — OírConecta`, html });
}

// ════════════════════════════════════════════════════════════════════════════
// 10. NOTIFICACIÓN DE REAGENDAMIENTO (a audiologa y admin)
// ════════════════════════════════════════════════════════════════════════════
async function sendRescheduledNotification({ to, patientName, oldFecha, oldHora, newFecha, newHora }) {
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

  return deliver({
    to: email,
    toName: nombre,
    subject: '👂 Bienvenido al boletín de OírConecta',
    html,
    text: `Bienvenido a OírConecta, ${nombre || ''}. Te enviaremos información de salud auditiva cada 15 días. Cancela: ${unsubscribeUrl}`,
  });
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

module.exports = {
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

  sendAppointmentReminder,
  sendRescheduledNotification,

  // Alias para compatibilidad con código anterior
  sendBookingConfirmations: sendBookingConfirmation,
};
