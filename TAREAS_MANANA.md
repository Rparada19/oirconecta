# Tareas — jueves 27 de agosto de 2026

Estado al cerrar el miércoles 26. Diez commits desplegados en `main`.

---

## 0. Bloqueadores de infraestructura (nada de lo demás sirve del todo sin esto)

- [ ] **Subir `oirconecta-api` a plan Starter en Render (~USD 7/mes).**
      Hoy está en free y se duerme: Meta espera pocos segundos por el webhook y
      Render tarda 50+ en despertar. El primer mensaje de WhatsApp después de
      horas de inactividad **se pierde** — y ese suele ser el del paciente nuevo.
      Los crons de recordatorios tampoco corren con la instancia dormida.
      *Decisión tuya, no la puedo tomar yo.*

- [ ] **Verificar `OPENAI_API_KEY` en Render.**
      Sin ella los documentos que subas al Agente IA se procesan y se marcan
      "aprendido", pero los vectores salen en cero y el bot **no recupera nada**.
      Se vería funcionando sin funcionar.

- [ ] **Verificar la extensión `vector` (pgvector) en Neon.**
      Si no está, los pasajes no se guardan. En el Postgres local no existe.

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

- [ ] **El webhook no verifica la firma de Meta.** No hay `X-Hub-Signature-256`
      ni `APP_SECRET`. Cualquiera que conozca la URL puede inventar mensajes
      entrantes, hacer que el bot responda (gastando tokens de Claude) y
      **confirmar citas ajenas**: el handler acepta `confirm_appt:<token>` sin
      más validación que el propio payload. *Es lo más urgente de esta lista.*

- [ ] **El webhook cae bajo el rate limiter anónimo** (200 req/15 min por IP).
      Un pico legítimo de Meta puede recibir 429 y perder mensajes de pacientes
      sin dejar rastro. Debe saltarse el limiter.

---

## 4. Alcance del WhatsApp

- [ ] **La media entrante se pierde.** Audios e imágenes se guardan como el texto
      literal `[audio]` / `[image]`; `mediaUrl` y `mediaMimeType` existen en el
      modelo y nunca se llenan. Un paciente mayor que manda una nota de voz, o la
      foto de su audiograma: en el CRM no se ve nada.

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

- [ ] **`whatsappAgent.service.js` crea `Patient`** para cualquiera que le escriba
      al bot de un profesional del directorio. Mezcla los dos negocios: quien
      escribe al directorio es un cliente, no un paciente del centro. Toca datos
      existentes — hablarlo antes de mover nada.

- [ ] **`PatientProfileDialog.jsx` tiene 7.100 líneas** en un solo archivo.
      Debería partirse por pestaña.

- [ ] **`AccionesDiaPage` y `CRM · Seguimiento` se solapan.** Decidir si una
      absorbe a la otra.

- [ ] **`oirconecta.com/api/*` no proxea al backend** aunque `render.yaml` diga
      que sí; funciona porque el frontend llama directo a
      `oirconecta-api.onrender.com`. Revisar la regla en el panel de Render.

---

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
