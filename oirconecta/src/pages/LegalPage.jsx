import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { Box, Container, Typography, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Stack, Alert } from '@mui/material';
import { getConsent, setConsent, clearConsent, onConsentChange } from '../utils/cookieConsent';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Section = ({ id, title, children }) => (
  <Box id={id} component="section" sx={{ mb: 5, scrollMarginTop: 96 }}>
    <Typography variant="h4" component="h2" gutterBottom sx={{ color: '#085946', fontWeight: 700 }}>
      {title}
    </Typography>
    <Typography variant="body1" color="text.secondary" component="div" sx={{ lineHeight: 1.75 }}>
      {children}
    </Typography>
  </Box>
);

const ConsentPanel = () => {
  const [consent, setLocal] = React.useState(getConsent());
  useEffect(() => onConsentChange((v) => setLocal(v)), []);
  const label = consent === 'accepted'
    ? 'Actualmente aceptas todas las cookies (analítica + marketing).'
    : consent === 'rejected'
      ? 'Actualmente solo se cargan las cookies esenciales.'
      : 'Aún no has definido tu preferencia; verás el banner al recargar.';
  return (
    <Alert severity="info" sx={{ my: 3, borderRadius: '10px' }}>
      <Typography sx={{ fontSize: '0.9375rem', mb: 1.25 }}>
        <strong>Tu preferencia actual:</strong> {label}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button size="small" variant="contained" onClick={() => setConsent('accepted')}
          sx={{ bgcolor: '#085946', '&:hover': { bgcolor: '#0d7a5f' }, textTransform: 'none', borderRadius: '8px' }}>
          Aceptar todas
        </Button>
        <Button size="small" variant="outlined" onClick={() => setConsent('rejected')}
          sx={{ borderColor: '#272F50', color: '#272F50', textTransform: 'none', borderRadius: '8px' }}>
          Sólo esenciales
        </Button>
        <Button size="small" onClick={() => clearConsent()}
          sx={{ color: '#6b7280', textTransform: 'none' }}>
          Volver a preguntarme
        </Button>
      </Stack>
    </Alert>
  );
};

const LegalPage = () => {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, [location.hash]);

  return (
  <>
    <Helmet>
      <title>Información legal - OírConecta</title>
      <meta name="robots" content="noindex" />
    </Helmet>
    <Header />
    <Box sx={{ pt: 12, pb: 6, bgcolor: 'grey.50', minHeight: '70vh' }}>
      <Container maxWidth="md">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#272F50' }}>
          Información legal
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          OírConecta es una plataforma que promueve servicios de terceros (profesionales y centros suscritos).
          Estos documentos regulan el uso del sitio, la agenda de citas, el directorio de profesionales adscritos y el
          tratamiento de datos personales bajo la Ley 1581 de 2012 y el Decreto 1377 de 2013. Contacto:{' '}
          <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>.
        </Typography>
        <Divider sx={{ my: 4 }} />

        <Section id="terminos" title="Términos y condiciones de uso">
          <p>
            <strong>Última actualización:</strong> 20 de julio de 2026.
          </p>

          <p style={{ marginTop: 24 }}><strong>1. Identificación del responsable</strong></p>
          <p>
            El sitio <strong>oirconecta.com</strong> es operado por <strong>OírConecta S.A.S.</strong>, sociedad
            colombiana identificada con NIT <strong>901.416.762-9</strong>, con domicilio en Bogotá D.C., Colombia. Datos
            de contacto: <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> · +57 317 150 3944.
          </p>

          <p style={{ marginTop: 24 }}><strong>2. Aceptación</strong></p>
          <p>
            El acceso al Sitio y el uso de cualquiera de sus formularios, agendamientos, portales o servicios implica la
            aceptación plena de estos Términos y de la <a href="#privacidad">Política de privacidad</a>. Si no estás de
            acuerdo, debes abstenerte de usar el Sitio.
          </p>

          <p style={{ marginTop: 24 }}><strong>3. Naturaleza del servicio</strong></p>
          <p>
            OírConecta ofrece: (i) un <em>directorio</em> de profesionales y centros auditivos adscritos; (ii) una
            <em> agenda</em> que permite reservar citas con esos terceros o con OírConecta; (iii) contenido educativo
            sobre salud auditiva; y (iv) una <em>tienda</em> de accesorios auditivos (baterías, moldes, limpieza y
            similares). <strong>OírConecta no comercializa audífonos</strong> ni prestaciones de salud reguladas fuera de
            su propia red de audiología.
          </p>
          <p>
            El contenido del Sitio es informativo y <strong>no reemplaza la consulta profesional</strong>. La relación
            asistencial se perfecciona entre el paciente y el profesional o centro elegido; OírConecta actúa como
            intermediario tecnológico salvo cuando la cita se agenda directamente con OírConecta como prestador.
          </p>

          <p style={{ marginTop: 24 }}><strong>4. Registro y cuentas</strong></p>
          <p>
            El uso del portal profesional, del portal admin y del CRM requiere una cuenta. El usuario es responsable de
            mantener la confidencialidad de sus credenciales y de toda actividad realizada bajo ellas. OírConecta puede
            suspender o cancelar cuentas por incumplimiento de estos Términos, uso fraudulento, morosidad o mandato de
            autoridad.
          </p>

          <p style={{ marginTop: 24 }}><strong>5. Contenido de terceros (profesionales adscritos)</strong></p>
          <p>
            Los profesionales y centros adscritos son <strong>responsables exclusivos</strong> de la veracidad de su
            información (títulos, tarifas, horarios, ubicaciones, especialidades) y de los servicios que prestan.
            OírConecta verifica documentación básica pero no garantiza la exactitud permanente ni la idoneidad clínica de
            cada prestador. Cualquier reclamo por la atención debe dirigirse al profesional o centro correspondiente, sin
            perjuicio del derecho del consumidor a acudir a OírConecta cuando la reserva se hizo por el Sitio.
          </p>

          <p style={{ marginTop: 24 }}><strong>6. Reservas, cancelaciones y no presentación</strong></p>
          <p>
            Las citas agendadas quedan sujetas a las condiciones que informa cada profesional o centro (política de
            cancelación, ventanas de reagendamiento, cobros por inasistencia). El paciente puede cancelar o reagendar
            desde el enlace enviado por correo o WhatsApp con al menos 24 horas de anticipación cuando el prestador no
            haya fijado una regla distinta.
          </p>

          <p style={{ marginTop: 24 }}><strong>7. Pagos</strong></p>
          <p>
            Los pagos en línea (cuando estén disponibles) se procesan a través de pasarelas externas autorizadas por la
            Superintendencia Financiera de Colombia. OírConecta no almacena datos completos de tarjetas. Los precios se
            muestran en pesos colombianos (COP) e incluyen los impuestos aplicables salvo indicación contraria.
          </p>

          <p style={{ marginTop: 24 }}><strong>8. Uso permitido y prohibido</strong></p>
          <p>El usuario se compromete a no:</p>
          <ul>
            <li>Publicar información falsa, difamatoria, ilícita o que vulnere derechos de terceros.</li>
            <li>Suplantar la identidad de otra persona, profesional o entidad.</li>
            <li>Usar el Sitio para enviar spam, malware, scraping masivo o técnicas de ingeniería social.</li>
            <li>Vulnerar medidas técnicas de seguridad o acceder a áreas restringidas.</li>
            <li>Reproducir, revender o explotar comercialmente el contenido sin autorización expresa.</li>
          </ul>

          <p style={{ marginTop: 24 }}><strong>9. Propiedad intelectual</strong></p>
          <p>
            Las marcas, logos, textos, imágenes, código fuente y bases de datos del Sitio son propiedad de OírConecta o
            de sus licenciantes y están protegidos por la normativa colombiana e internacional sobre propiedad
            intelectual. Se permite el uso personal y no comercial con atribución. Cualquier otro uso requiere
            autorización escrita.
          </p>

          <p style={{ marginTop: 24 }}><strong>10. Limitación de responsabilidad</strong></p>
          <p>
            OírConecta hace esfuerzos razonables para mantener el Sitio operativo y seguro, pero no garantiza
            disponibilidad ininterrumpida ni ausencia de errores. En la medida permitida por la ley, no responde por: (i)
            actos u omisiones de profesionales adscritos; (ii) daños indirectos, lucro cesante o pérdida de datos
            derivados de fuerza mayor, caso fortuito o hecho de un tercero; (iii) contenido publicado por usuarios en
            reseñas o formularios.
          </p>

          <p style={{ marginTop: 24 }}><strong>11. Derechos del consumidor</strong></p>
          <p>
            Los usuarios que actúen como consumidores gozan de los derechos reconocidos por la Ley 1480 de 2011
            (Estatuto del Consumidor), incluida la reversión del pago y el derecho de retracto cuando aplique. Las PQRs
            pueden radicarse en <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> con respuesta
            dentro de los 15 días hábiles siguientes.
          </p>

          <p style={{ marginTop: 24 }}><strong>12. Modificaciones</strong></p>
          <p>
            OírConecta puede modificar el Sitio y estos Términos en cualquier momento. Los cambios entran en vigor al
            publicarse en esta página. Se recomienda revisar periódicamente. El uso posterior implica aceptación de la
            nueva versión.
          </p>

          <p style={{ marginTop: 24 }}><strong>13. Ley aplicable y jurisdicción</strong></p>
          <p>
            Estos Términos se rigen por las leyes de la República de Colombia. Las controversias se someterán a los
            jueces del domicilio del consumidor cuando aplique la Ley 1480 de 2011; en los demás casos, a los jueces
            competentes de Bogotá D.C.
          </p>
        </Section>

        <Section id="privacidad" title="Política de tratamiento de datos personales">
          <p>
            <strong>Última actualización:</strong> 20 de julio de 2026.
          </p>
          <p>
            En cumplimiento de la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas concordantes, OírConecta
            informa a los titulares el tratamiento que da a sus datos personales.
          </p>

          <p style={{ marginTop: 24 }}><strong>1. Responsable del tratamiento</strong></p>
          <p>
            <strong>OírConecta S.A.S.</strong> — NIT 901.416.762-9. Domicilio: Bogotá D.C., Colombia. Contacto para el
            ejercicio de derechos: <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> · +57 317
            150 3944.
          </p>

          <p style={{ marginTop: 24 }}><strong>2. Datos que recolectamos</strong></p>
          <ul>
            <li><strong>Identificación y contacto:</strong> nombre, correo, teléfono, ciudad, documento cuando aplique.</li>
            <li><strong>Datos de la cita:</strong> motivo de consulta, profesional/centro elegido, fecha, hora, canal.</li>
            <li><strong>Datos sensibles de salud auditiva:</strong> antecedentes, resultados de audiometría, adaptación de
              audífonos y controles — solo cuando el titular los suministra voluntariamente en el CRM o los formularios
              de agendamiento.</li>
            <li><strong>Datos de navegación:</strong> IP truncada, tipo de dispositivo, páginas visitadas, eventos de
              conversión (ver <a href="#cookies">Política de cookies</a>).</li>
            <li><strong>Datos comerciales</strong> del profesional o centro adscrito: razón social, NIT, portafolio,
              tarifas, credenciales.</li>
          </ul>

          <p style={{ marginTop: 24 }}><strong>3. Finalidades</strong></p>
          <ul>
            <li>Gestionar el registro, la autenticación y el uso de los portales.</li>
            <li>Agendar, recordar, reagendar o cancelar citas, incluyendo el envío de confirmaciones por correo y
              WhatsApp.</li>
            <li>Prestar la atención clínica cuando la cita se agenda con OírConecta como prestador.</li>
            <li>Contactar al titular para responder solicitudes, PQRs y encuestas de satisfacción.</li>
            <li>Enviar comunicaciones informativas o comerciales sobre servicios propios, siempre que el titular haya
              consentido.</li>
            <li>Cumplir obligaciones legales, contables, tributarias y de reporte a autoridades.</li>
            <li>Analizar el uso del Sitio y mejorar los servicios (métricas agregadas).</li>
          </ul>

          <p style={{ marginTop: 24 }}><strong>4. Autorización y datos sensibles</strong></p>
          <p>
            Al enviar cualquier formulario, agendar una cita o registrarte en un portal, el titular autoriza expresamente
            el tratamiento de sus datos para las finalidades descritas. Tratándose de <strong>datos sensibles</strong>
            {' '}(estado de salud auditiva), se recuerda que <strong>responder es facultativo</strong>; sin ellos no es
            posible prestar el servicio clínico solicitado.
          </p>

          <p style={{ marginTop: 24 }}><strong>5. Menores de edad</strong></p>
          <p>
            El tratamiento de datos de niños, niñas y adolescentes se realiza siempre con autorización previa del padre,
            madre o representante legal, y en su exclusivo interés superior.
          </p>

          <p style={{ marginTop: 24 }}><strong>6. Encargados y transferencias</strong></p>
          <p>
            Para prestar el servicio, OírConecta se apoya en encargados que procesan datos por su cuenta bajo contrato:
          </p>
          <ul>
            <li><strong>Neon</strong> (base de datos, servidores en Frankfurt, UE).</li>
            <li><strong>Render</strong> (hosting del backend, servidores en EE. UU.).</li>
            <li><strong>DreamHost</strong> (hosting del sitio público).</li>
            <li><strong>Meta Platforms</strong> (Pixel y API de Conversiones, cuando el usuario acepta cookies).</li>
            <li><strong>Proveedores de correo transaccional y WhatsApp Business</strong> (notificaciones).</li>
            <li><strong>Pasarelas de pago autorizadas por la Superfinanciera</strong> (cuando aplique).</li>
          </ul>
          <p>
            Estas transferencias internacionales se realizan a países que garantizan un nivel adecuado de protección o
            mediante cláusulas contractuales que preservan las garantías de la Ley 1581 de 2012.
          </p>

          <p style={{ marginTop: 24 }}><strong>7. Derechos del titular</strong></p>
          <p>Todo titular puede en cualquier momento:</p>
          <ul>
            <li>Conocer, actualizar y rectificar sus datos.</li>
            <li>Solicitar prueba de la autorización otorgada.</li>
            <li>Ser informado sobre el uso dado a sus datos.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley.</li>
            <li>Revocar la autorización o solicitar la supresión de los datos cuando no exista un deber legal o
              contractual de conservarlos.</li>
            <li>Acceder gratuitamente a sus datos.</li>
          </ul>

          <p style={{ marginTop: 24 }}><strong>8. Procedimiento para ejercer derechos</strong></p>
          <p>
            Las consultas y reclamos deben radicarse a{' '}
            <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a> indicando: nombre completo,
            documento, medio de contacto y descripción clara de la solicitud. Plazos legales:
          </p>
          <ul>
            <li><strong>Consultas:</strong> respuesta en máximo 10 días hábiles.</li>
            <li><strong>Reclamos:</strong> respuesta en máximo 15 días hábiles, prorrogables por 8 días hábiles
              adicionales previa notificación.</li>
          </ul>
          <p>
            Si transcurridos dos meses desde la reclamación el titular no obtiene respuesta satisfactoria, puede acudir a
            la SIC — Delegatura para la Protección de Datos Personales (
            <a href="https://www.sic.gov.co" target="_blank" rel="noopener noreferrer">www.sic.gov.co</a>).
          </p>

          <p style={{ marginTop: 24 }}><strong>9. Seguridad</strong></p>
          <p>
            OírConecta aplica medidas técnicas y administrativas razonables para proteger los datos: cifrado en tránsito
            (HTTPS), autenticación de accesos, control de roles en el CRM y portal admin, hashing de contraseñas, copias
            de seguridad y registros de auditoría. Ningún sistema es infalible; ante un incidente de seguridad relevante,
            OírConecta notificará a los titulares afectados y a la SIC según los plazos legales.
          </p>

          <p style={{ marginTop: 24 }}><strong>10. Vigencia del tratamiento</strong></p>
          <p>
            Los datos se conservan mientras exista una relación con el titular y durante los plazos legales aplicables
            (por ejemplo, obligaciones contables de 10 años, historia clínica según la Resolución 1995 de 1999). Cumplida
            la finalidad y los términos legales, los datos se suprimen o anonimizan.
          </p>

          <p style={{ marginTop: 24 }}><strong>11. Modificaciones</strong></p>
          <p>
            Esta política puede modificarse. Cuando el cambio sea sustancial se informará por los canales habituales
            (correo o aviso en el Sitio) al menos 10 días antes de su entrada en vigor.
          </p>
        </Section>

        <Section id="cookies" title="Política de cookies">
          <ConsentPanel />
          <p>
            <strong>Última actualización:</strong> 20 de julio de 2026.
          </p>
          <p>
            Esta política explica qué son las cookies y tecnologías similares, cuáles utiliza el sitio{' '}
            <strong>oirconecta.com</strong> (en adelante, "el Sitio"), con qué finalidad y cómo puedes gestionarlas.
            Aplica a todos los visitantes del Sitio, incluidos los usuarios registrados en el portal del profesional,
            portal admin y CRM de OírConecta.
          </p>

          <p style={{ marginTop: 24 }}>
            <strong>1. ¿Qué son las cookies?</strong>
          </p>
          <p>
            Las cookies son pequeños archivos de texto que un sitio web guarda en tu dispositivo cuando lo visitas.
            Sirven para recordar información entre páginas (por ejemplo, tu sesión), medir cómo se usa el Sitio o
            mostrarte publicidad relevante. En esta política también incluimos tecnologías similares como el{' '}
            <em>localStorage</em> del navegador y píxeles de seguimiento, aunque técnicamente no sean cookies.
          </p>

          <p style={{ marginTop: 24 }}>
            <strong>2. Base legal</strong>
          </p>
          <p>
            En Colombia, el tratamiento de datos personales asociados a cookies se rige por la Ley 1581 de 2012 de
            Habeas Data y el Decreto 1377 de 2013. Las cookies estrictamente necesarias no requieren consentimiento
            previo. Las analíticas y de marketing se activan bajo tu consentimiento, que puedes retirar en cualquier
            momento configurando tu navegador o escribiéndonos a{' '}
            <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>.
          </p>

          <p style={{ marginTop: 24 }}>
            <strong>3. Cookies y tecnologías que utiliza el Sitio</strong>
          </p>

          <TableContainer component={Paper} variant="outlined" sx={{ my: 2 }}>
            <Table size="small" aria-label="Cookies utilizadas por oirconecta.com">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Proveedor</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Finalidad</strong></TableCell>
                  <TableCell><strong>Duración</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>oirconecta_crm_token</TableCell>
                  <TableCell>OírConecta (propia)</TableCell>
                  <TableCell>Técnica</TableCell>
                  <TableCell>Mantener la sesión iniciada en el CRM.</TableCell>
                  <TableCell>Persistente hasta cerrar sesión</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>oirconecta_admin_token</TableCell>
                  <TableCell>OírConecta (propia)</TableCell>
                  <TableCell>Técnica</TableCell>
                  <TableCell>Mantener la sesión iniciada en el portal admin.</TableCell>
                  <TableCell>Persistente hasta cerrar sesión</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>oirconecta_directory_token</TableCell>
                  <TableCell>OírConecta (propia)</TableCell>
                  <TableCell>Técnica</TableCell>
                  <TableCell>Mantener la sesión del portal del profesional.</TableCell>
                  <TableCell>Persistente hasta cerrar sesión</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>_fbp</TableCell>
                  <TableCell>Meta Platforms Ireland Ltd.</TableCell>
                  <TableCell>Marketing</TableCell>
                  <TableCell>Identificar al visitante para medir efectividad de anuncios en Facebook e Instagram.</TableCell>
                  <TableCell>90 días</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>_fbc</TableCell>
                  <TableCell>Meta Platforms Ireland Ltd.</TableCell>
                  <TableCell>Marketing</TableCell>
                  <TableCell>Guardar el identificador de clic de un anuncio de Meta para atribuir conversiones.</TableCell>
                  <TableCell>90 días</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Píxel de Meta (ID 1056565756928195)</TableCell>
                  <TableCell>Meta Platforms Ireland Ltd.</TableCell>
                  <TableCell>Marketing / analítica</TableCell>
                  <TableCell>
                    Registrar eventos (páginas vistas, agendamiento, envío de formularios) para optimizar campañas.
                    Los eventos se envían también server-side por la API de Conversiones.
                  </TableCell>
                  <TableCell>Ver política de Meta</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>NID, CONSENT, otros</TableCell>
                  <TableCell>Google LLC</TableCell>
                  <TableCell>Terceros (Google Maps)</TableCell>
                  <TableCell>
                    Cargar el mapa embebido en la página de agendamiento. Los establece Google al mostrar el mapa.
                  </TableCell>
                  <TableCell>Hasta 24 meses</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>oirconecta_analytics_session</TableCell>
                  <TableCell>OírConecta (propia)</TableCell>
                  <TableCell>Analítica</TableCell>
                  <TableCell>
                    Identificar una sesión de navegación para medir tráfico interno y desempeño de páginas.
                  </TableCell>
                  <TableCell>Sesión (hasta 30 min inactividad)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <p style={{ marginTop: 24 }}>
            <strong>4. Cookies de terceros</strong>
          </p>
          <p>
            Algunos servicios externos que integramos pueden instalar sus propias cookies. En estos casos, el
            tratamiento se rige por las políticas del respectivo tercero:
          </p>
          <ul>
            <li>
              Meta (Facebook / Instagram):{' '}
              <a href="https://www.facebook.com/policies/cookies/" target="_blank" rel="noopener noreferrer">
                facebook.com/policies/cookies
              </a>
            </li>
            <li>
              Google (Maps, reCAPTCHA cuando aplique):{' '}
              <a href="https://policies.google.com/technologies/cookies" target="_blank" rel="noopener noreferrer">
                policies.google.com/technologies/cookies
              </a>
            </li>
          </ul>

          <p style={{ marginTop: 24 }}>
            <strong>5. Cómo gestionar o desactivar cookies</strong>
          </p>
          <p>
            Puedes aceptar, bloquear o eliminar cookies desde la configuración de tu navegador. A continuación
            enlaces oficiales:
          </p>
          <ul>
            <li>
              <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
                Google Chrome
              </a>
            </li>
            <li>
              <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer">
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">
                Safari
              </a>
            </li>
            <li>
              <a href="https://support.microsoft.com/es-es/microsoft-edge/eliminar-las-cookies-en-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
                Microsoft Edge
              </a>
            </li>
          </ul>
          <p>
            Ten en cuenta que si desactivas las cookies técnicas, algunas funciones del Sitio (como iniciar sesión
            en el CRM o el portal del profesional) dejarán de funcionar.
          </p>
          <p>
            Para desactivar el seguimiento publicitario de Meta puedes visitar{' '}
            <a href="https://www.facebook.com/help/568137493302217" target="_blank" rel="noopener noreferrer">
              facebook.com/help/568137493302217
            </a>{' '}
            o los ajustes de anuncios de tu cuenta de Facebook / Instagram.
          </p>

          <p style={{ marginTop: 24 }}>
            <strong>6. Transferencias internacionales</strong>
          </p>
          <p>
            Los servicios de Meta y Google implican transferencia de datos a Estados Unidos y otros países. Estas
            transferencias se realizan bajo los mecanismos de garantía que dichas empresas declaran (cláusulas
            contractuales tipo, marcos de adecuación) y bajo la responsabilidad de cada proveedor.
          </p>

          <p style={{ marginTop: 24 }}>
            <strong>7. Cambios en esta política</strong>
          </p>
          <p>
            Podemos actualizar esta política para reflejar cambios en la normativa o en los servicios que
            integramos. La versión vigente será siempre la publicada en esta página, con la fecha de última
            actualización visible al inicio.
          </p>

          <p style={{ marginTop: 24 }}>
            <strong>8. Contacto y ejercicio de derechos</strong>
          </p>
          <p>
            Responsable del tratamiento: <strong>OírConecta</strong>, NIT 901.416.762-9. Carrera 10 #96-25,
            Consultorio 320, Edificio Centro Ejecutivo, Bogotá, Colombia. Correo:{' '}
            <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>. Teléfono / WhatsApp:{' '}
            <a href="tel:+573171503944">+57 317 150 3944</a>. Puedes ejercer los derechos de acceso, rectificación,
            actualización, supresión y revocación del consentimiento previstos en la Ley 1581 de 2012 escribiendo
            a ese correo.
          </p>
        </Section>
      </Container>
    </Box>
    <Footer />
  </>
  );
};

export default LegalPage;
