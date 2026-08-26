/**
 * CRM · Seguimiento — acceso directo al CRM del paciente.
 *
 * Existe porque para registrar una llamada había que pasar por Pacientes,
 * abrir la ficha y buscar la pestaña CRM. Aquí se busca al paciente y se
 * entra directo a sus acciones, con el estado del seguimiento a la vista:
 * cuántos días lleva sin contacto, qué alertas tiene vencidas y qué hay
 * programado.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Avatar, IconButton, Button, Tooltip,
  CircularProgress, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import {
  History, Phone, Email, WhatsApp, WarningAmber, Refresh,
  ArrowForward, PersonSearch,
} from '@mui/icons-material';
import PageHeader from '../../components/crm/ui/PageHeader';
import KpiCard from '../../components/crm/ui/KpiCard';
import SearchBar from '../../components/crm/ui/SearchBar';
import Toolbar from '../../components/crm/ui/Toolbar';
import DataTableCard from '../../components/crm/ui/DataTableCard';
import EmptyState from '../../components/crm/ui/EmptyState';
import PatientProfileDialog from '../../components/patient/PatientProfileDialog';
import { getCrmOverview } from '../../services/interactionService';

/// Índice de la pestaña CRM dentro de PatientProfileDialog.
const CRM_TAB_INDEX = 6;

const FILTROS = [
  { key: 'todos', label: 'Todos' },
  { key: 'vencidas', label: 'Con alertas vencidas' },
  { key: 'sin-contacto', label: 'Sin contacto +30 días' },
  { key: 'nunca', label: 'Nunca contactados' },
  { key: 'proximas', label: 'Con acción programada' },
];

const RIESGO = {
  alto: { label: 'Atender ya', color: '#991b1b', bg: 'rgba(239,68,68,0.12)' },
  medio: { label: 'Enfriándose', color: '#92400e', bg: 'rgba(245,158,11,0.14)' },
  ok: { label: 'Al día', color: '#065f46', bg: 'rgba(16,185,129,0.12)' },
};

const fmtFecha = (iso) => (iso
  ? new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—');

/** Teléfono colombiano a E.164 para el enlace de WhatsApp. */
const waLink = (telefono) => {
  const digits = String(telefono || '').replace(/\D/g, '');
  if (!digits) return null;
  const e164 = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${e164}`;
};

const CrmSeguimientoPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [debounced, setDebounced] = useState(search);
  const [filtro, setFiltro] = useState('todos');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // El servidor filtra: la lista de pacientes puede ser larga y la búsqueda
  // debe encontrar también a quien no está en la primera página.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (debounced) next.set('q', debounced); else next.delete('q');
    setSearchParams(next, { replace: true });
    // searchParams se omite a propósito: solo reaccionamos al término.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCrmOverview({ search: debounced, filtro });
    setRows(res.rows);
    setTotal(res.total);
    setLoading(false);
  }, [debounced, filtro]);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => ({
    enRiesgo: rows.filter((r) => r.riesgo === 'alto').length,
    vencidas: rows.reduce((acc, r) => acc + r.alertasVencidas, 0),
    sinContacto: rows.filter((r) => r.diasSinContacto == null || r.diasSinContacto > 30).length,
    programadas: rows.filter((r) => r.proximaAccion).length,
  }), [rows]);

  const abrirCrm = (row) => {
    setSelected({
      id: row.id,
      nombre: row.nombre,
      email: row.email,
      telefono: row.telefono,
      numeroDocumento: row.numeroDocumento,
      procedencia: row.procedencia,
    });
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: '#f8fafc' }}>
      <PageHeader
        icon={History}
        title="CRM · Seguimiento"
        subtitle="Busca al paciente y entra directo a sus acciones de CRM"
        actions={(
          <Button size="small" startIcon={<Refresh />} onClick={load} sx={{ color: '#085946' }}>
            Actualizar
          </Button>
        )}
      />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          <KpiCard label="Pacientes por atender" value={kpis.enRiesgo}
            hint="Alertas vencidas o +90 días sin contacto"
            tone={kpis.enRiesgo > 0 ? 'danger' : 'success'}
            onClick={() => setFiltro('vencidas')} />
          <KpiCard label="Alertas vencidas" value={kpis.vencidas} tone="warning" />
          <KpiCard label="Sin contacto +30 días" value={kpis.sinContacto} tone="warning"
            onClick={() => setFiltro('sin-contacto')} />
          <KpiCard label="Con acción programada" value={kpis.programadas} tone="info"
            onClick={() => setFiltro('proximas')} />
        </Box>

        <Toolbar
          left={(
            <SearchBar
              value={search}
              onChange={setSearch}
              autoFocus
              placeholder="Buscar paciente por nombre, cédula, teléfono o correo…"
            />
          )}
          right={(
            <Typography sx={{ fontSize: 12.5, color: '#6b7280', whiteSpace: 'nowrap' }}>
              {loading ? 'Cargando…' : `${rows.length} de ${total} pacientes`}
            </Typography>
          )}
        />

        <ToggleButtonGroup
          size="small"
          exclusive
          value={filtro}
          onChange={(_, v) => v && setFiltro(v)}
          sx={{ mb: 2, flexWrap: 'wrap',
            '& .MuiToggleButton-root': { textTransform: 'none', fontSize: 12.5, px: 1.5, py: 0.5,
              border: '1px solid #e5e7eb', borderRadius: '999px !important', mr: 1, mb: 1 },
            '& .Mui-selected': { bgcolor: 'rgba(8,89,70,0.10) !important', color: '#085946', fontWeight: 700 } }}
        >
          {FILTROS.map((f) => (
            <ToggleButton key={f.key} value={f.key}>{f.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <DataTableCard>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={28} sx={{ color: '#085946' }} />
            </Box>
          ) : rows.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <EmptyState
                icon={PersonSearch}
                title="No hay pacientes con este filtro"
                description={search
                  ? 'Prueba con otro nombre, cédula o teléfono.'
                  : 'Cambia el filtro para ver otros pacientes.'}
              />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(8,89,70,0.04)' }}>
                    {['Paciente', 'Estado', 'Último contacto', 'Alertas', 'Próxima acción', 'Próxima cita', ''].map((h) => (
                      <TableCell key={h} align={h === '' ? 'right' : 'left'}
                        sx={{ fontWeight: 700, color: '#272F50', fontSize: '0.72rem',
                          letterSpacing: '0.06em', textTransform: 'uppercase', py: 1.5, border: 'none' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r) => {
                    const riesgo = RIESGO[r.riesgo] || RIESGO.ok;
                    const wa = waLink(r.telefono);
                    return (
                      <TableRow key={r.id}
                        sx={{ '&:hover': { bgcolor: 'rgba(8,89,70,0.025)' }, '& td': { border: 'none', py: 1.25 } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: '#085946', fontWeight: 700, fontSize: '0.85rem' }}>
                              {(r.nombre || '?').charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f1923' }}>
                                {r.nombre}
                              </Typography>
                              <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {r.telefono || 'sin teléfono'}{r.email ? ` · ${r.email}` : ''}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={riesgo.label} size="small"
                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700,
                              bgcolor: riesgo.bg, color: riesgo.color }} />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#272F50' }}>
                            {r.diasSinContacto == null ? 'Nunca' : `Hace ${r.diasSinContacto} d`}
                          </Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {r.totalContactos} contacto{r.totalContactos === 1 ? '' : 's'} · {fmtFecha(r.ultimoContacto)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {r.alertasVencidas > 0 && (
                            <Chip icon={<WarningAmber sx={{ fontSize: 14 }} />} label={`${r.alertasVencidas} vencida${r.alertasVencidas === 1 ? '' : 's'}`}
                              size="small" sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, mr: 0.5,
                                bgcolor: 'rgba(239,68,68,0.12)', color: '#991b1b' }} />
                          )}
                          {r.alertasActivas > 0 && (
                            <Chip label={`${r.alertasActivas} activa${r.alertasActivas === 1 ? '' : 's'}`} size="small"
                              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700,
                                bgcolor: 'rgba(16,185,129,0.12)', color: '#065f46' }} />
                          )}
                          {r.alertasVencidas === 0 && r.alertasActivas === 0 && (
                            <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.proximaAccion ? (
                            <>
                              <Typography sx={{ fontSize: '0.8rem', color: '#272F50', fontWeight: 600 }}>
                                {fmtFecha(r.proximaAccion.scheduledDate)}
                              </Typography>
                              <Typography sx={{ fontSize: '0.72rem', color: '#6b7280' }} noWrap>
                                {r.proximaAccion.title}
                              </Typography>
                            </>
                          ) : (
                            <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>Nada programado</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '0.8rem', color: r.proximaCita ? '#272F50' : '#94a3b8' }}>
                            {r.proximaCita ? fmtFecha(r.proximaCita.fecha) : '—'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                            {r.telefono && (
                              <Tooltip title="Llamar">
                                <IconButton size="small" component="a" href={`tel:${r.telefono}`} sx={{ color: '#085946' }}>
                                  <Phone sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {wa && (
                              <Tooltip title="WhatsApp">
                                <IconButton size="small" component="a" href={wa} target="_blank" rel="noopener noreferrer" sx={{ color: '#25D366' }}>
                                  <WhatsApp sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {r.email && (
                              <Tooltip title="Correo">
                                <IconButton size="small" component="a" href={`mailto:${r.email}`} sx={{ color: '#6b7280' }}>
                                  <Email sx={{ fontSize: 17 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Button size="small" variant="contained" endIcon={<ArrowForward sx={{ fontSize: 15 }} />}
                              onClick={() => abrirCrm(r)}
                              sx={{ bgcolor: '#085946', textTransform: 'none', fontSize: 12.5,
                                px: 1.5, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#064435' } }}>
                              Abrir CRM
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DataTableCard>
      </Container>

      <PatientProfileDialog
        open={!!selected}
        initialTab={CRM_TAB_INDEX}
        patient={selected}
        appointment={selected ? {
          id: `patient_${selected.id}`,
          patientName: selected.nombre,
          patientEmail: selected.email,
          patientPhone: selected.telefono,
          patientId: selected.id,
          status: 'patient',
        } : null}
        onClose={() => { setSelected(null); load(); }}
        onSaved={load}
      />
    </Box>
  );
};

export default CrmSeguimientoPage;
