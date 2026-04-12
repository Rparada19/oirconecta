# Perfiles RECEPCIÓN y AUDIÓLOGA – Alcance y flujo

Documento de planificación para la implementación de los perfiles de Recepción y Audióloga en el CRM OirConecta.

---

## 1. Estado actual

| Elemento | Estado |
|----------|--------|
| **Roles en BD** | ADMIN, VENDEDOR, AUDIOLOGA, RECEPCION, SOLO_LECTURA |
| **Portal CRM** | Todos los usuarios autenticados ven el mismo menú |
| **Protección frontend** | `ProtectedRoute` solo valida sesión, no rol |
| **Protección backend** | Algunas rutas usan `authorize('ADMIN')` (blockedSlots, campañas, leads) |
| **Páginas del portal** | Dashboard, Citas, Leads, Pacientes, Campañas, Reportes, Configuración |

---

## 2. Perfil RECEPCIÓN

### 2.1 Objetivo
Apoyar la gestión operativa del día a día: agenda, citas, atención de consultas y soporte a pacientes.

### 2.2 Alcance funcional

| Módulo | Acceso | Permisos |
|--------|--------|----------|
| **Dashboard** | ✅ | Vista general: citas del día, leads recientes, métricas básicas |
| **Citas** | ✅ | Crear, editar, cancelar, reagendar. Ver agenda por sede/consultorio. Registrar asistencia/no asistencia. Sin aprobar bloqueos. |
| **Leads** | ✅ | Crear, editar, contactar, convertir a cita. Solo lectura en campañas. |
| **Pacientes** | ✅ | Ver perfil, citas, historial. Editar datos básicos (contacto). No registrar ventas ni cotizaciones. |
| **Campañas** | 👁️ Solo lectura | Ver campañas activas. Sin crear/editar. |
| **Reportes** | ⚠️ Parcial | Solo Citas, Leads, Agenda. Sin Ventas ni Configuración. |
| **Configuración** | ❌ | Sin acceso |

### 2.3 Flujo típico – Recepción

```
Lead entra (web/llamada) 
    → Recepción crea/actualiza lead
    → Recepción agenda cita (selecciona profesional, sede, slot)
    → Paciente asiste → Recepción marca asistencia
    → Paciente no asiste → Recepción marca no-show / reagenda
    → Recepción puede ver perfil paciente (datos básicos, citas)
    → Ventas/cotizaciones las maneja Audióloga o Vendedor
```

### 2.4 Restricciones backend sugeridas

- Leads: `authorize('ADMIN', 'RECEPCION')` para CRUD
- Appointments: acceso completo para RECEPCION
- Products (ventas/cotizaciones): `authorize('ADMIN', 'VENDEDOR', 'AUDIOLOGA')` – no RECEPCION
- Blocked slots: RECEPCION puede solicitar; solo ADMIN aprueba

---

## 3. Perfil AUDIÓLOGA

### 3.1 Objetivo
Enfocarse en la parte clínica y comercial: pacientes, evaluaciones, cotizaciones y ventas.

### 3.2 Alcance funcional

| Módulo | Acceso | Permisos |
|--------|--------|----------|
| **Dashboard** | ✅ | Métricas de citas, ventas propias, ocupación |
| **Citas** | ✅ | Ver agenda, sus citas asignadas. Crear/editar si está asignada. Registrar resultados de consulta. |
| **Leads** | ✅ | Ver leads. Convertir a cita. Seguimiento en conversión. |
| **Pacientes** | ✅ | Acceso completo: perfil, historia clínica, cotizaciones, ventas. Registrar ventas y cotizaciones. |
| **Campañas** | ✅ CRUD | Crear, editar y gestionar campañas (cuando es dueña de su clínica/consultorio) |
| **Reportes** | ⚠️ Parcial | Citas (filtradas por profesional), Ventas propias, Pacientes. Sin Configuración. |
| **Configuración** | ❌ | Sin acceso |

### 3.3 Flujo típico – Audióloga

```
Recepción agenda cita con Audióloga X
    → Audióloga X ve su agenda (solo sus citas)
    → Atiende paciente → Registra notas de consulta / historia clínica
    → Crea cotización si corresponde
    → Registra venta cuando se cierra
    → Ve reportes de sus ventas y citas
    → No ve ni modifica configuración ni campañas
```

### 3.4 Restricciones backend sugeridas

- Appointments: acceso a todas las citas o solo las asignadas a su `professionalId` (según lógica de negocio)
- Products: `authorize('ADMIN', 'VENDEDOR', 'AUDIOLOGA')`
- Patient records / consultas: `authorize('ADMIN', 'AUDIOLOGA')`
- Reportes ventas: filtrar por `professionalId` del usuario cuando es AUDIOLOGA

---

## 4. Flujo de conexión entre perfiles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ENTRADA DE DATOS                               │
├─────────────────────────────────────────────────────────────────────────┤
│  Web (formulario)  │  Llamada  │  Visita  │  Campaña marketing          │
└─────────────────────────┬───────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  RECEPCIÓN                                                               │
│  • Crea/actualiza Lead                                                   │
│  • Agenda cita (elige profesional, sede, horario)                        │
│  • Marca asistencia / no asistencia / cancelación                        │
└─────────────────────────┬───────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AUDIÓLOGA (o Vendedor)                                                  │
│  • Atiende cita                                                          │
│  • Registra historia clínica / notas                                     │
│  • Crea cotización                                                       │
│  • Registra venta                                                        │
└─────────────────────────┬───────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ADMIN                                                                   │
│  • Configura sedes, profesionales, marketplace                           │
│  • Gestiona campañas                                                     │
│  • Reportes globales                                                     │
│  • Aprobación de bloqueos                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Puntos de cruce

| Punto | RECEPCIÓN | AUDIÓLOGA | ADMIN |
|-------|-----------|-----------|-------|
| **Lead → Cita** | Crea cita desde lead | Puede convertir lead a cita | Puede todo |
| **Cita atendida** | Marca asistencia | Registra consulta, venta | Puede todo |
| **Paciente** | Datos básicos, citas | Historia clínica, ventas | Configuración y todo |

---

## 5. Consideraciones técnicas para implementación

### 5.1 Frontend

1. **PortalCRMPage**: filtrar `menuItems` por rol del usuario.
2. **ProtectedRoute** (o nuevo componente): `ProtectedRouteByRole allowedRoles={['ADMIN','RECEPCION']}`.
3. **Páginas con restricción parcial**:
   - ReportesPage: ocultar pestañas según rol.
   - PacientesPage / PatientProfileDialog: ocultar o deshabilitar ventas/cotizaciones para RECEPCION.
   - CitasPage: permitir agenda completa a RECEPCION; a AUDIOLOGA mostrar solo sus citas.
4. **AuthContext**: asegurar que `user.role` venga del login y se use en toda la app.

### 5.2 Backend

1. Revisar y unificar `authorize()` en todas las rutas.
2. Agregar `professionalId` a User si la audióloga debe vincularse a un profesional de configuración.
3. Filtrar datos en consultas por rol (ej. ventas por `professionalId` para AUDIOLOGA).

### 5.3 Vinculación User ↔ Profesional

- Opción A: campo `professionalId` en User (relación con config).
- Opción B: mapeo por email o por `nombre` entre User y profesional en config.
- Permite filtrar agenda y reportes de la audióloga por su profesional.

---

## 6. Resumen de tareas (para mañana)

- [ ] Crear mapeo de roles → menú en `PortalCRMPage`
- [ ] Implementar `ProtectedRouteByRole` o equivalente
- [ ] Aplicar restricciones por rol en ReportesPage
- [ ] Aplicar restricciones en PatientProfileDialog (ventas/cotizaciones)
- [ ] Aplicar restricciones en CitasPage (vista agenda según rol)
- [ ] Revisar y actualizar `authorize()` en rutas del backend
- [ ] Definir y aplicar vinculación User ↔ Profesional para AUDIOLOGA
- [ ] Probar flujo completo: Recepción agenda → Audióloga atiende y vende
