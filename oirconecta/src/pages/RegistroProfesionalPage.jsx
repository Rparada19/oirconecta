import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '../services/apiClient';
import { setDirectoryToken } from '../services/directoryAccountApi';
import { DIRECTORY_API } from '../config/directoryApi';

export default function RegistroProfesionalPage() {
  const [personaTipo, setPersonaTipo] = useState('NATURAL');
  const [documentoIdentidad, setDocumentoIdentidad] = useState('');
  const [nombreConsultorio, setNombreConsultorio] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg(null);
    if (!documentoIdentidad.trim()) {
      setErr(personaTipo === 'JURIDICA' ? 'Indica el NIT del centro.' : 'Indica el número de cédula.');
      return;
    }
    setLoading(true);
    const { data, error } = await api.post(
      DIRECTORY_API.register,
      {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
        personaTipo,
        documentoIdentidad: documentoIdentidad.trim(),
        nombreConsultorio: nombreConsultorio.trim() || undefined,
      },
      { skipAuth: true }
    );
    setLoading(false);
    if (error) {
      setErr(error);
      return;
    }
    const token = data?.data?.token;
    if (token) setDirectoryToken(token);
    setMsg(
      data?.data?.message ||
        'Registro exitoso. Ya puedes completar tu ficha; si cerraste sesión, entra desde el acceso del directorio.'
    );
    setPassword('');
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ flex: 1, pt: { xs: 12, md: 14 }, pb: 6, bgcolor: 'grey.50' }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, color: '#085946' }}>
              Registro profesional
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crea una cuenta exclusiva para tu ficha en el directorio público. El tipo de persona y el documento no se muestran en la
              tarjeta pública; sirven para validación interna. Cuando envíes los datos, un administrador revisará y aprobará tu perfil
              antes de que sea visible para los pacientes.
            </Typography>
            {msg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {msg}
                <Box sx={{ mt: 1.5 }}>
                  <Button component={RouterLink} to="/mi-directorio" variant="outlined" size="small" color="inherit">
                    Ir a mi ficha pública
                  </Button>
                </Box>
              </Alert>
            )}
            {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
            <Box id="registro-profesional-form" component="form" onSubmit={submit} sx={{ scrollMarginTop: 96 }}>
              <FormControl component="fieldset" margin="normal" fullWidth>
                <FormLabel component="legend" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                  Tipo de titular (marca con una opción)
                </FormLabel>
                <RadioGroup
                  row
                  value={personaTipo}
                  onChange={(e) => setPersonaTipo(e.target.value)}
                  sx={{ gap: 1 }}
                >
                  <FormControlLabel value="NATURAL" control={<Radio color="primary" />} label="Persona natural" />
                  <FormControlLabel value="JURIDICA" control={<Radio color="primary" />} label="Persona jurídica (clínica / centro)" />
                </RadioGroup>
              </FormControl>
              <TextField
                label={personaTipo === 'JURIDICA' ? 'NIT del centro' : 'Número de cédula'}
                fullWidth
                required
                margin="normal"
                value={documentoIdentidad}
                onChange={(e) => setDocumentoIdentidad(e.target.value)}
                helperText="No aparece en la ficha pública del directorio."
              />
              <TextField
                label={personaTipo === 'JURIDICA' ? 'Nombre de la clínica o centro auditivo' : 'Nombre del consultorio o marca (opcional)'}
                fullWidth
                margin="normal"
                value={nombreConsultorio}
                onChange={(e) => setNombreConsultorio(e.target.value)}
                helperText={
                  personaTipo === 'JURIDICA'
                    ? 'Es el nombre que verán los pacientes en el listado. Luego podrás dar de alta a los profesionales que trabajan contigo.'
                    : 'Opcional: cómo quieres que te reconozcan además de tu nombre.'
                }
              />
              <TextField
                label={personaTipo === 'JURIDICA' ? 'Nombre del representante o contacto principal' : 'Nombre completo'}
                fullWidth
                required
                margin="normal"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              <TextField
                label="Correo"
                type="email"
                fullWidth
                required
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                label="Contraseña (mín. 8 caracteres)"
                type="password"
                fullWidth
                required
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" fullWidth sx={{ py: 1.5, bgcolor: '#085946', fontWeight: 800, textTransform: 'none' }} disabled={loading}>
                  {loading ? 'Enviando…' : 'Registrarme'}
                </Button>
                <Button
                  component={RouterLink}
                  to="/login-directorio"
                  variant="outlined"
                  fullWidth
                  sx={{ py: 1.5, fontWeight: 700, textTransform: 'none', borderWidth: 2, borderColor: '#085946', color: '#085946' }}
                >
                  Iniciar sesión
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
