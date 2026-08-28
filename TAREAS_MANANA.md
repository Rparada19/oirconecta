# Tareas — actualizado el 28 de agosto

Estado al cerrar el miércoles 26. Diez commits desplegados en `main`.

---

## 0. Bloqueadores de infraestructura (nada de lo demás sirve del todo sin esto)

- [ ] **Subir `oirconecta-api` a plan Starter en Render (~USD 7/mes).**
      Hoy está en free y se duerme: Meta espera pocos segundos por el webhook y
      Render tarda 50+ en despertar. El primer mensaje de WhatsApp después de
      horas de inactividad **se pierde** — y ese suele ser el del paciente nuevo.
      Los crons de recordatorios tampoco corren con la instancia dormida.
      *Decisión tuya, no la puedo tomar yo.*

- [x] ~~Verificar `OPENAI_API_KEY` y pgvector~~ — **CONFIRMADOS VIVOS.** Se
      subieron dos imágenes al Agente IA y quedaron READY con 4 pasajes.

---

## 1. Confirmar que lo de ayer quedó funcionando

- [ ] **El bot responde.** Escribir al WhatsApp y confirmar que contesta. En la
      última prueba (8:09 p.m.) todavía no lo hacía; el arreglo de reapertura se
      desplegó justo después. Verificar con la línea
      `[wa-corp] guardado ... estado=` en los logs de Render.

- [ ] **Atender la conversación de "Aural Colombia"** — cerrada, 2 mensajes sin
      leer desde el 26 a las 7:59 p.m. Es real, no una prueba.

- [ ] **Probar el RAG de punta a punta.** Subir un documento al Agente IA con un
      dato que no esté en ningún otro lado, y preguntárselo al bot. Es la única
      forma de saber si los embeddings están vivos.

---

## 2. Tema del día: flujo conversacional del bot

Lo que quedó pendiente de hablar:

- [ ] Recorrer el flujo completo: saludo → botones → rama de paciente →
      agendamiento con tools → confirmación.
- [ ] Definir qué pasa cuando el paciente se sale del guion (pregunta clínica,
      queja, urgencia).
- [ ] Revisar cuándo escala a humano. Hoy es muy restrictivo a propósito, pero
      hay que validar los tres casos con criterio clínico.
- [ ] Decidir el seguimiento: hoy el nudge entra a los 25-40 min sin agendar y
      escala a las 2 h. ¿Son los tiempos correctos?

---

## 3. Seguridad — pendiente desde la revisión, sin tocar

- [x] ~~Firma del webhook de Meta~~ — **CERRADO el 28-ago.** `META_APP_SECRET`
      configurado en Render y verificado desde afuera: POST sin firma o con
      firma falsa devuelve 403. *Ojo: si algún día rotas el App Secret, el
      webhook rechaza todo y el WhatsApp se queda mudo. Los logs dirían
      `rechazado: firma inválida` repetido.*

- [x] ~~El webhook bajo el rate limiter~~ — **CERRADO.** Ahora lo salta; el
      control de acceso es la firma.

---

## 3.b Validación de formularios — hecho el 28-ago

- [x] ~~Con escribir "5" quedabas registrado~~ — validación real de correo y
      teléfono en servidor y navegador, en /agendar, contacto, /precios y
      comparador.
- [ ] **Limpiar los datos viejos.** Lo anterior evita que entren nuevos, pero
      los contactos falsos ya registrados siguen ahí. Falta marcarlos para que
      el equipo no pierda tiempo llamándolos.

## 4. Alcance del WhatsApp

- [x] ~~Media entrante~~ — **HECHO para imágenes y PDF.** `waMedia.service` los
      descarga de Meta y el bot los lee. **Falta el audio**: las notas de voz
      siguen perdiéndose, y es el canal natural de un paciente mayor.

- [ ] **Avisar cuando llega algo a una conversación cerrada.** Ya se reabren
      solas, pero el equipo trabaja en "Abiertas" y conviene una señal explícita.

- [ ] **Pasarme la lista de precios real** (valor de la valoración, rangos de los
      planes). Hoy el bot esquiva porque le prohibí inventar cifras, y esquivar
      tres veces seguidas espanta al paciente. Con números puede anclar y
      convertir. Va en el campo "Servicios y qué incluye cada uno" del Agente IA.

- [ ] **¿Formulario propio para profesionales?** Hoy el bot los manda a
      `/precios`, cuyo copy habla de "solicitar demostración". Funciona —cae en
      Captación comercial → Leads— pero no es exactamente "quiero estar en el
      directorio".

---

## 5. Deuda técnica encontrada de paso

- [ ] **60 archivos del backend hacen `new PrismaClient()` propio** contra 11 que
      usan el cliente compartido de `src/db.js`. Dos consecuencias: no pasan por
      la extensión de AuditLog (**crear un paciente desde WhatsApp no queda
      auditado**, y es dato de salud bajo Habeas Data), y son 60 pools de
      conexiones contra Neon.

- [x] ~~El bot del directorio creaba Patient del centro propio~~ — **RESUELTO el
      28-ago** con el aislamiento multiinquilino: columna de dueño, backfill
      (ajenos 0, propios 3), y forzado central en el cliente Prisma. Falta que
      `IaConversation` también quede aislada: hoy solo se cerró el acceso del
      admin, no el almacenamiento.

- [ ] **`PatientProfileDialog.jsx` tiene 7.100 líneas** en un solo archivo.
      Debería partirse por pestaña.

- [ ] **`AccionesDiaPage` y `CRM · Seguimiento` se solapan.** Decidir si una
      absorbe a la otra.

- [ ] **`oirconecta.com/api/*` no proxea al backend** aunque `render.yaml` diga
      que sí; funciona porque el frontend llama directo a
      `oirconecta-api.onrender.com`. Revisar la regla en el panel de Render.

---

## 5.b Multitenant — deuda creada hoy a propósito

El servicio se va a ofertar a los profesionales del directorio. Lo de hoy quedó
amarrado al consultorio propio y hay que soltarlo antes de vender:

- [ ] `esConductor()` compara contra `RETAIL_PROFESSIONAL_ID` → debe ser un flag
      por perfil en `IaAgentConfig`.
- [ ] `waExamRead.service` tiene "OírConecta, centro auditivo en Bogotá" en duro.
- [ ] La lectura de exámenes cuelga del bot corporativo; si se vende debe correr
      en el pipeline compartido `iaAgent`, sobre el número de cada profesional.
- [ ] Barrer `SYSTEM_PROMPTS` por datos de Bogotá que ya deberían salir de la
      educación del perfil.

## 6. Sin resolver

- [ ] **Tu punto "2."** — lo dejaste sin decir cuando pediste no quitar Agente IA.

---

## Lo que quedó hecho el 26

CRM · Seguimiento (`/portal-crm/crm`) con búsqueda de paciente y entrada directa
a sus acciones · métricas del paciente arregladas (`findUnique` por email
reventaba en cuatro servicios) · CRM por `patientId`, ya no por correo · el
WhatsApp quedó solo para el consultorio · el bot pasó de informar a cerrar citas
· admin sin las dos pantallas de captación · Redis muerto ya no cuelga el
agendamiento · las conversaciones cerradas se reabren al escribir el paciente ·
Agente IA con el cerebro vivo y subida de documentos.
