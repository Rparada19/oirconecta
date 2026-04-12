import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { Box, Container, Typography, Divider } from '@mui/material';
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
          OírConecta es una plataforma que promueve servicios de terceros (profesionales y centros suscritos). Estos textos
          son orientativos: revísalos con asesoría legal. Contacto:{' '}
          <a href="mailto:info@oirconecta.com">info@oirconecta.com</a>.
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
            info@oirconecta.com.
          </p>
        </Section>

        <Section id="cookies" title="Política de cookies">
          <p>
            Este sitio puede utilizar cookies técnicas necesarias para el funcionamiento (por ejemplo, sesión o
            preferencias). Puedes configurar tu navegador para limitarlas.
          </p>
        </Section>
      </Container>
    </Box>
    <Footer />
  </>
  );
};

export default LegalPage;
