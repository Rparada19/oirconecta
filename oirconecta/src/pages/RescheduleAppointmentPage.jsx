import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { isNonWorkingDay, getHolidaysForYear } from '../utils/colombiaHolidays';

const API = import.meta.env.VITE_API_URL || '';

const SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

function fmt(y, m, d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function formatSlot(t) {
  const [h, min] = t.split(':').map(Number);
  const endH = h + 0, endMin = min + 50;
  const to12 = (hh, mm) => {
    const ap = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 || 12;
    return `${h12}:${String(mm).padStart(2,'0')} ${ap}`;
  };
  return `${to12(h, min)} – ${to12(h, min + 50)}`;
}

function MiniCalendar({ selected, onSelect }) {
  const today = new Date();
  const [view, setView] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }));
  const { y, m } = view;
  const holidays = getHolidaysForYear(y);
  const firstDay = new Date(y, m, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const cells = Array(offset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const todayStr = fmt(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <Box sx={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box component="button" onClick={() => setView(v => v.m === 0 ? { y: v.y-1, m: 11 } : { y: v.y, m: v.m-1 })}
          sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', p: 0.5, display:'flex' }}>
          <ChevronLeftIcon />
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 15 }}>{MONTH_NAMES[m]} {y}</Typography>
        <Box component="button" onClick={() => setView(v => v.m === 11 ? { y: v.y+1, m: 0 } : { y: v.y, m: v.m+1 })}
          sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', p: 0.5, display:'flex' }}>
          <ChevronRightIcon />
        </Box>
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.25, mb: 0.5 }}>
        {['L','M','X','J','V','S','D'].map(d => (
          <Typography key={d} sx={{ textAlign: 'center', fontSize: 11, color: 'text.disabled', fontWeight: 600, py: 0.5 }}>{d}</Typography>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 0.25 }}>
        {cells.map((day, i) => {
          if (!day) return <Box key={i} />;
          const dateStr = fmt(y, m, day);
          const nonWorking = isNonWorkingDay(dateStr);
          const isHoliday = holidays.has(dateStr);
          const isPast = dateStr <= todayStr;
          const isSelected = dateStr === selected;
          const disabled = nonWorking || isPast;
          return (
            <Box key={i} onClick={() => !disabled && onSelect(dateStr)}
              sx={{
                position: 'relative', textAlign: 'center', borderRadius: 1.5, py: 0.75,
                cursor: disabled ? 'default' : 'pointer',
                background: isSelected ? 'linear-gradient(135deg,#6ee7c8,#34d399)' : 'transparent',
                color: isSelected ? '#0a1628' : disabled ? 'text.disabled' : 'text.primary',
                fontWeight: isSelected ? 700 : 400,
                fontSize: 13,
                '&:hover': !disabled ? { background: isSelected ? undefined : 'rgba(110,231,200,0.12)' } : {},
              }}>
              {day}
              {isHoliday && !isSelected && <Box sx={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)', width:4, height:4, borderRadius:'50%', background:'#f87171' }} />}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default function RescheduleAppointmentPage() {
  const [params] = useSearchParams();
  const token = params.get('token');

  const [pageStatus, setPageStatus] = useState('loading'); // loading | ready | error | success
  const [appt, setAppt] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState(SLOTS);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setPageStatus('error'); setErrMsg('Token no válido.'); return; }
    fetch(`${API}/api/appointments/reschedule/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) { setAppt(d.data); setPageStatus('ready'); }
        else { setPageStatus('error'); setErrMsg(d.error || 'Enlace inválido o expirado.'); }
      })
      .catch(() => { setPageStatus('error'); setErrMsg('Error de red.'); });
  }, [token]);

  const fetchSlots = useCallback((date) => {
    setLoadingSlots(true);
    setSelectedSlot('');
    fetch(`${API}/api/appointments/available-slots?fecha=${date}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.availableSlots) setAvailableSlots(d.data.availableSlots);
        else if (d.data?.nonWorking) setAvailableSlots([]);
        else setAvailableSlots([]);
      })
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, []);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    fetchSlots(date);
  };

  const handleSubmit = () => {
    if (!selectedDate || !selectedSlot) return;
    setSubmitting(true);
    fetch(`${API}/api/appointments/reschedule/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fecha: selectedDate, hora: selectedSlot }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) setPageStatus('success');
        else { setErrMsg(d.error || 'No se pudo reagendar.'); setSubmitting(false); }
      })
      .catch(() => { setErrMsg('Error de red.'); setSubmitting(false); });
  };

  return (
    <>
      <Header />
      <Box sx={{
        minHeight: '80vh',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(110,231,200,0.08) 0%, transparent 70%), #0a1628',
        py: 8, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Box sx={{ width: '100%', maxWidth: 640 }}>

          {pageStatus === 'loading' && (
            <Box sx={{ textAlign: 'center' }}><CircularProgress size={48} sx={{ color: '#6ee7c8' }} /></Box>
          )}

          {pageStatus === 'error' && (
            <Box sx={{ textAlign: 'center' }}>
              <ErrorOutlineIcon sx={{ fontSize: 72, color: '#f87171', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Enlace no válido</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>{errMsg}</Typography>
              <Button variant="outlined" component={RouterLink} to="/agendar"
                sx={{ borderColor: '#6ee7c8', color: '#6ee7c8', borderRadius: 2 }}>
                Agendar nueva cita
              </Button>
            </Box>
          )}

          {pageStatus === 'success' && (
            <Box sx={{ textAlign: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 72, color: '#6ee7c8', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>¡Cita reagendada!</Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                Tu cita fue reagendada para el <strong>{selectedDate}</strong> a las <strong>{formatSlot(selectedSlot)}</strong>.
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3, fontSize: 14 }}>
                Recibirás un correo con los detalles actualizados.
              </Typography>
              <Button variant="contained" component={RouterLink} to="/"
                sx={{ background: 'linear-gradient(135deg,#6ee7c8,#34d399)', color: '#0a1628', fontWeight: 700, borderRadius: 2 }}>
                Ir al inicio
              </Button>
            </Box>
          )}

          {pageStatus === 'ready' && (
            <>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>Reagendar cita</Typography>
              {appt && (
                <Typography color="text.secondary" sx={{ mb: 4, fontSize: 14 }}>
                  Cita actual: <strong>{appt.fecha}</strong> a las <strong>{appt.hora}</strong>
                </Typography>
              )}

              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Selecciona una nueva fecha</Typography>
              <MiniCalendar selected={selectedDate} onSelect={handleDateSelect} />

              {selectedDate && (
                <Box sx={{ mt: 3 }}>
                  <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Horarios disponibles</Typography>
                  {loadingSlots ? (
                    <CircularProgress size={28} sx={{ color: '#6ee7c8' }} />
                  ) : availableSlots.length === 0 ? (
                    <Typography color="text.secondary">No hay horarios disponibles para este día.</Typography>
                  ) : (
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 1.5 }}>
                      {availableSlots.map(slot => (
                        <Box key={slot} onClick={() => setSelectedSlot(slot)}
                          sx={{
                            p: 1.5, borderRadius: 2, textAlign: 'center', cursor: 'pointer',
                            border: selectedSlot === slot ? '2px solid #6ee7c8' : '1px solid rgba(255,255,255,0.1)',
                            background: selectedSlot === slot ? 'rgba(110,231,200,0.12)' : 'rgba(255,255,255,0.03)',
                            color: selectedSlot === slot ? '#6ee7c8' : 'text.primary',
                            fontWeight: selectedSlot === slot ? 700 : 400,
                            fontSize: 14,
                            transition: 'all 0.15s',
                            '&:hover': { background: 'rgba(110,231,200,0.08)', borderColor: 'rgba(110,231,200,0.4)' },
                          }}>
                          {formatSlot(slot)}
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              {errMsg && (
                <Typography sx={{ color: '#f87171', mt: 2, fontSize: 14 }}>{errMsg}</Typography>
              )}

              <Button
                fullWidth disabled={!selectedDate || !selectedSlot || submitting}
                onClick={handleSubmit}
                sx={{
                  mt: 4, py: 1.75, borderRadius: 2, fontWeight: 700, fontSize: 16,
                  background: 'linear-gradient(135deg,#6ee7c8,#34d399)',
                  color: '#0a1628',
                  '&:disabled': { opacity: 0.4 },
                }}>
                {submitting ? <CircularProgress size={22} sx={{ color: '#0a1628' }} /> : 'Confirmar reagendamiento'}
              </Button>
            </>
          )}

        </Box>
      </Box>
      <Footer />
    </>
  );
}
