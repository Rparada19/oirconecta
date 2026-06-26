/**
 * Barra de búsqueda limpia con ícono y placeholder.
 */
import React from 'react';
import { Box, InputBase } from '@mui/material';
import { Search } from '@mui/icons-material';
import { OC_COLORS } from '../../../theme';

export default function SearchBar({ value, onChange, placeholder = 'Buscar…', autoFocus, sx }) {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1,
      bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2,
      px: 1.5, py: 0.5, minWidth: 240, flex: 1,
      transition: 'border-color 120ms ease',
      '&:focus-within': { borderColor: OC_COLORS.verdeBienestar },
      ...sx,
    }}>
      <Search sx={{ fontSize: 18, color: OC_COLORS.grisMedio }} />
      <InputBase
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        sx={{ flex: 1, fontSize: 13.5 }}
      />
    </Box>
  );
}
