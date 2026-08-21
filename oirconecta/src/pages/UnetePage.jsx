import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '../components/Header';
import Footer from '../components/Footer';

const REGISTRO_URL = 'https://oirconecta.com/registro-profesional';

const PLANES = [
  {
    tier: 'Visible', sub: 'Te encuentran en el directorio', tag: null, feat: false,
    m: { precio: '$40.000', per: '/mes', iva: '+ IVA 19% — total $47.600', extra: null },
    a: { precio: '$400.000', per: '/año', iva: '+ IVA 19% — total $476.000', extra: 'Equivale a 10 meses (2 gratis)' },
    trial: '90 días de prueba gratis',
    items: ['Perfil verificado en el directorio', 'Presentación personal', 'Presentación de servicios',
      'Marcas que manejas', 'Reseñas de pacientes', 'Cómo llegar (mapa)', 'Mensaje directo de pacientes'],
  },
  {
    tier: 'Pro', sub: 'Agenda tus citas online', tag: 'Más popular', feat: true,
    m: { precio: '$80.000', per: '/mes', iva: '+ IVA 19% — total $95.200', extra: null },
    a: { precio: '$800.000', per: '/año', iva: '+ IVA 19% — total $952.000', extra: 'Equivale a 10 meses (2 gratis)' },
    trial: null,
    items: ['Todo lo de Visible', 'Sistema de agendamiento propio', 'Reservas desde tu perfil público',
      'Integración con Google Calendar', 'Recordatorios automáticos'],
  },
  {
    tier: 'Total', sub: 'Agente virtual + WhatsApp', tag: 'Con IA', feat: false, ia: true,
    m: { precio: '$150.000', per: '/mes', iva: '+ IVA 19% — total $178.500', extra: null },
    a: { precio: '$1.500.000', per: '/año', iva: '+ IVA 19% — total $1.785.000', extra: 'Equivale a 10 meses (2 gratis)' },
    trial: null,
    items: ['Todo lo de Pro', 'Agente virtual que agenda, reagenda y resuelve dudas',
      'Integración con WhatsApp', '240 conversaciones/mes (chat, widget y WhatsApp)', 'Paquetes adicionales disponibles'],
  },
];

export default function UnetePage() {
  const [periodo, setPeriodo] = useState('m'); // 'm' | 'a'

  return (
    <>
      <Helmet>
        <title>Únete a OírConecta — Guía de registro para profesionales</title>
        <meta name="description" content="Regístrate, activa tu perfil y capta pacientes en el directorio líder de salud auditiva en Colombia. 7 pasos, 90 días gratis y planes desde $25.000/mes." />
        <link rel="canonical" href="https://oirconecta.com/unete" />
      </Helmet>
      <Header />

      <style>{uneteCss}</style>
      <main className="unete">
        {/* HERO */}
        <header className="un-hero">
          <div className="un-hero-bg" />
          <div className="un-wrap un-hero-in">
            <span className="un-eyebrow">Guía de registro · Profesionales</span>
            <h1>Tu camino a OírConecta</h1>
            <p className="un-lead">Regístrate, activa tu perfil y empieza a captar pacientes en el directorio líder de salud auditiva en Colombia. De cero a activo en 7 pasos.</p>
            <div className="un-cta">
              <a className="un-btn un-btn-primary" href={REGISTRO_URL}>Registrarme ahora →</a>
              <a className="un-btn un-btn-ghost" href="#un-planes">Ver planes</a>
            </div>
          </div>
        </header>

        {/* OVERVIEW */}
        <section className="un-sec">
          <div className="un-wrap">
            <div className="un-sechead">
              <span className="un-eyebrow">El proceso, de un vistazo</span>
              <h2>Desde tu primer clic hasta tu primer paciente</h2>
              <p>Un flujo claro, rápido y sin fricciones. Cada etapa está pensada para que tu experiencia como profesional sea fluida.</p>
            </div>
            <div className="un-strip">
              {[['01', 'Registro', 'Crea tu cuenta en minutos'], ['02', 'Aprobación', 'Verificación rápida del perfil'],
                ['03', 'Primer acceso', 'Inicias sesión por primera vez'], ['04', 'Onboarding', 'Configuras perfil y servicios'],
                ['05', 'Prueba gratis', '90 días sin costo'], ['06', 'Elige tu plan', 'Visible, Pro o Total'],
                ['07', 'Activo', 'Captando pacientes']].map(([n, t, d]) => (
                <div className="un-chip" key={n}><span className="un-num">{n}</span><strong>{t}</strong><span>{d}</span></div>
              ))}
            </div>
          </div>
        </section>

        {/* STEPS */}
        <section className="un-sec">
          <div className="un-wrap un-steps">
            <article className="un-step">
              <div className="un-marker"><small>Paso</small>1</div>
              <div className="un-body">
                <h3>Registro en OírConecta</h3>
                <p>Ingresa a <b>oirconecta.com/registro-profesional</b> y completa el formulario inicial. Es rápido y sencillo:</p>
                <div className="un-grid2">
                  <div className="un-field"><b>Nombre completo</b><span>Tal como aparecerá en el directorio público.</span></div>
                  <div className="un-field"><b>Correo y contraseña</b><span>Tus credenciales de acceso a la plataforma.</span></div>
                  <div className="un-field"><b>Tipo de persona</b><span>Natural (independiente) o empresa (clínica u organización).</span></div>
                  <div className="un-field"><b>Documento de identidad</b><span>Para validar tu identidad y dar confianza al directorio.</span></div>
                </div>
                <div className="un-note">Al enviar el formulario, tu perfil queda en estado <b>Pendiente</b> hasta que un administrador lo revise. Recibirás un correo confirmando que tu solicitud fue recibida.</div>
              </div>
            </article>

            <article className="un-step">
              <div className="un-marker"><small>Paso</small>2</div>
              <div className="un-body">
                <h3>Revisión y aprobación</h3>
                <p>Un administrador de OírConecta evalúa tu solicitud para garantizar la calidad y veracidad del directorio.</p>
                <div className="un-pills">
                  <span className="un-pill ok">Aprobada · avanzas al siguiente paso</span>
                  <span className="un-pill warn">Ajustes solicitados · te pedimos correcciones</span>
                  <span className="un-pill">Rechazada · te notificamos el motivo</span>
                </div>
                <div className="un-note">Solo las solicitudes aprobadas continúan a la activación. Este filtro protege la integridad del directorio para los pacientes.</div>
              </div>
            </article>

            <article className="un-step">
              <div className="un-marker"><small>Paso</small>3</div>
              <div className="un-body">
                <h3>Primer ingreso a la plataforma</h3>
                <p>Una vez aprobado, accede a <b>oirconecta.com/login-directorio</b> con tu correo y contraseña.</p>
                <div className="un-grid2">
                  <div className="un-field"><b>Contraseña propia</b><span>Si la creaste al registrarte, inicias sesión directamente.</span></div>
                  <div className="un-field"><b>Clave temporal</b><span>Si se te asignó una, el sistema te pide definir tu contraseña definitiva. Solo se hace una vez.</span></div>
                </div>
              </div>
            </article>

            <article className="un-step">
              <div className="un-marker"><small>Paso</small>4</div>
              <div className="un-body">
                <h3>Onboarding: completa tu ficha pública</h3>
                <p>El asistente de bienvenida te guía en 5 pasos para construir un perfil completo y atractivo que inspire confianza.</p>
                <div className="un-grid2">
                  <div className="un-field"><b>1 · Tu imagen</b><span>Una foto profesional. Los perfiles con foto reciben más contactos.</span></div>
                  <div className="un-field"><b>2 · Tu historia</b><span>Quién eres, tu formación y tu enfoque. Lo cercano genera confianza.</span></div>
                  <div className="un-field"><b>3 · Servicios</b><span>Audiometrías, adaptación de auxiliares, rehabilitación auditiva…</span></div>
                  <div className="un-field"><b>4 · Marcas</b><span>Las marcas de auxiliares que manejas, para conectar con quien las busca.</span></div>
                  <div className="un-field"><b>5 · Contacto y ubicación</b><span>Dirección, teléfono y mapa "Cómo llegar" para que te encuentren fácil.</span></div>
                </div>
              </div>
            </article>

            <article className="un-step">
              <div className="un-marker"><small>Paso</small>5</div>
              <div className="un-body">
                <h3>90 días gratis para empezar</h3>
                <p>Al completar el onboarding, tu perfil se activa automáticamente con el <b>plan Visible durante 90 días, gratis</b>. Sin tarjeta de crédito.</p>
                <div className="un-grid2">
                  <div className="un-field"><b>Apareces en el directorio</b><span>Tu ficha pública visible desde el primer día.</span></div>
                  <div className="un-field"><b>Te encuentran</b><span>Los pacientes te buscan por especialidad, ciudad y servicios.</span></div>
                </div>
                <div className="un-note">Empiezas a construir tu presencia digital desde el día uno, sin ningún costo.</div>
              </div>
            </article>

            <article className="un-step">
              <div className="un-marker"><small>Paso</small>6</div>
              <div className="un-body">
                <h3>Elige el plan que más te conviene</h3>
                <p>Antes de que terminen tus 90 días, eliges el plan con el que deseas continuar. El detalle está justo abajo.</p>
                <div className="un-note">Si no eliges un plan antes de que venza la prueba, recibirás un correo automático invitándote a activar tu suscripción para no perder visibilidad.</div>
              </div>
            </article>
          </div>
        </section>

        {/* PLANES */}
        <section className="un-sec" id="un-planes">
          <div className="un-wrap">
            <div className="un-planshead">
              <div className="un-sechead" style={{ margin: 0 }}>
                <span className="un-eyebrow">Paso 6 · Planes</span>
                <h2>Elige cómo quieres crecer</h2>
              </div>
              <div className="un-toggle" role="tablist" aria-label="Periodicidad">
                <button className={periodo === 'm' ? 'active' : ''} aria-pressed={periodo === 'm'} onClick={() => setPeriodo('m')}>Mensual</button>
                <button className={periodo === 'a' ? 'active' : ''} aria-pressed={periodo === 'a'} onClick={() => setPeriodo('a')}>Anual · ahorra</button>
              </div>
            </div>

            <div className="un-plans">
              {PLANES.map((p) => {
                const pr = p[periodo];
                return (
                  <article className={`un-plan${p.feat ? ' feat' : ''}${p.ia ? ' ia' : ''}`} key={p.tier}>
                    {p.tag && <span className="un-plantag">{p.tag}</span>}
                    <h3>{p.tier}</h3>
                    <p className="un-plansub">{p.sub}</p>
                    <div className="un-price"><span className="un-amount">{pr.precio}</span><span className="un-per">{pr.per}</span></div>
                    <div className="un-ivaline">{pr.iva}</div>
                    {(p.trial || pr.extra) && (
                      <p className="un-trial">{p.trial || ''}{p.trial && pr.extra ? ' · ' : ''}{pr.extra || ''}</p>
                    )}
                    <ul>{p.items.map((it) => <li key={it}>{it}</li>)}</ul>
                  </article>
                );
              })}
            </div>
            <p className="un-empresa">¿Empresa o centro con varias sedes? Cada sede se registra y factura como una suscripción independiente. Ej. 10 sedes con agenda = 10 planes Pro.</p>
          </div>
        </section>

        {/* OUTCOME */}
        <section className="un-sec">
          <div className="un-wrap">
            <div className="un-sechead">
              <span className="un-eyebrow">Paso 7</span>
              <h2>Activo y captando pacientes</h2>
              <p>Con tu plan activo, tu ficha vive permanentemente en el directorio. Los pacientes que buscan atención auditiva en tu ciudad te encuentran de forma orgánica.</p>
            </div>
            <div className="un-out">
              <div className="un-outcard"><h3>Te encuentran</h3><p>Buscan por especialidad, ciudad o marca de auxiliar y tu perfil aparece en los resultados relevantes.</p></div>
              <div className="un-outcard"><h3>Te escriben</h3><p>Los pacientes te contactan directamente desde tu ficha, con los datos que configuraste.</p></div>
              <div className="un-outcard"><h3>Agendan citas</h3><p>Según tu plan, reservan directamente desde tu perfil — sin llamadas ni intermediarios.</p></div>
              <div className="un-outcard"><h3>Agente virtual 24/7</h3><p>En el plan Total, un agente virtual responde preguntas y califica prospectos por ti, a toda hora.</p></div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="un-sec un-final">
          <div className="un-wrap">
            <div className="un-finalcard">
              <span className="un-eyebrow un-eyebrow-gold">Empieza hoy — es gratis</span>
              <h2>Tu primer paso toma menos de 5 minutos</h2>
              <p>Únete a la comunidad de profesionales de salud auditiva que ya están creciendo con OírConecta.</p>
              <a className="un-btn un-btn-white" href={REGISTRO_URL}>Crear mi perfil gratis →</a>
              <div className="un-finalsteps">
                {[['01', 'Regístrate', 'Llena el formulario en oirconecta.com/registro-profesional'],
                  ['02', 'Espera la aprobación', 'Revisamos tu solicitud y te notificamos en breve.'],
                  ['03', 'Completa tu ficha', 'El asistente te guía en 5 pasos.'],
                  ['04', '90 días gratis', 'Tu perfil se activa de inmediato, sin tarjeta.']].map(([n, t, d]) => (
                  <div className="un-sf" key={n}><span className="un-sfn">{n}</span><b>{t}</b><span>{d}</span></div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

const uneteCss = `
.unete { --un-ground:#FBFAF6; --un-surface:#FFFFFF; --un-surface2:#F3F0E7; --un-ink:#17251E; --un-inksoft:#4C5B54;
  --un-line:#E4DECF; --un-brand:#0B5A46; --un-brand2:#0E7A5F; --un-gold:#B8925A; --un-goldsoft:#EFE4CE;
  --un-shadow:0 24px 60px -30px rgba(11,42,34,.35); --un-serif:ui-serif,Georgia,"Times New Roman",serif;
  --un-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,Roboto,sans-serif;
  background:var(--un-ground); color:var(--un-ink); font-family:var(--un-sans); line-height:1.6; }
@media (prefers-color-scheme: dark) { .unete { --un-ground:#0D1613; --un-surface:#14211C; --un-surface2:#1B2A24;
  --un-ink:#EAF2EE; --un-inksoft:#A8B8B0; --un-line:#26362E; --un-brand:#4FB894; --un-brand2:#6ecfae;
  --un-gold:#D8B983; --un-goldsoft:#2A2418; --un-shadow:0 24px 60px -30px rgba(0,0,0,.6); } }
.unete * { box-sizing:border-box; }
.unete .un-wrap { max-width:1080px; margin:0 auto; padding:0 24px; }
.unete h1,.unete h2,.unete h3 { font-family:var(--un-serif); font-weight:600; line-height:1.12; letter-spacing:-.01em; margin:0; }
.unete .un-eyebrow { font-size:.74rem; letter-spacing:.18em; text-transform:uppercase; font-weight:700; color:var(--un-brand); display:inline-flex; align-items:center; gap:.5em; }
.unete .un-eyebrow::before { content:""; width:26px; height:2px; background:var(--un-gold); display:inline-block; }
.unete .un-eyebrow-gold { color:var(--un-gold); }
.unete .un-btn { display:inline-flex; align-items:center; gap:.5em; text-decoration:none; font-weight:650; font-size:1rem;
  padding:14px 26px; border-radius:999px; border:1.5px solid transparent; transition:transform .15s ease, background .15s ease; cursor:pointer; }
.unete .un-btn-primary { background:var(--un-brand); color:#fff; box-shadow:var(--un-shadow); }
.unete .un-btn-primary:hover { transform:translateY(-2px); background:var(--un-brand2); }
.unete .un-btn-ghost { border-color:var(--un-line); color:var(--un-ink); background:transparent; }
.unete .un-btn-ghost:hover { border-color:var(--un-brand); color:var(--un-brand); }
.unete .un-btn-white { background:#fff; color:var(--un-brand); margin-top:30px; }
.unete .un-btn-white:hover { transform:translateY(-2px); background:var(--un-goldsoft); }

.unete .un-hero { position:relative; overflow:hidden; border-bottom:1px solid var(--un-line); }
.unete .un-hero-bg { position:absolute; inset:0; z-index:0;
  background:radial-gradient(120% 90% at 88% -10%, color-mix(in srgb,var(--un-brand) 22%,transparent), transparent 60%),
  radial-gradient(90% 70% at -10% 110%, color-mix(in srgb,var(--un-gold) 18%,transparent), transparent 55%); }
.unete .un-hero-in { position:relative; z-index:1; padding:72px 24px 64px; }
.unete .un-hero h1 { font-size:clamp(2.4rem,6vw,4.2rem); margin:16px 0 0; max-width:15ch; text-wrap:balance; }
.unete .un-lead { font-size:clamp(1.05rem,2.2vw,1.28rem); color:var(--un-inksoft); max-width:46ch; margin:22px 0 0; }
.unete .un-cta { display:flex; flex-wrap:wrap; gap:14px; margin-top:34px; }

.unete .un-sec { padding:68px 0; border-bottom:1px solid var(--un-line); }
.unete .un-sechead { max-width:52ch; margin-bottom:38px; }
.unete .un-sechead h2 { font-size:clamp(1.7rem,3.6vw,2.5rem); margin:14px 0 0; text-wrap:balance; }
.unete .un-sechead p { color:var(--un-inksoft); margin:14px 0 0; font-size:1.05rem; }

.unete .un-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.unete .un-chip { background:var(--un-surface); border:1px solid var(--un-line); border-radius:16px; padding:18px; display:flex; flex-direction:column; gap:6px; }
.unete .un-chip .un-num { font-family:var(--un-serif); font-size:1.1rem; color:var(--un-gold); font-weight:600; }
.unete .un-chip strong { font-size:1rem; }
.unete .un-chip span { font-size:.86rem; color:var(--un-inksoft); }

.unete .un-steps { display:flex; flex-direction:column; gap:20px; }
.unete .un-step { display:grid; grid-template-columns:92px 1fr; gap:26px; align-items:start; background:var(--un-surface);
  border:1px solid var(--un-line); border-radius:20px; padding:30px 32px; }
.unete .un-marker { font-family:var(--un-serif); font-size:2.6rem; color:var(--un-brand); line-height:1; border-right:1px solid var(--un-line); padding-right:20px; }
.unete .un-marker small { display:block; font-family:var(--un-sans); font-size:.62rem; letter-spacing:.16em; text-transform:uppercase; color:var(--un-gold); font-weight:700; margin-bottom:8px; }
.unete .un-body h3 { font-size:1.4rem; margin:0 0 10px; }
.unete .un-body > p { margin:0 0 16px; color:var(--un-inksoft); max-width:62ch; }
.unete .un-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px 26px; }
.unete .un-field { display:flex; flex-direction:column; gap:2px; }
.unete .un-field b { font-size:.95rem; }
.unete .un-field span { font-size:.88rem; color:var(--un-inksoft); }
.unete .un-note { margin-top:14px; background:var(--un-surface2); border-left:3px solid var(--un-gold); padding:12px 16px; border-radius:8px; font-size:.9rem; color:var(--un-inksoft); }
.unete .un-pills { display:flex; flex-wrap:wrap; gap:8px; }
.unete .un-pill { font-size:.82rem; font-weight:600; padding:5px 12px; border-radius:999px; border:1px solid var(--un-line); }
.unete .un-pill.ok { color:var(--un-brand); border-color:color-mix(in srgb,var(--un-brand) 40%,var(--un-line)); }
.unete .un-pill.warn { color:var(--un-gold); border-color:color-mix(in srgb,var(--un-gold) 45%,var(--un-line)); }

.unete .un-planshead { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:34px; }
.unete .un-toggle { display:inline-flex; background:var(--un-surface2); border-radius:999px; padding:4px; border:1px solid var(--un-line); }
.unete .un-toggle button { border:0; background:transparent; font:inherit; font-weight:650; font-size:.92rem; color:var(--un-inksoft); padding:9px 20px; border-radius:999px; cursor:pointer; transition:all .18s ease; }
.unete .un-toggle button.active { background:var(--un-brand); color:#fff; }
.unete .un-plans { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; align-items:stretch; }
.unete .un-plan { position:relative; background:var(--un-surface); border:1px solid var(--un-line); border-radius:20px; padding:30px 26px; display:flex; flex-direction:column; }
.unete .un-plan.feat { border-color:var(--un-gold); box-shadow:var(--un-shadow); }
.unete .un-plantag { position:absolute; top:-12px; left:26px; font-size:.68rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; padding:5px 12px; border-radius:999px; background:var(--un-gold); color:#1c1400; }
.unete .un-plan.ia .un-plantag { background:var(--un-brand); color:#fff; }
.unete .un-plan h3 { font-size:1.5rem; }
.unete .un-plansub { color:var(--un-inksoft); font-size:.9rem; margin:4px 0 18px; }
.unete .un-price { display:flex; align-items:baseline; gap:6px; }
.unete .un-amount { font-family:var(--un-serif); font-size:2.3rem; font-weight:600; font-variant-numeric:tabular-nums; }
.unete .un-per { color:var(--un-inksoft); font-size:.9rem; }
.unete .un-ivaline { font-size:.8rem; color:var(--un-inksoft); margin-top:4px; }
.unete .un-trial { margin:12px 0 0; font-size:.8rem; font-weight:700; color:var(--un-brand); min-height:1em; }
.unete .un-plan ul { list-style:none; padding:0; margin:20px 0 0; display:flex; flex-direction:column; gap:9px; flex:1; }
.unete .un-plan li { position:relative; padding-left:26px; font-size:.92rem; color:var(--un-inksoft); }
.unete .un-plan li::before { content:"✓"; position:absolute; left:0; top:0; color:var(--un-brand); font-weight:800; }
.unete .un-empresa { margin-top:26px; text-align:center; font-size:.9rem; color:var(--un-inksoft); }

.unete .un-out { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
.unete .un-outcard { background:var(--un-surface); border:1px solid var(--un-line); border-radius:18px; padding:26px; }
.unete .un-outcard h3 { font-size:1.15rem; margin:0 0 8px; color:var(--un-brand); }
.unete .un-outcard p { margin:0; color:var(--un-inksoft); font-size:.95rem; }

.unete .un-final { border-bottom:0; }
.unete .un-finalcard { background:linear-gradient(135deg,var(--un-brand),color-mix(in srgb,var(--un-brand) 70%,#05201a));
  color:#fff; border-radius:28px; padding:56px 32px; box-shadow:var(--un-shadow); text-align:center; }
.unete .un-finalcard h2 { color:#fff; font-size:clamp(1.9rem,4vw,2.8rem); margin:14px 0 0; text-wrap:balance; }
.unete .un-finalcard > p { color:rgba(255,255,255,.86); max-width:48ch; margin:16px auto 0; }
.unete .un-finalsteps { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:42px; text-align:left; }
.unete .un-sf { background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.16); border-radius:14px; padding:18px; }
.unete .un-sfn { font-family:var(--un-serif); font-size:1.3rem; color:var(--un-gold); }
.unete .un-sf b { display:block; margin:6px 0 4px; font-size:.95rem; }
.unete .un-sf span { font-size:.82rem; color:rgba(255,255,255,.78); }

@media (max-width:860px) { .unete .un-strip,.unete .un-plans,.unete .un-out,.unete .un-finalsteps { grid-template-columns:1fr 1fr; }
  .unete .un-plan.feat { order:-1; } }
@media (max-width:560px) { .unete .un-strip,.unete .un-plans,.unete .un-out,.unete .un-finalsteps,.unete .un-grid2 { grid-template-columns:1fr; }
  .unete .un-step { grid-template-columns:1fr; }
  .unete .un-marker { border-right:0; border-bottom:1px solid var(--un-line); padding:0 0 12px; display:flex; align-items:baseline; gap:12px; } }
@media (prefers-reduced-motion:reduce) { .unete .un-btn:hover { transform:none; } }
`;
