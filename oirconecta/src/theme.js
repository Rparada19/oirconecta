/**
 * OirConecta — Design System 2025
 * Bold & Contemporary · Glassmorphism · Colored shadows
 */
export function buildTheme(createThemeFn) {
  return createThemeFn({
    palette: {
      primary: {
        main: '#085946',
        light: '#0d7a5c',
        dark: '#064a3a',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#272F50',
        light: '#3a4575',
        dark: '#1a1f38',
        contrastText: '#ffffff',
      },
      background: {
        default: '#f0f4f2',
        paper: '#ffffff',
      },
      text: {
        primary: '#0f1923',
        secondary: '#4a5568',
      },
      success: { main: '#059669' },
      warning: { main: '#d97706' },
      error:   { main: '#dc2626' },
      info:    { main: '#0284c7' },
      grey: {
        50:  '#f0f4f2',
        100: '#e2eae6',
        200: '#c4d4cc',
        300: '#8fb5a8',
        400: '#6a9288',
        500: '#085946',
        600: '#064a3a',
        700: '#272F50',
        800: '#1a1f38',
        900: '#0f1923',
      },
    },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '3.75rem',
        fontWeight: 800,
        lineHeight: 1.1,
        letterSpacing: '-0.03em',
        '@media (max-width:600px)': { fontSize: '2.5rem' },
      },
      h2: {
        fontSize: '3rem',
        fontWeight: 800,
        lineHeight: 1.15,
        letterSpacing: '-0.025em',
        '@media (max-width:600px)': { fontSize: '2.125rem' },
      },
      h3: {
        fontSize: '2.25rem',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        '@media (max-width:600px)': { fontSize: '1.875rem' },
      },
      h4: {
        fontSize: '1.875rem',
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.015em',
        '@media (max-width:600px)': { fontSize: '1.5rem' },
      },
      h5: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.35,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
        letterSpacing: '-0.005em',
      },
      subtitle1: {
        fontSize: '1.0625rem',
        lineHeight: 1.6,
        fontWeight: 500,
        letterSpacing: '-0.005em',
      },
      subtitle2: {
        fontSize: '0.9375rem',
        lineHeight: 1.55,
        fontWeight: 600,
        letterSpacing: '0.01em',
        textTransform: 'uppercase',
      },
      body1: {
        fontSize: '1.0625rem',
        lineHeight: 1.7,
        fontWeight: 400,
      },
      body2: {
        fontSize: '0.9375rem',
        lineHeight: 1.65,
        fontWeight: 400,
      },
      button: {
        fontWeight: 700,
        textTransform: 'none',
        letterSpacing: '0.01em',
        fontSize: '0.9375rem',
      },
      caption: {
        fontSize: '0.8125rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
      },
    },

    shape: { borderRadius: 16 },

    shadows: [
      'none',
      '0 1px 3px rgba(8,89,70,0.06), 0 1px 2px rgba(8,89,70,0.04)',
      '0 2px 8px rgba(8,89,70,0.08), 0 1px 4px rgba(8,89,70,0.04)',
      '0 4px 16px rgba(8,89,70,0.10), 0 2px 6px rgba(8,89,70,0.06)',
      '0 6px 20px rgba(8,89,70,0.12), 0 3px 8px rgba(8,89,70,0.06)',
      '0 8px 28px rgba(8,89,70,0.14), 0 4px 10px rgba(8,89,70,0.07)',
      '0 10px 36px rgba(8,89,70,0.15), 0 5px 12px rgba(8,89,70,0.07)',
      '0 12px 40px rgba(8,89,70,0.16), 0 6px 14px rgba(8,89,70,0.08)',
      '0 14px 48px rgba(8,89,70,0.18), 0 7px 16px rgba(8,89,70,0.09)',
      '0 16px 56px rgba(8,89,70,0.20), 0 8px 18px rgba(8,89,70,0.10)',
      '0 20px 60px rgba(8,89,70,0.22), 0 10px 22px rgba(8,89,70,0.11)',
      '0 24px 64px rgba(8,89,70,0.24), 0 12px 24px rgba(8,89,70,0.12)',
      '0 28px 70px rgba(8,89,70,0.26), 0 14px 28px rgba(8,89,70,0.13)',
      '0 32px 80px rgba(8,89,70,0.28), 0 16px 32px rgba(8,89,70,0.14)',
      '0 36px 88px rgba(8,89,70,0.30), 0 18px 36px rgba(8,89,70,0.15)',
      '0 40px 96px rgba(8,89,70,0.32), 0 20px 40px rgba(8,89,70,0.16)',
      '0 44px 104px rgba(8,89,70,0.34)',
      '0 48px 112px rgba(8,89,70,0.36)',
      '0 52px 120px rgba(8,89,70,0.38)',
      '0 56px 128px rgba(8,89,70,0.40)',
      '0 60px 136px rgba(8,89,70,0.42)',
      '0 64px 144px rgba(8,89,70,0.44)',
      '0 68px 152px rgba(8,89,70,0.46)',
      '0 72px 160px rgba(8,89,70,0.48)',
      '0 80px 180px rgba(8,89,70,0.50)',
    ],

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*, *::before, *::after': { boxSizing: 'border-box' },
          ':root': {
            '--oc-primary':      '#085946',
            '--oc-primary-dark': '#064a3a',
            '--oc-navy':         '#272F50',
            '--oc-radius-sm':    '6px',
            '--oc-radius':       '8px',
            '--oc-radius-lg':    '12px',
            '--oc-radius-xl':    '16px',
            '--oc-glass-bg':     'rgba(255,255,255,0.72)',
            '--oc-glass-border': 'rgba(255,255,255,0.60)',
            '--oc-shadow-color': 'rgba(8,89,70,0.15)',
          },
          'html': { scrollBehavior: 'smooth' },
          'body': {
            background: 'linear-gradient(160deg, #e8f0ec 0%, #f0f4f2 40%, #edf2f7 100%)',
            minHeight: '100vh',
          },
          '::-webkit-scrollbar': { width: 8, height: 8 },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': {
            background: 'rgba(8,89,70,0.25)',
            borderRadius: 8,
            '&:hover': { background: 'rgba(8,89,70,0.40)' },
          },
          '::selection': {
            background: 'rgba(8,89,70,0.20)',
            color: '#064a3a',
          },
        },
      },

      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 6,
            padding: '10px 22px',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.9375rem',
            letterSpacing: '0.01em',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
          },
          contained: {
            background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 60%, #064a3a 100%)',
            boxShadow: '0 4px 16px rgba(8,89,70,0.30), 0 1px 4px rgba(8,89,70,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0f9068 0%, #0d7a5c 60%, #085946 100%)',
              boxShadow: '0 8px 28px rgba(8,89,70,0.40), 0 2px 8px rgba(8,89,70,0.20)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(8,89,70,0.25)' },
          },
          outlined: {
            borderWidth: '1.5px',
            borderColor: 'rgba(8,89,70,0.35)',
            color: '#085946',
            backgroundColor: 'rgba(8,89,70,0.03)',
            '&:hover': {
              borderWidth: '1.5px',
              borderColor: '#085946',
              backgroundColor: 'rgba(8,89,70,0.08)',
              transform: 'translateY(-1px)',
            },
          },
          text: {
            color: '#085946',
            '&:hover': { backgroundColor: 'rgba(8,89,70,0.07)' },
          },
          sizeLarge: { padding: '13px 28px', fontSize: '1rem', borderRadius: 14 },
          sizeSmall: { padding: '7px 16px', fontSize: '0.875rem', borderRadius: 10 },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(20px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 2px 12px rgba(8,89,70,0.07), 0 1px 4px rgba(8,89,70,0.04)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              boxShadow: '0 8px 32px rgba(8,89,70,0.14), 0 2px 8px rgba(8,89,70,0.07)',
              transform: 'translateY(-2px)',
              border: '1px solid rgba(255,255,255,0.90)',
            },
          },
        },
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 8,
          },
          elevation1: {
            boxShadow: '0 2px 12px rgba(8,89,70,0.07), 0 1px 4px rgba(8,89,70,0.04)',
            border: '1px solid rgba(8,89,70,0.07)',
          },
          elevation2: {
            boxShadow: '0 4px 20px rgba(8,89,70,0.10), 0 2px 6px rgba(8,89,70,0.05)',
            border: '1px solid rgba(8,89,70,0.07)',
          },
          elevation3: {
            boxShadow: '0 8px 32px rgba(8,89,70,0.14), 0 3px 10px rgba(8,89,70,0.07)',
            border: '1px solid rgba(8,89,70,0.06)',
          },
        },
      },

      MuiTextField: {
        defaultProps: { variant: 'outlined' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 6,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s ease',
              '& fieldset': { borderColor: 'rgba(8,89,70,0.20)', borderWidth: '1.5px' },
              '&:hover fieldset': { borderColor: 'rgba(8,89,70,0.45)' },
              '&.Mui-focused fieldset': {
                borderColor: '#085946',
                boxShadow: '0 0 0 3px rgba(8,89,70,0.12)',
              },
            },
            '& .MuiInputLabel-root.Mui-focused': { color: '#085946' },
          },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 600 },
          colorPrimary: {
            background: 'rgba(8,89,70,0.12)',
            color: '#085946',
            border: '1px solid rgba(8,89,70,0.20)',
          },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            borderBottom: '1px solid rgba(8,89,70,0.08)',
            boxShadow: '0 1px 20px rgba(8,89,70,0.07)',
            color: '#0f1923',
          },
        },
      },

      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              background: 'rgba(8,89,70,0.05)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: '#085946',
              borderBottom: '2px solid rgba(8,89,70,0.15)',
            },
          },
        },
      },

      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background 0.15s ease',
            '&:hover': { background: 'rgba(8,89,70,0.03)' },
          },
        },
      },

      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: '1px solid rgba(8,89,70,0.07)',
            fontSize: '0.9375rem',
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 6,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(32px) saturate(2)',
            WebkitBackdropFilter: 'blur(32px) saturate(2)',
            border: '1px solid rgba(255,255,255,0.80)',
            boxShadow: '0 32px 80px rgba(8,89,70,0.22), 0 8px 24px rgba(8,89,70,0.12)',
          },
        },
      },

      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 8,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px) saturate(2)',
            WebkitBackdropFilter: 'blur(24px) saturate(2)',
            border: '1px solid rgba(255,255,255,0.80)',
            boxShadow: '0 12px 40px rgba(8,89,70,0.16), 0 3px 10px rgba(8,89,70,0.08)',
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRight: '1px solid rgba(8,89,70,0.08)',
          },
        },
      },

      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            background: '#0f1923',
            borderRadius: 8,
            fontSize: '0.8125rem',
            fontWeight: 500,
            padding: '6px 12px',
          },
          arrow: { color: '#0f1923' },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 8, height: 6 },
          bar: { borderRadius: 8, background: 'linear-gradient(90deg, #0d7a5c, #085946)' },
        },
      },

      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '0.9375rem',
            '&.Mui-selected': { color: '#085946' },
          },
        },
      },

      MuiTabs: {
        styleOverrides: {
          indicator: {
            background: 'linear-gradient(90deg, #0d7a5c, #085946)',
            height: 3,
            borderRadius: 3,
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': { color: '#085946' },
            '&.Mui-checked + .MuiSwitch-track': { backgroundColor: '#085946' },
          },
        },
      },

      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500 },
          standardSuccess: { background: 'rgba(5,150,105,0.10)', color: '#065f46', border: '1px solid rgba(5,150,105,0.20)' },
          standardError:   { background: 'rgba(220,38,38,0.10)', color: '#991b1b', border: '1px solid rgba(220,38,38,0.20)' },
          standardWarning: { background: 'rgba(217,119,6,0.10)',  color: '#92400e', border: '1px solid rgba(217,119,6,0.20)' },
          standardInfo:    { background: 'rgba(2,132,199,0.10)',  color: '#075985', border: '1px solid rgba(2,132,199,0.20)' },
        },
      },

      MuiFab: {
        styleOverrides: {
          root: {
            background: 'linear-gradient(135deg, #0d7a5c 0%, #085946 100%)',
            color: '#fff',
            boxShadow: '0 8px 24px rgba(8,89,70,0.40)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0f9068 0%, #0d7a5c 100%)',
              boxShadow: '0 12px 32px rgba(8,89,70,0.50)',
            },
          },
        },
      },
    },
  });
}
