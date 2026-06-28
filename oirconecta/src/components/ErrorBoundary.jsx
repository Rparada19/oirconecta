import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

const RELOAD_MARKER = 'oc_chunk_reload_attempted';

/** Heurística para detectar errores de chunk-loading tras un redeploy de Vite. */
function isChunkLoadError(error) {
  if (!error) return false;
  const msg = String(error.message || error || '');
  const name = String(error.name || '');
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk \d+ failed/i.test(msg) ||
    /Loading CSS chunk/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg)
  );
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);

    // Auto-recarga una vez si parece error de chunk obsoleto (cache de Safari).
    try {
      if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_MARKER)) {
        sessionStorage.setItem(RELOAD_MARKER, '1');
        window.location.reload();
      }
    } catch {}
  }

  handleReload = () => {
    try { sessionStorage.removeItem(RELOAD_MARKER); } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const chunkErr = isChunkLoadError(this.state.error);
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#f8fafc' }}>
          <Paper sx={{ p: 4, maxWidth: 500 }}>
            <Typography variant="h5" sx={{ color: '#c62828', mb: 2 }}>
              {chunkErr ? 'Versión nueva disponible' : 'Error en la aplicación'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
              {chunkErr
                ? 'Acabamos de publicar una versión nueva del sitio. Recarga para usarla.'
                : (this.state.error?.message || 'Error desconocido')}
            </Typography>
            <Button variant="contained" onClick={this.handleReload} sx={{ bgcolor: '#085946', '&:hover': { bgcolor: '#064a38' } }}>
              Recargar página
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
