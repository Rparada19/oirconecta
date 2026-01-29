/**
 * Formularios de historia clínica por tipo de cita.
 * Cada formulario recibe { data, onChange } y renderiza los campos correspondientes.
 */

import PrimeraVezForm from './PrimeraVezForm';
import AdaptacionForm from './AdaptacionForm';
import PruebaAudifonosForm from './PruebaAudifonosForm';
import EntregaMantenimientoForm from './EntregaMantenimientoForm';
import RevisionAudifonosForm from './RevisionAudifonosForm';
import ExamenesForm from './ExamenesForm';
import ControlForm from './ControlForm';

const FORM_BY_TYPE = {
  'primera-vez': PrimeraVezForm,
  adaptacion: AdaptacionForm,
  'prueba-audifonos': PruebaAudifonosForm,
  'entrega-mantenimiento': EntregaMantenimientoForm,
  revision: RevisionAudifonosForm,
  examenes: ExamenesForm,
  control: ControlForm,
};

/**
 * Devuelve el componente de formulario de historia clínica para un tipo de cita.
 * @param {string} appointmentType - primera-vez | adaptacion | prueba-audifonos | entrega-mantenimiento | revision | examenes | control
 * @returns {React.Component|null}
 */
export const getClinicalHistoryForm = (appointmentType) => {
  if (!appointmentType || !FORM_BY_TYPE[appointmentType]) {
    return null;
  }
  return FORM_BY_TYPE[appointmentType];
};

export {
  PrimeraVezForm,
  AdaptacionForm,
  PruebaAudifonosForm,
  EntregaMantenimientoForm,
  RevisionAudifonosForm,
  ExamenesForm,
  ControlForm,
};

export default FORM_BY_TYPE;
