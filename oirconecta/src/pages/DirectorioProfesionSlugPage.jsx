import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { directoryProfesionFromSlug, directoryFiltersToSearchParams } from '../utils/directoryPresentation';
import { PROFESION_LABEL_TODAS } from '../utils/profesionFilter';
import { POLIZA_LABEL_TODAS } from '../config/polizasColombia';
import { DIRECTORY_LISTADO_PATH } from '../config/directoryRoutes';

const LABELS = { profesionTodas: PROFESION_LABEL_TODAS, polizaTodas: POLIZA_LABEL_TODAS };

/**
 * URL legible por especialidad → listado con query `profesion`.
 * Ej: /directorio/profesion/audiologia → /directorio/listado?profesion=Audiología
 */
export default function DirectorioProfesionSlugPage() {
  const { slug } = useParams();
  const profesion = directoryProfesionFromSlug(slug || '');
  if (!profesion) {
    return <Navigate to="/directorio" replace />;
  }
  const qs = directoryFiltersToSearchParams({ q: '', ciudad: '', poliza: POLIZA_LABEL_TODAS, profesion }, LABELS).toString();
  return <Navigate to={`${DIRECTORY_LISTADO_PATH}?${qs}`} replace />;
}
