// Importación con verificación
import * as MuiStyles from '@mui/material/styles';

// Extraer createTheme del módulo
const { createTheme } = MuiStyles;

// Verificar que createTheme sea una función
if (typeof createTheme !== 'function') {
  console.error('Error: createTheme no es una función. MuiStyles:', MuiStyles);
  throw new Error('createTheme is not a function. Verifica la instalación de @mui/material');
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#085946', // Deep Sea Green
      light: '#71A095', // Sea Nymph
      dark: '#272F50', // Rhino
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#86899C', // Manatee
      light: '#A1AFB5', // Hit Gray
      dark: '#272F50', // Rhino
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#272F50', // Rhino
      secondary: '#86899C', // Manatee
    },
    grey: {
      50: '#f8fafc',
      100: '#A1AFB5', // Hit Gray
      200: '#86899C', // Manatee
      300: '#71A095', // Sea Nymph
      400: '#272F50', // Rhino
      500: '#085946', // Deep Sea Green
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
      '@media (max-width:600px)': {
        fontSize: '2.5rem',
      },
    },
    h2: {
      fontSize: '3rem',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': {
        fontSize: '2.25rem',
      },
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
      '@media (max-width:600px)': {
        fontSize: '2rem',
      },
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.4,
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(8, 89, 70, 0.15)',
          },
        },
        contained: {
          '&:hover': {
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 20px rgba(39, 47, 80, 0.08)',
          '&:hover': {
            boxShadow: '0 8px 30px rgba(39, 47, 80, 0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
  },
});

export default theme; 