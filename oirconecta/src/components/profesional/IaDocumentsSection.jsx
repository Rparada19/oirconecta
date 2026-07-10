/**
 * F10e — Sección "Documentos" del portal del profesional para gestionar
 * documentos que nutren al bot IA (RAG).
 *
 * Se importa en /portal-profesional/ia.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Stack, Chip, CircularProgress,
  Alert, Table, TableHead, TableBody, TableRow, TableCell, IconButton, Switch, Tooltip,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { directoryApi } from '../../services/directoryAccountApi';

const ACCENT = '#6d28d9';
const NAVY = '#0F2A4A';
const MUTED = '#64748b';
const BORDER = '#eef0f3';
const SERIF = { fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.01em' };

const STATUS_META = {
  PENDING:    { label: 'En cola',      color: '#a16207', bg: '#fef3c7' },
  PROCESSING: { label: 'Procesando…',  color: '#0369a1', bg: '#eff6ff' },
  READY:      { label: 'Listo',        color: '#15803d', bg: '#f0fdf4' },
  FAILED:     { label: 'Falló',        color: '#b91c1c', bg: '#fef2f2' },
};

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export default function IaDocumentsSection() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const load = async () => {
    try {
      const r = await directoryApi.get('/api/ia/me/agent-documents');
      if (r?.data?.success) setDocs(r.data.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Polling suave mientras hay docs en PENDING o PROCESSING
  useEffect(() => {
    const stillWorking = docs.some((d) => d.status === 'PENDING' || d.status === 'PROCESSING');
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (stillWorking) {
      pollRef.current = setInterval(() => { load(); }, 3000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [docs]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Archivo demasiado grande (máx 10 MB)');
      return;
    }
    setError(null);
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await directoryApi.post('/api/ia/me/agent-documents', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (r?.data?.success) {
        setToast('Documento en cola. El bot lo usará cuando termine de procesar.');
        await load();
      } else {
        setError(r?.data?.error || 'Error al subir');
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setUploading(false); }
  };

  const toggleActive = async (doc) => {
    try {
      await directoryApi.patch(`/api/ia/me/agent-documents/${doc.id}`, { isActive: !doc.isActive });
      await load();
    } catch (e) { setError(e.message); }
  };

  const deleteDoc = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.filename}"? El bot dejará de usarlo.`)) return;
    try {
      await directoryApi.delete(`/api/ia/me/agent-documents/${doc.id}`);
      await load();
      setToast('Documento eliminado.');
    } catch (e) { setError(e.message); }
  };

  return (
    <Card sx={{ borderRadius: '16px', border: `1px solid ${BORDER}`, boxShadow: 'none', mb: 3 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ ...SERIF, fontSize: '1.35rem', fontWeight: 600, color: NAVY, mb: 0.5 }}>
              Documentos del asistente
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: MUTED, maxWidth: 640 }}>
              Sube PDFs, Word o TXT con información propia (protocolos, catálogos de servicios, guías clínicas). El bot los usará como referencia autorizada al responder a tus pacientes.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUploadOutlinedIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700, borderRadius: '10px',
              '&:hover': { bgcolor: '#5b21b6' } }}
          >
            {uploading ? 'Subiendo…' : 'Subir documento'}
          </Button>
          <input ref={fileInputRef} type="file" hidden
            accept=".pdf,.docx,.doc,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain,text/markdown"
            onChange={onFile} />
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{error}</Alert>}
        {toast && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }} onClose={() => setToast(null)}>
            {toast}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={22} sx={{ color: ACCENT }} /></Box>
        ) : docs.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fafbfc', border: '1px dashed #e2e8f0', borderRadius: '10px' }}>
            <DescriptionOutlinedIcon sx={{ fontSize: 40, color: '#cbd5e1', mb: 1 }} />
            <Typography sx={{ fontSize: '0.9rem', color: NAVY, fontWeight: 600, mb: 0.5 }}>Aún no has subido documentos</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: MUTED }}>
              Empieza con un PDF pequeño (protocolo o guía) para probar cómo el bot lo usa.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ border: `1px solid ${BORDER}`, borderRadius: '10px', overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Archivo</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fragmentos</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Activo</TableCell>
                  <TableCell align="right"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {docs.map((d) => {
                  const st = STATUS_META[d.status] || STATUS_META.PENDING;
                  return (
                    <TableRow key={d.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600, color: NAVY, fontSize: '0.85rem' }}>{d.filename}</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: MUTED }}>
                          {fmtBytes(d.sizeBytes)} · subido el {new Date(d.createdAt).toLocaleDateString('es-CO')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={st.label} size="small"
                          sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }} />
                        {d.status === 'FAILED' && d.errorMessage && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#b91c1c', mt: 0.5, maxWidth: 200 }}>
                            {d.errorMessage}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#334155' }}>
                        {d.status === 'READY' ? `${d.chunkCount} fragmentos · ${d.totalChars.toLocaleString('es-CO')} chars` : '—'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={d.isActive ? 'El bot lo está usando' : 'Excluido del bot'}>
                          <Switch size="small" checked={d.isActive}
                            onChange={() => toggleActive(d)}
                            disabled={d.status !== 'READY'} />
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Eliminar">
                          <IconButton size="small" onClick={() => deleteDoc(d)}>
                            <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#b91c1c' }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
