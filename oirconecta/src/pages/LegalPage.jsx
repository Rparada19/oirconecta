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
          La <a href="#cookies">Política de cookies</a> está vigente. Los apartados de Términos y Privacidad son
          un borrador y están en revisión con asesoría legal. Contacto:{' '}
          <a href="mailto:conversemos@oirconecta.com">conversemos@oirconecta.com</a>.
        </Typography>
        <Divider sx={{ my: 4 }} />

        <Section id="terminos" title="Términos y condiciones de uso">
          <p>
            El uso del sitio web y los formularios de OírConecta implica la aceptación de estas condiciones. El contenido
            informativo no sustituye la valoración médica. Los horarios y disponibilidad de citas pueden variar.
          </p>
          <p>
            OírConecta puede modificar el sitio y estos términos; se recomienda revisarlos periódicamente.
          </p>
        </Section>

        <Section id="privacidad" title="Política de privacidad">
          <p>
            Tratamos los datos personales que nos proporciones (por ejemplo, al agendar o contactar) con fines de
            gestión de solicitudes, mejora del servicio y cumplimiento legal. No vendemos tus datos a terceros.
          </p>
          <p>
            Puedes ejercer derechos de acceso, rectificación o supresión según la normativa aplicable escribiendo a
            conversemos@oirconecta.com.
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
