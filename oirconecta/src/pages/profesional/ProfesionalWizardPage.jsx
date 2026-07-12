/**
 * F6 — Wizard "Completa tu ficha en 5 minutos"
 *
 * Flujo full-screen editorial de 5 pasos. Auto-save por paso al backend
 * vía PATCH /api/directory/me. Al terminar redirige al dashboard con la
 * completitud actualizada.
 *
 * Trigger:
 *  · Auto-lanza si completitud < 30% cuando el profesional entra a
 *    /portal-profesional (redirect en ProfesionalLayout).
 *  · Botón "Empezar wizard" en el banner ProfilePreviewBanner del dashboard.
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, TextField, IconButton, Chip,
  LinearProgress, CircularProgress, Alert, Container, Snackbar,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import LandscapeOutlinedIcon from '@mui/icons-material/LandscapeOutlined';
import { directoryApi, getDirectoryToken } from '../../services/directoryAccountApi';
import { DIRECTORY_API } from '../../config/directoryApi';
import { getApiBaseUrl } from '../../utils/apiBaseUrl';
import PhotoCropperDialog from '../../components/profesional/PhotoCropperDialog';

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';

const MARCAS_COMUNES = [
  'Widex', 'Phonak', 'Signia', 'Oticon', 'ReSound',
  'Starkey', 'Bernafon', 'Unitron', 'Beltone', 'Rexton',
];

const STEPS = [
  { key: 'foto',      label: 'Tu imagen' },
  { key: 'historia',  label: 'Tu historia' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'marcas',    label: 'Marcas' },
  { key: 'contacto',  label: 'Contacto' },
];

// ─── Uploader helper ──────────────────────────────────────────
async function uploadImage(fileOrBlob, filename) {
  const token = getDirectoryToken();
  const fd = new FormData();
  fd.append('file', fileOrBlob, filename || fileOrBlob.name || 'upload.jpg');
  const url = `${getApiBaseUrl().replace(/\/$/, '')}/api/directory/me/upload`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const j = await res.json().catch(() => null);
  if (!res.ok || !j?.success) throw new Error(j?.error || 'Error al subir imagen');
  return j.data?.url || j.data;
}

// ─── UI helpers ───────────────────────────────────────────────
function StepHeader({ step, total, title, subtitle }) {
  const pct = ((step + 1) / total) * 100;
  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        {Array.from({ length: total }).map((_, i) => (
          <Box key={i} sx={{
            flex: 1, height: 4, borderRadius: 2,
            bgcolor: i <= step ? ACCENT : '#e5e7eb',
            transition: 'background-color 250ms ease',
          }} />
        ))}
      </Stack>
      <Typography sx={{
        fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
        color: MUTED, textTransform: 'uppercase', mb: 1,
      }}>
        Paso {step + 1} de {total} · {STEPS[step].label}
      </Typography>
      <Typography sx={{
        ...SERIF, fontWeight: 600, color: NAVY,
        fontSize: { xs: '1.9rem', md: '2.4rem' }, lineHeight: 1.1, mb: 1,
      }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: '1rem', color: MUTED, lineHeight: 1.55, maxWidth: 620 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

function ImageDropzone({ label, value, onChange, height = 200, icon: Ico = CameraAltOutlinedIcon, aspect = 1 }) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const [cropFile, setCropFile] = useState(null);
  const fileRef = React.useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setErr(null);
    setCropFile(file); // abre el cropper para encuadrar antes de subir
  };

  const handleCropped = async (blob) => {
    setCropFile(null);
    setUploading(true); setErr(null);
    try {
      const url = await uploadImage(blob, `foto-${Date.now()}.jpg`);
      onChange(url);
    } catch (e) {
      setErr(e.message || 'Error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Box sx={{
        position: 'relative', height, borderRadius: '14px',
        border: `2px dashed ${value ? 'transparent' : '#cbd5e1'}`,
        bgcolor: value ? 'transparent' : '#fafbfc',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 150ms ease',
        '&:hover': { borderColor: value ? 'transparent' : ACCENT },
      }} onClick={() => fileRef.current?.click()}>
        {value && (
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${value})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}
        {!value && (
          <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: '100%', color: MUTED }}>
            <Ico sx={{ fontSize: 36 }} />
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</Typography>
            <Typography sx={{ fontSize: '0.75rem' }}>Haz clic para subir</Typography>
          </Stack>
        )}
        {uploading && (
          <Box sx={{
            position: 'absolute', inset: 0,
            bgcolor: 'rgba(15,42,74,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CircularProgress sx={{ color: '#fff' }} />
          </Box>
        )}
        {value && !uploading && (
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
            sx={{
              position: 'absolute', top: 8, right: 8,
              bgcolor: 'rgba(255,255,255,0.9)',
              '&:hover': { bgcolor: '#fff' },
            }}
          >
            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#b91c1c' }} />
          </IconButton>
        )}
        <input ref={fileRef} type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" hidden
          onChange={(e) => handleFile(e.target.files?.[0])} />
        {err && (
          <Alert severity="error" sx={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
            {err}
          </Alert>
        )}
      </Box>
      {/* Fuera del Box con onClick: React propaga los clicks del Portal
          al ancestro virtual y disparaba el file picker otra vez. */}
      <PhotoCropperDialog
        open={!!cropFile}
        file={cropFile}
        aspect={aspect}
        onClose={() => setCropFile(null)}
        onCropped={handleCropped}
      />
    </>
  );
}

// ─── Steps ────────────────────────────────────────────────────
function StepFoto({ data, onChange }) {
  return (
    <>
      <StepHeader step={0} total={STEPS.length}
        title="Tu presencia visual"
        subtitle="Una buena foto y un banner atractivo son el 40% del impacto de tu ficha. Los pacientes deciden en 3 segundos si se quedan o no."
      />
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600, mb: 1 }}>
            Banner de portada (aparece detrás de tu nombre)
          </Typography>
          <ImageDropzone
            label="Banner de portada" icon={LandscapeOutlinedIcon} height={200}
            aspect={16 / 6}
            value={data.bannerUrl}
            onChange={(url) => onChange({ bannerUrl: url })}
          />
          <Typography sx={{ fontSize: '0.75rem', color: MUTED, mt: 0.75 }}>
            Recomendado: 1600×600px. Foto de tu consultorio, tú en acción o un ambiente cálido.
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.85rem', color: NAVY, fontWeight: 600, mb: 1 }}>
            Foto de perfil (aparece en resultados de búsqueda)
          </Typography>
          <Box sx={{ maxWidth: 220 }}>
            <ImageDropzone
              label="Foto de perfil" height={220}
              aspect={1}
              value={data.fotoPerfilUrl}
              onChange={(url) => onChange({ fotoPerfilUrl: url })}
            />
          </Box>
          <Typography sx={{ fontSize: '0.75rem', color: MUTED, mt: 0.75 }}>
            Cuadrada. Vestimenta profesional, buena iluminación, mira a la cámara con confianza.
          </Typography>
        </Box>
      </Stack>
    </>
  );
}

function StepHistoria({ data, onChange }) {
  const bioLen = (data.descripcion || '').length;
  return (
    <>
      <StepHeader step={1} total={STEPS.length}
        title="Cuenta tu historia"
        subtitle="Los pacientes no compran servicios, se conectan con personas. Cuéntales quién eres y por qué haces lo que haces."
      />
      <Stack spacing={2.5}>
        <TextField
          label="Bio profesional"
          multiline minRows={5} fullWidth
          value={data.descripcion || ''}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          inputProps={{ maxLength: 800 }}
          helperText={`${bioLen}/800 · Mínimo 120 caracteres. Cuenta tu formación, enfoque y qué te hace diferente. Ej: "Otorrinolaringóloga con 12 años en adaptación pediátrica. Mi enfoque es que cada consulta se sienta como una conversación, no un examen."`}
        />
        <TextField
          label="Años de experiencia"
          type="number" fullWidth
          value={data.anosExperiencia || ''}
          onChange={(e) => onChange({ anosExperiencia: e.target.value })}
          InputProps={{ inputProps: { min: 0, max: 60 } }}
          helperText="Suma años en consulta profesional. Ayuda a los pacientes a decidir."
          sx={{ maxWidth: 240 }}
        />
      </Stack>
    </>
  );
}

function StepServicios({ data, onChange }) {
  const servicios = Array.isArray(data.servicios) ? data.servicios : [];
  const add = () => onChange({ servicios: [...servicios, { nombre: '', descripcion: '', precio: '', duracion: '' }] });
  const remove = (i) => onChange({ servicios: servicios.filter((_, idx) => idx !== i) });
  const upd = (i, field, val) => onChange({
    servicios: servicios.map((s, idx) => idx === i ? { ...s, [field]: val } : s),
  });

  return (
    <>
      <StepHeader step={2} total={STEPS.length}
        title="¿Qué haces?"
        subtitle="Agrega al menos 3 servicios con precio (o 'consultar'). Los precios visibles aumentan las citas agendadas en 60%."
      />
      <Stack spacing={2}>
        {servicios.length === 0 && (
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            Todavía no has agregado ningún servicio. Empieza con el más común (valoración inicial).
          </Alert>
        )}
        {servicios.map((s, i) => (
          <Box key={i} sx={{
            border: `1px solid ${BORDER}`, borderRadius: '14px', p: 2.5,
            bgcolor: '#fff',
          }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%',
                bgcolor: '#faf5ff', color: ACCENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.85rem', fontWeight: 700,
              }}>{i + 1}</Box>
              <Typography sx={{ flex: 1, fontWeight: 600, color: NAVY, fontSize: '0.95rem' }}>
                Servicio #{i + 1}
              </Typography>
              <IconButton size="small" onClick={() => remove(i)}>
                <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#b91c1c' }} />
              </IconButton>
            </Stack>
            <Stack spacing={1.5}>
              <TextField
                label="Nombre del servicio" size="small" fullWidth
                value={s.nombre || ''}
                onChange={(e) => upd(i, 'nombre', e.target.value)}
                placeholder="Ej: Valoración auditiva completa"
              />
              <TextField
                label="Descripción" size="small" fullWidth multiline minRows={2}
                value={s.descripcion || ''}
                onChange={(e) => upd(i, 'descripcion', e.target.value)}
                placeholder="Qué incluye, qué debe traer el paciente…"
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Duración" size="small" fullWidth
                  value={s.duracion || ''}
                  onChange={(e) => upd(i, 'duracion', e.target.value)}
                  placeholder="Ej: 45 min"
                />
                <TextField
                  label="Precio (COP)" size="small" fullWidth
                  value={s.precio || ''}
                  onChange={(e) => upd(i, 'precio', e.target.value)}
                  placeholder="Ej: 180000 (déjalo vacío para 'consultar')"
                />
              </Stack>
            </Stack>
          </Box>
        ))}
        <Button
          onClick={add}
          startIcon={<AddRoundedIcon />}
          variant="outlined"
          sx={{
            borderColor: ACCENT, color: ACCENT,
            textTransform: 'none', fontWeight: 700,
            borderRadius: '10px', py: 1.25,
            '&:hover': { borderColor: ACCENT, bgcolor: '#faf5ff' },
          }}
        >
          Agregar servicio
        </Button>
      </Stack>
    </>
  );
}

function StepMarcas({ data, onChange }) {
  const allies = Array.isArray(data.allies) ? data.allies : [];
  const isSelected = (m) => allies.some((a) => (typeof a === 'string' ? a : a?.nombre) === m);
  const toggle = (m) => {
    // eslint-disable-next-line no-console
    console.log('[marcas] click', m, 'currentAllies=', JSON.stringify(allies), 'rawData.allies=', JSON.stringify(data.allies));
    const next = isSelected(m)
      ? allies.filter((a) => (typeof a === 'string' ? a : a?.nombre) !== m)
      : [...allies, m];
    onChange({ allies: next });
  };

  return (
    <>
      <StepHeader step={3} total={STEPS.length}
        title="¿Qué marcas atiendes?"
        subtitle="Selecciona todas las marcas de audífonos con las que trabajas. Los pacientes buscan especialistas de su marca específica."
      />
      <Box sx={{
        display: 'grid', gap: 1.25,
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
      }}>
        {MARCAS_COMUNES.map((m) => {
          const selected = isSelected(m);
          return (
            <Box key={m} onClick={() => toggle(m)}
              sx={{
                cursor: 'pointer', textAlign: 'center', py: 2.5, px: 1,
                borderRadius: '12px',
                border: selected ? `2px solid ${ACCENT}` : `1px solid ${BORDER}`,
                bgcolor: selected ? '#faf5ff' : '#fff',
                color: selected ? ACCENT : NAVY,
                fontWeight: selected ? 700 : 500,
                position: 'relative',
                transition: 'all 150ms ease',
                '&:hover': { borderColor: ACCENT, transform: 'translateY(-2px)' },
              }}>
              {selected && (
                <CheckRoundedIcon sx={{
                  position: 'absolute', top: 6, right: 6, fontSize: 18, color: ACCENT,
                }} />
              )}
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 'inherit' }}>{m}</Typography>
            </Box>
          );
        })}
      </Box>
    </>
  );
}

function StepContacto({ data, onChange }) {
  return (
    <>
      <StepHeader step={4} total={STEPS.length}
        title="¿Cómo te contactan?"
        subtitle="La dirección y el teléfono son los datos más buscados de tu ficha. Sin ellos, el paciente no puede tomar acción."
      />
      <Stack spacing={2}>
        <TextField
          label="Dirección del consultorio" fullWidth
          value={data.direccionPublica || ''}
          onChange={(e) => onChange({ direccionPublica: e.target.value })}
          placeholder="Ej: Cra. 13 #85-32, Consultorio 402, Chapinero, Bogotá"
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Teléfono público" fullWidth
            value={data.telefonoPublico || ''}
            onChange={(e) => onChange({ telefonoPublico: e.target.value })}
            placeholder="Ej: 601 2345678"
          />
          <TextField
            label="WhatsApp" fullWidth
            value={data.whatsappPublico || ''}
            onChange={(e) => onChange({ whatsappPublico: e.target.value })}
            placeholder="Ej: 573125678901 (con indicativo país)"
          />
        </Stack>
        <TextField
          label="Email público (opcional)" fullWidth
          value={data.emailPublico || ''}
          onChange={(e) => onChange({ emailPublico: e.target.value })}
          placeholder="Ej: consultas@tudominio.com"
        />
      </Stack>
    </>
  );
}

// ─── Página principal ─────────────────────────────────────────
export default function ProfesionalWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({});
  const [snack, setSnack] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    directoryApi.get(DIRECTORY_API.me).then(({ data: res, error: err }) => {
      if (err) { setError(err); setLoading(false); return; }
      const d = res?.data || {};
      setData({
        fotoPerfilUrl: d.fotoPerfilUrl || '',
        bannerUrl: d.bannerUrl || '',
        descripcion: d.descripcion || '',
        anosExperiencia: d.anosExperiencia ?? '',
        servicios: Array.isArray(d.servicios) ? d.servicios : [],
        allies: Array.isArray(d.allies) ? d.allies : [],
        telefonoPublico: d.telefonoPublico || '',
        whatsappPublico: d.whatsappPublico || '',
        emailPublico: d.emailPublico || '',
        direccionPublica: d.direccionPublica || '',
      });
      setLoading(false);
    });
  }, []);

  const update = (patch) => setData((prev) => ({ ...prev, ...patch }));

  const saveStep = async () => {
    setSaving(true); setError('');
    const payload = { ...data };
    if (payload.anosExperiencia === '') payload.anosExperiencia = null;
    else if (payload.anosExperiencia != null) payload.anosExperiencia = Number(payload.anosExperiencia);
    const { error: err } = await directoryApi.patch(DIRECTORY_API.me, payload);
    setSaving(false);
    if (err) { setError(err); return false; }
    return true;
  };

  const goNext = async () => {
    const ok = await saveStep();
    if (!ok) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      setSnack({ severity: 'success', msg: 'Guardado' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setSnack({ severity: 'success', msg: '¡Ficha completada!' });
      setTimeout(() => navigate('/portal-profesional'), 800);
    }
  };

  const goBack = () => {
    if (step === 0) {
      try { sessionStorage.setItem('oirconecta_wizard_dismissed_v1', '1'); } catch {}
      return navigate('/portal-profesional');
    }
    setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skip = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/portal-profesional');
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Box>
    );
  }

  const isOptionalStep = [0, 3, 4].includes(step);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafbfc' }}>
      {/* Topbar mínimo */}
      <Box sx={{
        borderBottom: `1px solid ${BORDER}`, bgcolor: '#fff',
        px: { xs: 2, md: 4 }, py: 1.75,
        display: 'flex', alignItems: 'center', gap: 2,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '10px', bgcolor: NAVY,
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          ...SERIF, fontSize: '1rem', fontWeight: 600,
        }}>O</Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ ...SERIF, fontSize: '1.05rem', color: NAVY, lineHeight: 1 }}>
            OírConecta
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: MUTED, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            Completa tu ficha
          </Typography>
        </Box>
        <IconButton onClick={() => {
          try { sessionStorage.setItem('oirconecta_wizard_dismissed_v1', '1'); } catch {}
          navigate('/portal-profesional');
        }} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {step === 0 && <StepFoto data={data} onChange={update} />}
        {step === 1 && <StepHistoria data={data} onChange={update} />}
        {step === 2 && <StepServicios data={data} onChange={update} />}
        {step === 3 && <StepMarcas data={data} onChange={update} />}
        {step === 4 && <StepContacto data={data} onChange={update} />}

        {/* Actions */}
        <Stack direction="row" spacing={2} sx={{ mt: 5, alignItems: 'center' }}>
          <Button
            onClick={goBack}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{ color: MUTED, textTransform: 'none', fontWeight: 600 }}
          >
            {step === 0 ? 'Salir' : 'Atrás'}
          </Button>
          <Box sx={{ flex: 1 }} />
          {isOptionalStep && (
            <Button
              onClick={skip}
              sx={{ color: MUTED, textTransform: 'none', fontWeight: 600 }}
            >
              Saltar por ahora
            </Button>
          )}
          <Button
            onClick={goNext}
            disabled={saving}
            endIcon={step === STEPS.length - 1 ? <CheckRoundedIcon /> : <ArrowForwardRoundedIcon />}
            variant="contained"
            sx={{
              background: NAVY, color: '#fff',
              textTransform: 'none', fontWeight: 700, fontSize: '0.95rem',
              px: 3.5, py: 1.25, borderRadius: '12px',
              '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
            }}
          >
            {saving ? 'Guardando…' : (step === STEPS.length - 1 ? 'Finalizar' : 'Guardar y continuar')}
          </Button>
        </Stack>
      </Container>

      <Snackbar open={!!snack} autoHideDuration={2500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}
