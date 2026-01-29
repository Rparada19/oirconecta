import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Chip,
  Button,
  Tooltip
} from '@mui/material';
import { 
  Hearing,
  Info,
  CheckCircle
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { hearingLossProfiles, getHearingLossEffects } from '../utils/hearingLossProfiles';

const ProfileCard = styled(Card)(({ theme, selected, profileColor }) => ({
  background: selected 
    ? `linear-gradient(135deg, ${profileColor}20 0%, ${profileColor}10 100%)`
    : 'linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%)',
  borderRadius: 16,
  border: selected ? `3px solid ${profileColor}` : '2px solid #e0e0e0',
  boxShadow: selected 
    ? `0 8px 32px ${profileColor}40`
    : '0 4px 16px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: selected 
      ? `0 12px 40px ${profileColor}50`
      : '0 8px 24px rgba(0, 0, 0, 0.15)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: profileColor,
    opacity: selected ? 1 : 0,
    transition: 'opacity 0.3s ease'
  }
}));

const HearingLossSelector = ({ selectedCategory, onCategorySelect, showEffects = true }) => {
  const categories = Object.keys(hearingLossProfiles);
  
  const handleCategorySelect = (category) => {
    onCategorySelect(category);
  };

  const getEffects = (category) => {
    if (!showEffects) return null;
    const effects = getHearingLossEffects(category);
    
    return (
      <Box sx={{ mt: 2, p: 2, background: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#2c3e50' }}>
          Efectos en la Audición:
        </Typography>
        <Grid container spacing={1}>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#6c757d' }}>
              <strong>Consonantes:</strong> {effects.consonants}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#6c757d' }}>
              <strong>Vocales:</strong> {effects.vowels}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#6c757d' }}>
              <strong>Habla:</strong> {effects.speech}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" sx={{ color: '#6c757d' }}>
              <strong>Ambiente:</strong> {effects.environment}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700, 
          color: '#2c3e50',
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1
        }}>
          <Hearing sx={{ color: '#085946' }} />
          Selecciona el Tipo de Pérdida Auditiva
        </Typography>
        <Typography variant="body1" sx={{ 
          color: '#6c757d',
          maxWidth: 600,
          mx: 'auto'
        }}>
          Cada categoría representa diferentes niveles de pérdida auditiva según los estándares médicos internacionales
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {categories.map((category) => {
          const profile = hearingLossProfiles[category];
          const isSelected = selectedCategory === category;
          
          return (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <ProfileCard
                selected={isSelected}
                profileColor={profile.color}
                onClick={() => handleCategorySelect(category)}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header del perfil */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 2
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h1" sx={{ fontSize: '2rem' }}>
                        {profile.icon}
                      </Typography>
                      <Box>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          color: '#2c3e50',
                          fontSize: '1rem'
                        }}>
                          {profile.name}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#6c757d',
                          fontWeight: 500
                        }}>
                          {profile.range}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {isSelected && (
                      <CheckCircle sx={{ 
                        color: profile.color, 
                        fontSize: 24 
                      }} />
                    )}
                  </Box>

                  {/* Descripción */}
                  <Typography variant="body2" sx={{ 
                    color: '#6c757d',
                    mb: 2,
                    lineHeight: 1.5
                  }}>
                    {profile.description}
                  </Typography>

                  {/* Características técnicas */}
                  <Box sx={{ mb: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Chip 
                          label={`Filtro: ${profile.filterFreq}Hz`}
                          size="small"
                          sx={{ 
                            backgroundColor: profile.color + '20',
                            color: profile.color,
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip 
                          label={`Comp: ${profile.compression}:1`}
                          size="small"
                          sx={{ 
                            backgroundColor: profile.color + '20',
                            color: profile.color,
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip 
                          label={`Dist: ${profile.distortion * 100}%`}
                          size="small"
                          sx={{ 
                            backgroundColor: profile.color + '20',
                            color: profile.color,
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Chip 
                          label={`Vol: ${profile.volume * 100}%`}
                          size="small"
                          sx={{ 
                            backgroundColor: profile.color + '20',
                            color: profile.color,
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Efectos detallados */}
                  {getEffects(category)}

                  {/* Botón de selección */}
                  <Button
                    variant={isSelected ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                      mt: 2,
                      backgroundColor: isSelected ? profile.color : 'transparent',
                      color: isSelected ? 'white' : profile.color,
                      borderColor: profile.color,
                      '&:hover': {
                        backgroundColor: isSelected ? profile.color : profile.color + '10',
                      }
                    }}
                  >
                    {isSelected ? 'Seleccionado' : 'Seleccionar'}
                  </Button>
                </CardContent>
              </ProfileCard>
            </Grid>
          );
        })}
      </Grid>

      {/* Información adicional */}
      <Box sx={{ 
        mt: 4, 
        p: 3, 
        background: 'linear-gradient(135deg, #08594610 0%, #272F5010 100%)',
        borderRadius: 16,
        border: '1px solid #08594620'
      }}>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          color: '#085946',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Info sx={{ fontSize: 20 }} />
          Información Técnica
        </Typography>
        <Typography variant="body2" sx={{ 
          color: '#2c3e50',
          lineHeight: 1.6
        }}>
          <strong>Filtro:</strong> Frecuencia máxima que puede escuchar. <strong>Compresión:</strong> Relación de compresión dinámica del audio. 
          <strong>Distorsión:</strong> Porcentaje de distorsión armónica aplicada. <strong>Volumen:</strong> Nivel de volumen relativo al normal.
        </Typography>
      </Box>
    </Box>
  );
};

export default HearingLossSelector; 