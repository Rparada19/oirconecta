import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, TextField, Button, Stack,
  CircularProgress, Alert, Chip, IconButton,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PreviewSlot from '../components/marketing/PreviewSlot';
import { isNonWorkingDay, isColombianHoliday, getHolidaysForYear } from '../utils/colombiaHolidays';

const API = import.meta.env.VITE_API_URL || 'https://oirconecta-api.onrender.com';

const SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'];

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const WEEK_DAYS = ['L','M','X','J','V','S','D'];

function fmt(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
function formatDisplay(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('es-CO',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
}
function formatSlot(t) {
  const [h,m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h-12 : h;
  const endH = h + 0; const endM = m + 50;
  const endMin = endH * 60 + endM;
  const eH = Math.floor(endMin/60); const eM = endMin%60;
  const ep = eH >= 12 ? 'PM' : 'AM';
  const eH12 = eH === 0 ? 12 : eH > 12 ? eH-12 : eH;
  return `${h12}:${String(m).padStart(2,'0')} ${p} – ${eH12}:${String(eM).padStart(2,'0')} ${ep}`;
}

// ─── Mini calendario ──────────────────────────────────────────────────────────
function MiniCalendar({ selectedDate, onSelect, availableDays }) {
  const today = new Date(); today.setHours(0,0,0,0);
  const [cur, setCur] = useState(() => { const d = new Date(); d.setDate(1); return d; });

  const year = cur.getFullYear(), month = cur.getMonth();
  const firstDow = new Date(year, month, 1).getDay(); // 0=dom
  // reordenar a lunes primero
  const startOffset = (firstDow + 6) % 7;
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const holidays = getHolidaysForYear(year);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) => `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isPast = (d) => new Date(year,month,d) < today;
  const isWeekend = (d) => { const dow = new Date(year,month,d).getDay(); return dow===0||dow===6; };
  const isHoliday = (d) => holidays.has(dateStr(d));
  const isDisabled = (d) => !d || isPast(d) || isWeekend(d) || isHoliday(d);

  const prevMonth = () => setCur(new Date(year, month-1, 1));
  const nextMonth = () => setCur(new Date(year, month+1, 1));
  // no retroceder antes del mes actual
  const canPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

  return (
    <Box>
      {/* Nav */}
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:2 }}>
        <IconButton size="small" onClick={prevMonth} disabled={!canPrev}
          sx={{ color:'#085946', '&:hover':{ bgcolor:'rgba(8,89,70,0.08)' }, '&.Mui-disabled':{ opacity:0.3 } }}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography sx={{ fontWeight:700, fontSize:'0.9375rem', color:'#272F50' }}>
          {MONTHS[month]} {year}
        </Typography>
        <IconButton size="small" onClick={nextMonth} sx={{ color:'#085946', '&:hover':{ bgcolor:'rgba(8,89,70,0.08)' } }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      {/* Days header - lunes a domingo */}
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', mb:1 }}>
        {WEEK_DAYS.map((d,i) => (
          <Typography key={d} sx={{ textAlign:'center', fontSize:'0.6875rem', fontWeight:700,
            color: i>=5 ? '#d1d5db' : '#6b7280', textTransform:'uppercase', letterSpacing:'0.05em', py:0.75 }}>
            {d}
          </Typography>
        ))}
      </Box>

      {/* Cells */}
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px' }}>
        {cells.map((d, i) => {
          if (!d) return <Box key={`e${i}`} />;
          const ds = dateStr(d);
          const disabled = isDisabled(d);
          const selected = ds === selectedDate;
          const isToday = new Date(year,month,d).getTime() === today.getTime();
          const holiday = isHoliday(d);
          const weekend = isWeekend(d);

          return (
            <Box
              key={ds}
              onClick={() => !disabled && onSelect(ds)}
              sx={{
                aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center',
                borderRadius:'10px', cursor: disabled ? 'default' : 'pointer', position:'relative',
                fontSize:'0.8125rem', fontWeight: selected ? 700 : isToday ? 600 : 500,
                bgcolor: selected ? '#085946' : isToday ? 'rgba(8,89,70,0.08)' : 'transparent',
                color: selected ? '#fff' : disabled ? '#d1d5db' : '#272F50',
                border: isToday && !selected ? '1.5px solid rgba(8,89,70,0.40)' : '1.5px solid transparent',
                transition:'all 0.15s ease',
                '&:hover': disabled ? {} : { bgcolor: selected ? '#085946' : 'rgba(8,89,70,0.10)', transform:'scale(1.08)' },
              }}
            >
              {d}
              {(holiday || weekend) && !disabled && (
                <Box sx={{ position:'absolute', bottom:2, left:'50%', transform:'translateX(-50%)',
                  width:4, height:4, borderRadius:'50%', bgcolor: holiday ? '#f87171' : '#d1d5db' }} />
              )}
            </Box>
          );
        })}
      </Box>

      {/* Leyenda */}
      <Stack direction="row" spacing={2} sx={{ mt:2, flexWrap:'wrap' }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
          <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'#f87171' }} />
          <Typography sx={{ fontSize:'0.6875rem', color:'#6b7280' }}>Feriado</Typography>
        </Box>
        <Box sx={{ display:'flex', alignItems:'center', gap:0.75 }}>
          <Box sx={{ width:8, height:8, borderRadius:'50%', bgcolor:'#085946' }} />
          <Typography sx={{ fontSize:'0.6875rem', color:'#6b7280' }}>Seleccionado</Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// ─── Paso indicador ──────────────────────────────────────────────────────────
function StepBadge({ num, label, active, done }) {
  return (
    <Box sx={{ display:'flex', alignItems:'center', gap:1.25 }}>
      <Box sx={{
        width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, fontSize:'0.8125rem', fontWeight:700,
        bgcolor: done ? '#085946' : active ? '#085946' : 'rgba(8,89,70,0.12)',
        color: done || active ? '#fff' : '#6b7280',
        transition:'all 0.2s',
      }}>
        {done ? '✓' : num}
      </Box>
      <Typography sx={{ fontSize:'0.875rem', fontWeight: active ? 700 : 500,
        color: active ? '#085946' : done ? '#374151' : '#9ca3af', display:{ xs:'none', sm:'block' } }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function AgendamientoPage() {
  const [searchParams] = useSearchParams();
  const rawDirectoryProfileId = searchParams.get('desdeDirectorio') || undefined;
  const [ownIds, setOwnIds] = useState([]);
  // Solo aceptamos desdeDirectorio si pertenece a un consultorio propio de
  // OírConecta. Cualquier otro UUID se ignora (el resto de profesionales del
  // directorio gestiona sus citas por fuera; el contacto va por formulario).
  const directoryProfileId = useMemo(
    () => (rawDirectoryProfileId && ownIds.includes(rawDirectoryProfileId) ? rawDirectoryProfileId : undefined),
    [rawDirectoryProfileId, ownIds]
  );

  const [step, setStep] = useState(0); // 0=fecha, 1=hora, 2=datos, 3=éxito
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [retailId, setRetailId] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', phone:'', motivo:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);

  // Obtener ID del profesional retail + warmup del servidor
  useEffect(() => {
    // Ping al health check para despertar el servidor antes de que el usuario seleccione fecha
    fetch(`${API}/api/public/retail-config`)
      .then(r => r.json()).then(d => {
        if (d?.data?.professionalId) setRetailId(d.data.professionalId);
        setOwnIds(d?.data?.ownDirectoryProfileIds || []);
      })
      .catch(() => {});
    // Precarga slots del día siguiente para que el servidor ya esté caliente
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const pre = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth()+1).padStart(2,'0')}-${String(tomorrow.getDate()).padStart(2,'0')}`;
    fetch(`${API}/api/appointments/available-slots?fecha=${pre}`).catch(() => {});
  }, []);

  // Cargar slots al seleccionar fecha
  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime(null);
    const params = new URLSearchParams({ fecha: selectedDate });
    if (retailId) params.set('professionalId', retailId);
    fetch(`${API}/api/appointments/available-slots?${params}`)
      .then(r => r.json())
      .then(d => setSlots(d.data?.availableSlots || []))
      .catch(() => setSlots([...SLOTS]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, retailId]);

  const handleDateSelect = (d) => {
    setSelectedDate(d);
    setError(null);
    setStep(1);
  };

  const handleTimeSelect = (t) => {
    setSelectedTime(t);
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`${API}/api/appointments`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          fecha: selectedDate, hora: selectedTime,
          patientName: form.name, patientEmail: form.email,
          patientPhone: form.phone, motivo: form.motivo || 'Valoración auditiva',
          durationMinutes: 50, professionalId: retailId || undefined,
          directoryProfileId: directoryProfileId || undefined,
          procedencia: 'web-agendamiento',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al agendar');
      setAppointment(data.data || data.appointment || data);
      setStep(3);
    } catch(e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(0); setSelectedDate(null); setSelectedTime(null);
    setForm({ name:'', email:'', phone:'', motivo:'' });
    setAppointment(null); setError(null);
  };

  return (
    <Box component="main" sx={{ bgcolor:'#f8fafc', minHeight:'100vh' }}>
      <Helmet>
        <title>Agenda tu cita auditiva | OírConecta</title>
        <meta name="description" content="Agenda online tu valoración auditiva con profesionales certificados de la red OírConecta. Disponibilidad en tiempo real y confirmación inmediata." />
        <link rel="canonical" href="https://oirconecta.com/agendar" />
        <meta property="og:title" content="Agenda tu cita auditiva | OírConecta" />
        <meta property="og:description" content="Agenda online tu valoración auditiva con profesionales certificados." />
        <meta property="og:url" content="https://oirconecta.com/agendar" />
      </Helmet>
      <Header />

      {/* HERO editorial */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        pt: { xs: 14, md: 16 }, pb: { xs: 6, md: 8 },
        bgcolor: '#FBFAF8',
      }}>
        <Box aria-hidden sx={{
          position: 'absolute', top: -180, right: -180,
          width: 540, height: 540, borderRadius: '50%',
          background: 'radial-gradient(circle, #D9CDBF55 0%, transparent 70%)',
          filter: 'blur(80px)', pointerEvents: 'none',
        }} />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
            gap: { xs: 3, md: 6 }, alignItems: 'end',
          }}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Box sx={{ width: 32, height: 2, bgcolor: '#C9A86A' }} />
                <Typography sx={{
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.24em',
                  textTransform: 'uppercase', color: '#272F50',
                }}>
                  Agendamiento en línea
                </Typography>
              </Stack>

              <Typography component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: { xs: '2.5rem', sm: '3.25rem', md: '4.5rem', lg: '5rem' },
                fontWeight: 500, lineHeight: 0.98, letterSpacing: '-0.025em',
                color: '#272F50', mb: { xs: 2.5, md: 3 },
              }}>
                Agenda tu valoración{' '}
                <Box component="span" sx={{ fontStyle: 'italic', color: '#085946' }}>
                  auditiva.
                </Box>
              </Typography>
            </Box>

            <Box sx={{ pb: { md: 1.5 } }}>
              <Typography sx={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: { xs: '1.0625rem', md: '1.1875rem' },
                color: '#6B7280', lineHeight: 1.55, maxWidth: 460, mb: 3,
              }}>
                Selecciona el día y la hora. Las citas duran 50 minutos, de lunes a viernes de 8:00 AM a 4:00 PM. Confirmación inmediata por correo.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {[
                  { icon: <LocationOnOutlinedIcon sx={{ fontSize: 15 }} />, text: 'Bogotá · Cr 10 #96-25' },
                  { icon: <CheckCircleIcon sx={{ fontSize: 15 }} />, text: 'Confirmación inmediata' },
                ].map(c => (
                  <Box key={c.text} sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.75,
                    px: 1.5, py: 0.75, borderRadius: '6px',
                    bgcolor: 'rgba(39,47,80,0.06)',
                    border: '1px solid rgba(39,47,80,0.14)',
                  }}>
                    <Box sx={{ color: '#272F50', display: 'flex' }}>{c.icon}</Box>
                    <Typography sx={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '0.8rem',
                      color: '#272F50', fontWeight: 600,
                    }}>{c.text}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Contenido */}
      <Container maxWidth="lg" sx={{ py:{ xs:4, md:6 } }}>

        {/* Step indicator */}
        {step < 3 && (
          <Box sx={{ display:'flex', alignItems:'center', gap:{ xs:2, md:4 }, mb:4,
            px:3, py:2, borderRadius:'16px', bgcolor:'#fff',
            border:'1px solid rgba(8,89,70,0.08)', boxShadow:'0 2px 12px rgba(8,89,70,0.06)' }}>
            <StepBadge num={1} label="Selecciona fecha" active={step===0} done={step>0} />
            <Box sx={{ flex:1, height:1, bgcolor:'rgba(8,89,70,0.12)', display:{ xs:'none', sm:'block' } }} />
            <StepBadge num={2} label="Elige horario" active={step===1} done={step>1} />
            <Box sx={{ flex:1, height:1, bgcolor:'rgba(8,89,70,0.12)', display:{ xs:'none', sm:'block' } }} />
            <StepBadge num={3} label="Tus datos" active={step===2} done={step>2} />
          </Box>
        )}

        {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb:3, borderRadius:'12px' }}>{error}</Alert>}

        {/* ── PASO 0: Selección de fecha ── */}
        {step === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{ borderRadius:'20px', p:3, bgcolor:'#fff',
                border:'1px solid rgba(8,89,70,0.08)', boxShadow:'0 4px 20px rgba(8,89,70,0.08)' }}>
                <Typography sx={{ fontWeight:800, fontSize:'1.125rem', color:'#272F50', mb:3, letterSpacing:'-0.01em' }}>
                  <CalendarMonthIcon sx={{ verticalAlign:'middle', mr:1, color:'#085946', fontSize:20 }} />
                  Selecciona una fecha
                </Typography>
                <MiniCalendar selectedDate={selectedDate} onSelect={handleDateSelect} />
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ borderRadius:'20px', p:3, bgcolor:'#fff',
                border:'1px solid rgba(8,89,70,0.08)', boxShadow:'0 4px 20px rgba(8,89,70,0.08)', height:'100%' }}>
                <Typography sx={{ fontWeight:700, fontSize:'0.9375rem', color:'#272F50', mb:2.5 }}>
                  Información importante
                </Typography>
                {[
                  { icon:<AccessTimeIcon sx={{ fontSize:18, color:'#085946' }} />, title:'Duración', desc:'50 minutos por consulta' },
                  { icon:<CalendarMonthIcon sx={{ fontSize:18, color:'#085946' }} />, title:'Horario', desc:'Lun – Vie, 8:00 AM a 4:00 PM' },
                  { icon:<LocationOnOutlinedIcon sx={{ fontSize:18, color:'#085946' }} />, title:'Ubicación', desc:'Carrera 10 #96-25, Cons. 320\nEdificio Centro Ejecutivo, Bogotá' },
                  { icon:<MedicalServicesOutlinedIcon sx={{ fontSize:18, color:'#085946' }} />, title:'Especialidad', desc:'Audiología clínica y valoración auditiva' },
                ].map(item => (
                  <Box key={item.title} sx={{ display:'flex', gap:1.5, mb:2.5 }}>
                    <Box sx={{ width:36, height:36, borderRadius:'10px', bgcolor:'rgba(8,89,70,0.08)',
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize:'0.8125rem', fontWeight:700, color:'#272F50' }}>{item.title}</Typography>
                      <Typography sx={{ fontSize:'0.8125rem', color:'#6b7280', lineHeight:1.6, whiteSpace:'pre-line' }}>{item.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        )}

        {/* ── PASO 1: Selección de hora ── */}
        {step === 1 && (
          <Box sx={{ borderRadius:'20px', p:{ xs:3, md:4 }, bgcolor:'#fff',
            border:'1px solid rgba(8,89,70,0.08)', boxShadow:'0 4px 20px rgba(8,89,70,0.08)' }}>
            <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:3, flexWrap:'wrap', gap:2 }}>
              <Box>
                <Typography sx={{ fontWeight:800, fontSize:'1.125rem', color:'#272F50', letterSpacing:'-0.01em' }}>
                  <AccessTimeIcon sx={{ verticalAlign:'middle', mr:1, color:'#085946', fontSize:20 }} />
                  Selecciona un horario
                </Typography>
                <Typography sx={{ fontSize:'0.875rem', color:'#6b7280', mt:0.5 }}>
                  {formatDisplay(selectedDate)}
                </Typography>
              </Box>
              <Button size="small" onClick={() => { setStep(0); setSelectedTime(null); }}
                sx={{ color:'#085946', fontWeight:600, fontSize:'0.8125rem' }}>
                ← Cambiar fecha
              </Button>
            </Box>

            {loadingSlots ? (
              <Box sx={{ display:'flex', justifyContent:'center', py:6 }}>
                <CircularProgress size={36} thickness={4} sx={{ color:'#085946' }} />
              </Box>
            ) : slots.length === 0 ? (
              <Box sx={{ textAlign:'center', py:6 }}>
                <Typography sx={{ color:'#6b7280', mb:2 }}>No hay horarios disponibles para este día.</Typography>
                <Button onClick={() => setStep(0)} variant="outlined"
                  sx={{ borderColor:'#085946', color:'#085946', borderRadius:'12px' }}>
                  Elegir otra fecha
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {slots.map(slot => {
                  const sel = selectedTime === slot;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={slot}>
                      <Box onClick={() => handleTimeSelect(slot)} sx={{
                        p:2.5, borderRadius:'14px', cursor:'pointer', textAlign:'center',
                        bgcolor: sel ? '#085946' : '#f8fafc',
                        border: sel ? '2px solid #085946' : '2px solid rgba(8,89,70,0.10)',
                        transition:'all 0.2s ease',
                        '&:hover':{ bgcolor: sel ? '#085946' : 'rgba(8,89,70,0.06)', transform:'translateY(-2px)', boxShadow:'0 6px 18px rgba(8,89,70,0.12)' },
                      }}>
                        <AccessTimeIcon sx={{ fontSize:18, color: sel ? '#6ee7c8' : '#085946', mb:0.5 }} />
                        <Typography sx={{ fontSize:'0.9375rem', fontWeight:700, color: sel ? '#fff' : '#272F50', lineHeight:1.3 }}>
                          {formatSlot(slot).split('–')[0].trim()}
                        </Typography>
                        <Typography sx={{ fontSize:'0.75rem', color: sel ? 'rgba(255,255,255,0.75)' : '#6b7280' }}>
                          hasta {formatSlot(slot).split('–')[1]?.trim()}
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )}

        {/* ── PASO 2: Datos del paciente ── */}
        {step === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{ borderRadius:'20px', p:{ xs:3, md:4 }, bgcolor:'#fff',
                border:'1px solid rgba(8,89,70,0.08)', boxShadow:'0 4px 20px rgba(8,89,70,0.08)' }}>
                <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mb:3, flexWrap:'wrap', gap:2 }}>
                  <Typography sx={{ fontWeight:800, fontSize:'1.125rem', color:'#272F50', letterSpacing:'-0.01em' }}>
                    <PersonOutlineIcon sx={{ verticalAlign:'middle', mr:1, color:'#085946', fontSize:20 }} />
                    Tus datos
                  </Typography>
                  <Button size="small" onClick={() => setStep(1)}
                    sx={{ color:'#085946', fontWeight:600, fontSize:'0.8125rem' }}>
                    ← Cambiar hora
                  </Button>
                </Box>

                <Stack spacing={2.5}>
                  <TextField fullWidth label="Nombre completo *" value={form.name}
                    onChange={e => setForm(f => ({...f, name: e.target.value}))}
                    InputProps={{ startAdornment: <PersonOutlineIcon sx={{ mr:1, color:'#9ca3af', fontSize:20 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'12px' } }} />
                  <TextField fullWidth label="Correo electrónico *" type="email" value={form.email}
                    onChange={e => setForm(f => ({...f, email: e.target.value}))}
                    helperText="Recibirás la confirmación y recordatorios aquí"
                    InputProps={{ startAdornment: <EmailOutlinedIcon sx={{ mr:1, color:'#9ca3af', fontSize:20 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'12px' } }} />
                  <TextField fullWidth label="Teléfono / WhatsApp *" value={form.phone}
                    onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                    InputProps={{ startAdornment: <PhoneOutlinedIcon sx={{ mr:1, color:'#9ca3af', fontSize:20 }} /> }}
                    sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'12px' } }} />
                  <TextField fullWidth label="Motivo de la consulta" value={form.motivo}
                    onChange={e => setForm(f => ({...f, motivo: e.target.value}))}
                    multiline rows={3} placeholder="Describe brevemente tu motivo de consulta..."
                    sx={{ '& .MuiOutlinedInput-root':{ borderRadius:'12px' } }} />
                </Stack>

                <Button fullWidth variant="contained" size="large" onClick={handleSubmit}
                  disabled={submitting || !form.name || !form.email || !form.phone}
                  sx={{ mt:3.5, borderRadius:'14px', fontWeight:700, fontSize:'1rem', py:1.75,
                    background:'linear-gradient(135deg,#085946,#0d7a5f)',
                    boxShadow:'0 6px 20px rgba(8,89,70,0.28)',
                    '&:hover':{ boxShadow:'0 8px 28px rgba(8,89,70,0.38)', transform:'translateY(-1px)' },
                    '&:disabled':{ background:'#e5e7eb', color:'#9ca3af', boxShadow:'none' },
                    transition:'all 0.2s ease' }}>
                  {submitting ? <CircularProgress size={22} sx={{ color:'#fff' }} /> : 'Confirmar cita'}
                </Button>
              </Box>
            </Grid>

            {/* Resumen */}
            <Grid item xs={12} md={5}>
              <Box sx={{ borderRadius:'20px', p:3, bgcolor:'#fff',
                border:'1px solid rgba(8,89,70,0.08)', boxShadow:'0 4px 20px rgba(8,89,70,0.08)' }}>
                <Typography sx={{ fontWeight:700, fontSize:'0.9375rem', color:'#272F50', mb:2.5 }}>
                  Resumen de tu cita
                </Typography>
                {[
                  { label:'Fecha', value: formatDisplay(selectedDate) },
                  { label:'Hora', value: formatSlot(selectedTime) },
                  { label:'Duración', value:'50 minutos' },
                  { label:'Lugar', value:'Cr 10 #96-25 Cons. 320\nEdificio Centro Ejecutivo, Bogotá' },
                ].map(r => (
                  <Box key={r.label} sx={{ display:'flex', flexDirection:'column', mb:2,
                    pb:2, borderBottom:'1px solid rgba(8,89,70,0.06)', '&:last-child':{ border:'none', mb:0, pb:0 } }}>
                    <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>{r.label}</Typography>
                    <Typography sx={{ fontSize:'0.9375rem', color:'#272F50', fontWeight:600, mt:0.25, whiteSpace:'pre-line' }}>{r.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
          </Grid>
        )}

        {/* ── PASO 3: Éxito ── */}
        {step === 3 && (
          <Box sx={{ maxWidth:560, mx:'auto', textAlign:'center' }}>
            <Box sx={{ width:80, height:80, borderRadius:'50%', bgcolor:'rgba(8,89,70,0.10)',
              display:'flex', alignItems:'center', justifyContent:'center', mx:'auto', mb:3 }}>
              <CheckCircleIcon sx={{ fontSize:44, color:'#085946' }} />
            </Box>
            <Typography sx={{ fontWeight:900, fontSize:'2rem', color:'#272F50', letterSpacing:'-0.03em', mb:1.5 }}>
              ¡Cita confirmada!
            </Typography>
            <Typography sx={{ fontSize:'1rem', color:'#6b7280', mb:4, lineHeight:1.7 }}>
              Tu cita del <strong>{formatDisplay(selectedDate)}</strong> a las <strong>{selectedTime}</strong> quedó registrada.
              Recibirás un correo de confirmación y recordatorios antes de la cita.
            </Typography>

            <Box sx={{ borderRadius:'16px', p:3, bgcolor:'#f0fdf4', border:'1px solid rgba(8,89,70,0.15)', mb:4, textAlign:'left' }}>
              <Typography sx={{ fontSize:'0.8125rem', fontWeight:700, color:'#085946', mb:1.5, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Detalle de la cita
              </Typography>
              {[
                ['Fecha', formatDisplay(selectedDate)],
                ['Hora', selectedTime],
                ['Duración', '50 minutos'],
                ['Lugar', 'Carrera 10 #96-25 Cons. 320, Edificio Centro Ejecutivo, Bogotá'],
              ].map(([k,v]) => (
                <Box key={k} sx={{ display:'flex', justifyContent:'space-between', mb:1 }}>
                  <Typography sx={{ fontSize:'0.875rem', color:'#6b7280', fontWeight:600 }}>{k}</Typography>
                  <Typography sx={{ fontSize:'0.875rem', color:'#272F50', fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{v}</Typography>
                </Box>
              ))}
            </Box>

            <Stack spacing={2}>
              <Button variant="contained" onClick={reset} sx={{ borderRadius:'14px', fontWeight:700, py:1.5,
                background:'linear-gradient(135deg,#085946,#0d7a5f)', boxShadow:'0 6px 20px rgba(8,89,70,0.25)' }}>
                Agendar otra cita
              </Button>
              <Button variant="outlined" component={RouterLink} to="/blog"
                sx={{ borderRadius:'14px', fontWeight:600, py:1.5, borderColor:'#085946', color:'#085946' }}>
                Leer artículos de salud auditiva
              </Button>
            </Stack>
          </Box>
        )}
      </Container>

      <PreviewSlot slotId="WEBINAR" slotLabel="Webinar patrocinado" minHeight={100} />
      <PreviewSlot slotId="ENCUESTA_NPS" slotLabel="Encuesta patrocinada" minHeight={100} />
      <Footer />
    </Box>
  );
}
