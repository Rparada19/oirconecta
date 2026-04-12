import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

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
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3, bgcolor: '#f8fafc' }}>
          <Paper sx={{ p: 4, maxWidth: 500 }}>
            <Typography variant="h5" sx={{ color: '#c62828', mb: 2 }}>
              Error en la aplicación
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mb: 2, fontFamily: 'monospace' }}>
              {this.state.error?.message || 'Error desconocido'}
            </Typography>
            <Button variant="contained" onClick={() => window.location.reload()} sx={{ bgcolor: '#085946' }}>
              Recargar página
            </Button>
          </Paper>
        </Box>
      );
    }
    return this.props.children;
  }
}
