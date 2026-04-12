/**
 * Opciones de tema MUI. createTheme se inyecta desde App.jsx (mismo módulo que ThemeProvider)
 * para evitar errores de interop Vite/ESM con importaciones profundas de createTheme.
 */
export function buildTheme(createThemeFn) {
  return createThemeFn({
    palette: {
      primary: {
        main: '#085946',
        light: '#71A095',
        dark: '#064a3a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#86899C',
        light: '#A1AFB5',
        dark: '#272F50',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f4f7f6',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e2438',
        secondary: '#5a6272',
      },
      grey: {
        50: '#f4f7f6',
        100: '#e8eeec',
        200: '#d0d8d5',
        300: '#71A095',
        400: '#86899C',
        500: '#085946',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '3.5rem',
        fontWeight: 700,
        lineHeight: 1.15,
        letterSpacing: '-0.02em',
        '@media (max-width:600px)': {
          fontSize: '2.375rem',
        },
      },
      h2: {
        fontSize: '2.75rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        '@media (max-width:600px)': {
          fontSize: '2rem',
        },
      },
      h3: {
        fontSize: '2.125rem',
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.015em',
        '@media (max-width:600px)': {
          fontSize: '1.75rem',
        },
      },
      h4: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
        '@media (max-width:600px)': {
          fontSize: '1.5rem',
        },
      },
      h5: {
        fontSize: '1.375rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
        lineHeight: 1.45,
      },
      subtitle1: {
        fontSize: '1.0625rem',
        lineHeight: 1.55,
        fontWeight: 500,
      },
      body1: {
        fontSize: '1.0625rem',
        lineHeight: 1.65,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.9375rem',
        lineHeight: 1.65,
        fontWeight: 400,
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
        letterSpacing: '0.01em',
        fontSize: '1rem',
      },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
          },
          contained: {
            '&:hover': {
              boxShadow: '0 4px 14px rgba(8, 89, 70, 0.18)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            boxShadow: '0 1px 0 rgba(39, 47, 80, 0.06), 0 8px 24px rgba(39, 47, 80, 0.06)',
            border: '1px solid rgba(39, 47, 80, 0.06)',
            '&:hover': {
              boxShadow: '0 1px 0 rgba(39, 47, 80, 0.08), 0 12px 28px rgba(39, 47, 80, 0.08)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
    },
  });
}
