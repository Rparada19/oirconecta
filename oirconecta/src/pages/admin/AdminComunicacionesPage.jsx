/**
 * T5 — Buzón admin de templates de email/SMS/WhatsApp.
 *
 * Layout tipo email client:
 *   ┌─────────────┬────────────────────────────────────┐
 *   │ Lista       │ Editor (subject + body HTML)       │
 *   │ agrupada    │ + Preview lado a lado              │
 *   │ por         │ + Variables clickables             │
 *   │ categoría   │ + Botones: Guardar, Probar, Restaurar│
 *   └─────────────┴────────────────────────────────────┘
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Container, Typography, Stack, Button, TextField, IconButton, Chip,
  CircularProgress, Alert, Snackbar, Tabs, Tab, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { adminFetch as defaultAdminFetch } from './adminAuth';

const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' };
const NAVY = '#0F2A4A';
const ACCENT = '#6d28d9';
const MUTED = '#64748b';
const BORDER = '#eef0f3';

// Payload dummy para el preview según código
const DEMO_PAYLOAD = {
  LEAD_NURTURE_1: { nombre: 'Ana', interes: 'Adaptación de audífonos' },
  LEAD_NURTURE_2: { nombre: 'Ana', interes: 'Adaptación de audífonos' },
  LEAD_NURTURE_3: { nombre: 'Ana', interes: 'Adaptación de audífonos' },
  BIRTHDAY: { nombre: 'Ana', referralCode: 'ABC12345' },
  REVIEW_REQUEST: {
    nombre: 'Ana', professionalName: 'Dra. Angélica Sandoval',
    tipoConsulta: 'valoración auditiva', fecha: '8 de julio de 2026',
    reviewUrl: 'https://oirconecta.com/dejar-resena/xxx',
  },
  REFERRAL_USED: { referrerName: 'Ana', newPatientName: 'María Camila' },
};

const CATEGORY_COLORS = {
  TRANSACTIONAL: { bg: '#eff6ff', ink: '#1e40af' },
  MARKETING: { bg: '#faf5ff', ink: '#6b21a8' },
  AUTHENTICATION: { bg: '#fef3c7', ink: '#78350f' },
};

// Labels de los grupos de flujo (matchean con backend GROUPS)
const GROUP_LABELS = {
  CRM_CITAS:            'CRM — Ciclo de la cita',
  CRM_CONTROLES:        'CRM — Controles de adaptación',
  DIRECTORIO_CITAS:     'Directorio — Ciclo de la cita',
  DIRECTORIO_POST_CITA: 'Directorio — Post-cita',
  DIRECTORIO_NURTURE:   'Directorio — Nurture de leads',
  DIRECTORIO_RETENCION: 'Retención (cumpleaños, referidos)',
  CITAS_TRANSACCIONALES:'Citas — Compartidas (legacy)',
  OTROS:                'Otros',
};

const GROUP_DESCRIPTIONS = {
  CRM_CITAS:            'Confirmación, recordatorio, agradecimiento y encuesta al paciente del centro propio.',
  CRM_CONTROLES:        'Funnel post-venta de audífono (centros propios).',
  DIRECTORIO_CITAS:     'Cita con un profesional adscrito al directorio.',
  DIRECTORIO_POST_CITA: 'Acompañamiento tras la consulta con un profesional.',
  DIRECTORIO_NURTURE:   'Secuencia a leads sin cita.',
  DIRECTORIO_RETENCION: 'Cumpleaños y referidos.',
  CITAS_TRANSACCIONALES:'Compartido histórico. Se irá migrando a los grupos por audiencia.',
  OTROS:                'Sin agrupar.',
};

export default function AdminComunicacionesPage({ scope = null, fetchFn = defaultAdminFetch } = {}) {
  const adminFetch = fetchFn;
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);
  const [draft, setDraft] = useState({ subject: '', body: '', activo: true });
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewSubject, setPreviewSubject] = useState('');
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState(null);
  const [error, setError] = useState('');
  const [testDialog, setTestDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  // T6 — Asistente de diseño IA
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { subject, body, changes }

  const loadList = async () => {
    setLoading(true);
    const qs = scope ? `?scope=${scope}` : '';
    const r = await adminFetch(`/api/email-templates${qs}`);
    if (!r.ok) { setError(r.data?.error || 'Error'); setLoading(false); return; }
    setList(r.data?.data || []);
    setLoading(false);
  };

  useEffect(() => { loadList(); /* eslint-disable-next-line */ }, [scope]);

  useEffect(() => {
    if (!selectedCode) return;
    const item = list.find((x) => x.code === selectedCode);
    if (item) {
      setDraft({
        subject: item.subject || '',
        body: item.body || '',
        activo: item.activo !== false,
      });
    }
  }, [selectedCode, list]);

  useEffect(() => {
    // Preview en tiempo real cada vez que cambia el draft
    if (!selectedCode) return;
    const t = setTimeout(async () => {
      // Renderizado local con payload demo (evita ida y vuelta al server)
      const payload = DEMO_PAYLOAD[selectedCode] || {};
      const render = (s) => s.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => payload[k] ?? '');
      setPreviewSubject(render(draft.subject));
      setPreviewHtml(render(draft.body));
    }, 200);
    return () => clearTimeout(t);
  }, [draft, selectedCode]);

  const selected = list.find((x) => x.code === selectedCode);
  const grouped = useMemo(() => {
    // Preserva el orden de list (viene ya ordenado por group + orderInGroup del backend)
    const seen = new Map();
    for (const t of list) {
      const g = t.group || 'OTROS';
      if (!seen.has(g)) seen.set(g, []);
      seen.get(g).push(t);
    }
    return Array.from(seen.entries());
  }, [list]);

  const save = async () => {
    if (!selectedCode) return;
    setSaving(true);
    const r = await adminFetch(`/api/email-templates/${selectedCode}`, {
      method: 'PATCH',
      body: JSON.stringify(draft),
    });
    setSaving(false);
    if (!r.ok) return setSnack({ severity: 'error', msg: r.data?.error || 'Error al guardar' });
    setSnack({ severity: 'success', msg: 'Guardado' });
    await loadList();
  };

  const restore = async () => {
    if (!selectedCode) return;
    if (!confirm('¿Restaurar este template a su valor original? Los cambios se perderán.')) return;
    const r = await adminFetch(`/api/email-templates/${selectedCode}/restore`, { method: 'POST' });
    if (!r.ok) return setSnack({ severity: 'error', msg: r.data?.error || 'Error' });
    setSnack({ severity: 'success', msg: 'Restaurado al valor por defecto' });
    await loadList();
  };

  const sendTest = async () => {
    if (!testEmail) return;
    const r = await adminFetch(`/api/email-templates/${selectedCode}/send-test`, {
      method: 'POST',
      body: JSON.stringify({ to: testEmail, payload: DEMO_PAYLOAD[selectedCode] || {} }),
    });
    if (!r.ok) return setSnack({ severity: 'error', msg: r.data?.error || 'Error al enviar' });
    setSnack({ severity: 'success', msg: `Enviado a ${testEmail}` });
    setTestDialog(false);
  };

  const insertVariable = (variable) => {
    const tag = `{{${variable}}}`;
    setDraft((d) => ({ ...d, body: d.body + ' ' + tag }));
  };

  // T6 — Asistente de diseño IA
  const runAssistant = async () => {
    if (!selectedCode || !aiInstruction.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    const r = await adminFetch(`/api/email-templates/${selectedCode}/ai-edit`, {
      method: 'POST',
      body: JSON.stringify({
        instruction: aiInstruction.trim(),
        subject: draft.subject,
        body: draft.body,
      }),
    });
    setAiLoading(false);
    if (!r.ok) return setSnack({ severity: 'error', msg: r.data?.error || 'El asistente no respondió' });
    setAiResult(r.data?.data);
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    setDraft((d) => ({ ...d, subject: aiResult.subject, body: aiResult.body }));
    setAiResult(null);
    setAiInstruction('');
    setAiOpen(false);
    setSnack({ severity: 'success', msg: 'Cambios aplicados. Recuerda guardar.' });
  };

  const discardAiResult = () => {
    setAiResult(null);
    setAiInstruction('');
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress sx={{ color: ACCENT }} />
      </Container>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 3 }}>
        <Box>
          <Typography sx={{
            fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em',
            color: MUTED, textTransform: 'uppercase', mb: 0.5,
          }}>
            Comunicaciones
          </Typography>
          <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: '2rem', lineHeight: 1.05 }}>
            Buzón de plantillas
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: MUTED, mt: 0.5 }}>
            Editá el contenido de los emails automáticos. Los cambios se aplican inmediatamente.
          </Typography>
        </Box>
        <Button startIcon={<RefreshRoundedIcon />} onClick={loadList}
          sx={{ borderColor: NAVY, color: NAVY, textTransform: 'none', fontWeight: 600 }}>
          Refrescar
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Box sx={{
        display: 'grid', gap: 2,
        gridTemplateColumns: { xs: '1fr', lg: '280px 1fr' },
      }}>
        {/* Lista lateral */}
        <Box sx={{
          bgcolor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px',
          overflow: 'hidden', height: 'fit-content',
        }}>
          {grouped.map(([grp, items]) => (
            <Box key={grp}>
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
                <Typography sx={{
                  fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.14em',
                  color: NAVY, textTransform: 'uppercase',
                }}>
                  {GROUP_LABELS[grp] || grp} · {items.length}
                </Typography>
                {GROUP_DESCRIPTIONS[grp] && (
                  <Typography sx={{ fontSize: '0.7rem', color: MUTED, mt: 0.25 }}>
                    {GROUP_DESCRIPTIONS[grp]}
                  </Typography>
                )}
              </Box>
              {items.map((tpl) => {
                const active = tpl.code === selectedCode;
                const cc = CATEGORY_COLORS[tpl.category] || CATEGORY_COLORS.TRANSACTIONAL;
                return (
                  <Box key={tpl.code}
                    onClick={() => setSelectedCode(tpl.code)}
                    sx={{
                      px: 2.5, py: 1.5, cursor: 'pointer',
                      borderBottom: `1px solid ${BORDER}`,
                      bgcolor: active ? '#faf5ff' : '#fff',
                      borderLeft: active ? `3px solid ${ACCENT}` : '3px solid transparent',
                      '&:hover': { bgcolor: active ? '#faf5ff' : '#f8fafc' },
                    }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                      <MailOutlineRoundedIcon sx={{ fontSize: 14, color: cc.ink }} />
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: active ? 700 : 600, color: NAVY }}>
                        {tpl.label || tpl.code}
                      </Typography>
                      {tpl.isDefault && (
                        <Chip label="Por defecto" size="small"
                          sx={{ bgcolor: '#f1f5f9', color: MUTED, fontSize: '0.62rem', height: 16 }} />
                      )}
                    </Stack>
                    <Typography sx={{ fontSize: '0.68rem', color: MUTED, fontFamily: 'monospace' }}>
                      {tpl.code}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Editor + Preview */}
        {selectedCode && selected ? (
          <Box sx={{
            bgcolor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px',
            overflow: 'hidden',
          }}>
            {/* Header */}
            <Box sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderBottom: `1px solid ${BORDER}` }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: '1.35rem' }}>
                    {selected?.label || selectedCode}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: MUTED, fontFamily: 'monospace', mt: 0.25 }}>
                    {selectedCode}
                  </Typography>
                  {selected.description && (
                    <Typography sx={{ fontSize: '0.85rem', color: MUTED, mt: 0.5, maxWidth: 640 }}>
                      {selected.description}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    onClick={() => setAiOpen(true)}
                    startIcon={<AutoAwesomeRoundedIcon />}
                    variant="contained"
                    sx={{
                      background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
                      color: '#fff', textTransform: 'none', fontWeight: 700,
                      fontSize: '0.85rem', px: 2, py: 0.75, borderRadius: '10px',
                      '&:hover': { background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, filter: 'brightness(0.95)' },
                    }}
                  >
                    Asistente IA
                  </Button>
                  <Tooltip title="Enviar de prueba a mi email">
                    <IconButton onClick={() => setTestDialog(true)} sx={{ color: NAVY }}>
                      <SendOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Restaurar valor por defecto">
                    <IconButton onClick={restore} sx={{ color: '#b91c1c' }}>
                      <RestartAltOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>

            {/* Editor + Preview grid */}
            <Box sx={{
              display: 'grid', gap: 0,
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              minHeight: 500,
            }}>
              {/* Editor */}
              <Box sx={{ p: 3, borderRight: { lg: `1px solid ${BORDER}` } }}>
                <Typography sx={{
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em',
                  color: MUTED, textTransform: 'uppercase', mb: 1,
                }}>
                  Subject
                </Typography>
                <TextField fullWidth size="small"
                  value={draft.subject}
                  onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                  placeholder="Asunto del email"
                  sx={{ mb: 3 }}
                />

                {selected.variables?.length > 0 && (
                  <>
                    <Typography sx={{
                      fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em',
                      color: MUTED, textTransform: 'uppercase', mb: 1,
                    }}>
                      Variables disponibles (click para insertar)
                    </Typography>
                    <Box sx={{ mb: 3, display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                      {selected.variables.map((v) => (
                        <Chip key={v} label={`{{${v}}}`} size="small"
                          onClick={() => insertVariable(v)}
                          sx={{
                            bgcolor: '#faf5ff', color: ACCENT, fontFamily: 'monospace',
                            fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                            '&:hover': { bgcolor: '#f3e8ff' },
                          }} />
                      ))}
                    </Box>
                  </>
                )}

                <Typography sx={{
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em',
                  color: MUTED, textTransform: 'uppercase', mb: 1,
                }}>
                  Cuerpo (HTML)
                </Typography>
                <TextField fullWidth multiline minRows={16} maxRows={30}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="<p>Hola {{nombre}}, ...</p>"
                  InputProps={{
                    sx: { fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: '0.82rem', lineHeight: 1.5 },
                  }}
                />
              </Box>

              {/* Preview */}
              <Box sx={{ bgcolor: '#f4f6f8', p: 3, overflowY: 'auto' }}>
                <Typography sx={{
                  fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.14em',
                  color: MUTED, textTransform: 'uppercase', mb: 1.5,
                }}>
                  Vista previa
                </Typography>
                <Box sx={{
                  bgcolor: '#fff', borderRadius: '12px', p: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)', minHeight: 400,
                }}>
                  <Box sx={{ pb: 2, mb: 2, borderBottom: `1px solid ${BORDER}` }}>
                    <Typography sx={{ fontSize: '0.7rem', color: MUTED, fontWeight: 600 }}>
                      Asunto
                    </Typography>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: NAVY }}>
                      {previewSubject || <em style={{ color: '#94a3b8', fontWeight: 400 }}>Sin subject</em>}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      fontSize: '0.9rem', color: '#374151', lineHeight: 1.65,
                      '& p': { margin: '0 0 12px' },
                      '& a': { color: ACCENT, textDecoration: 'underline' },
                      '& blockquote': {
                        borderLeft: `3px solid ${ACCENT}`, pl: 2, py: 0.5,
                        margin: '16px 0', fontStyle: 'italic', color: '#475569',
                      },
                      '& ul': { pl: 2.5, margin: '0 0 12px' },
                      '& li': { marginBottom: '4px' },
                      '& strong': { fontWeight: 700, color: NAVY },
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml || '<em style="color:#94a3b8">Escribe el cuerpo en el editor de la izquierda</em>' }}
                  />
                </Box>
              </Box>
            </Box>

            {/* Footer con guardar */}
            <Box sx={{
              px: 3, py: 2, borderTop: `1px solid ${BORDER}`,
              display: 'flex', justifyContent: 'flex-end', gap: 1.5,
            }}>
              <Button
                variant="contained"
                startIcon={<SaveOutlinedIcon />}
                onClick={save}
                disabled={saving}
                sx={{
                  background: NAVY, color: '#fff', textTransform: 'none',
                  fontWeight: 700, px: 3, py: 1, borderRadius: '10px',
                  '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
                }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{
            bgcolor: '#fff', border: `1px solid ${BORDER}`, borderRadius: '14px',
            p: 8, textAlign: 'center',
          }}>
            <MailOutlineRoundedIcon sx={{ fontSize: 48, color: MUTED, mb: 2 }} />
            <Typography sx={{ color: MUTED }}>Selecciona un template de la lista para editarlo</Typography>
          </Box>
        )}
      </Box>

      {/* Dialog envío de prueba */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ ...SERIF, fontWeight: 600, color: NAVY }}>
          Enviar prueba
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem', color: MUTED, mb: 2 }}>
            Se enviará un correo de prueba con los valores actuales del editor (sin guardar) y datos de ejemplo.
          </Typography>
          <TextField
            fullWidth autoFocus
            label="Email destino"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="tu@email.com"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>
          <Button variant="contained" onClick={sendTest}
            disabled={!testEmail}
            sx={{ background: NAVY, textTransform: 'none', fontWeight: 700 }}>
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* T6 — Dialog Asistente de diseño IA */}
      <Dialog open={aiOpen} onClose={() => { setAiOpen(false); discardAiResult(); }} fullWidth maxWidth="md">
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AutoAwesomeRoundedIcon />
            </Box>
            <Box>
              <Typography sx={{ ...SERIF, fontWeight: 600, color: NAVY, fontSize: '1.35rem', lineHeight: 1 }}>
                Asistente de diseño
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: MUTED, mt: 0.25 }}>
                Describe qué quieres cambiar en lenguaje natural
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {!aiResult && (
            <>
              <TextField
                fullWidth multiline minRows={3} autoFocus
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder='Ej: "haz el email más corto y cálido", "cambia el botón a morado", "agrega una lista con 3 beneficios de agendar", "usa un tono más profesional"'
                inputProps={{ maxLength: 800 }}
                sx={{ mb: 2 }}
              />
              <Typography sx={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                color: MUTED, textTransform: 'uppercase', mb: 1,
              }}>
                Ejemplos de instrucciones
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {[
                  'Hazlo más corto',
                  'Tono más cálido y cercano',
                  'Agrega un botón CTA morado',
                  'Convierte los párrafos en una lista',
                  'Añade un testimonial breve',
                  'Traduce a un tono más profesional',
                ].map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    onClick={() => setAiInstruction(s)}
                    sx={{
                      bgcolor: '#faf5ff', color: ACCENT,
                      fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500,
                      '&:hover': { bgcolor: '#f3e8ff' },
                    }}
                  />
                ))}
              </Stack>
            </>
          )}

          {aiLoading && (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <CircularProgress sx={{ color: ACCENT, mb: 2 }} />
              <Typography sx={{ fontSize: '0.9rem', color: MUTED }}>
                Diseñando tu template…
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: MUTED, mt: 0.5 }}>
                Suele tardar 3-5 segundos
              </Typography>
            </Box>
          )}

          {aiResult && !aiLoading && (
            <>
              <Alert severity="success" icon={<AutoAwesomeRoundedIcon />}
                sx={{ mb: 2, borderRadius: '10px', bgcolor: '#faf5ff', color: NAVY, '& .MuiAlert-icon': { color: ACCENT } }}>
                <strong>Cambios propuestos:</strong> {aiResult.changes}
              </Alert>

              <Typography sx={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                color: MUTED, textTransform: 'uppercase', mb: 1,
              }}>
                Nuevo subject
              </Typography>
              <Box sx={{
                p: 1.5, mb: 2, border: `1px solid ${BORDER}`, borderRadius: '8px',
                bgcolor: '#fafbfc', fontSize: '0.9rem', fontWeight: 600, color: NAVY,
              }}>
                {aiResult.subject}
              </Box>

              <Typography sx={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
                color: MUTED, textTransform: 'uppercase', mb: 1,
              }}>
                Nuevo body — vista previa
              </Typography>
              <Box sx={{
                p: 2.5, border: `1px solid ${BORDER}`, borderRadius: '12px',
                bgcolor: '#fff', maxHeight: 320, overflowY: 'auto',
                '& p': { margin: '0 0 12px' },
                '& a': { color: ACCENT, textDecoration: 'underline' },
                '& blockquote': { borderLeft: `3px solid ${ACCENT}`, pl: 2, py: 0.5, margin: '16px 0', fontStyle: 'italic' },
                '& ul': { pl: 2.5, margin: '0 0 12px' },
                '& strong': { fontWeight: 700, color: NAVY },
              }}
                dangerouslySetInnerHTML={{ __html: aiResult.body }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {!aiResult ? (
            <>
              <Button onClick={() => setAiOpen(false)} sx={{ textTransform: 'none', color: MUTED }}>
                Cancelar
              </Button>
              <Button
                onClick={runAssistant}
                disabled={aiLoading || !aiInstruction.trim()}
                variant="contained"
                startIcon={<AutoAwesomeRoundedIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`,
                  color: '#fff', textTransform: 'none', fontWeight: 700, px: 3, py: 1,
                  borderRadius: '10px',
                  '&:hover': { background: `linear-gradient(135deg, ${ACCENT}, #a855f7)`, filter: 'brightness(0.95)' },
                }}
              >
                Aplicar con IA
              </Button>
            </>
          ) : (
            <>
              <Button onClick={discardAiResult} startIcon={<CloseRoundedIcon />}
                sx={{ textTransform: 'none', color: MUTED }}>
                Descartar
              </Button>
              <Button
                onClick={() => { discardAiResult(); }}
                sx={{ textTransform: 'none', color: NAVY }}>
                Otra instrucción
              </Button>
              <Button
                onClick={applyAiResult}
                variant="contained"
                startIcon={<CheckRoundedIcon />}
                sx={{
                  background: NAVY, color: '#fff', textTransform: 'none',
                  fontWeight: 700, px: 3, py: 1, borderRadius: '10px',
                  '&:hover': { background: NAVY, filter: 'brightness(0.92)' },
                }}
              >
                Aplicar cambios
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3500} onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {snack && <Alert severity={snack.severity} onClose={() => setSnack(null)}>{snack.msg}</Alert>}
      </Snackbar>
    </Box>
  );
}
