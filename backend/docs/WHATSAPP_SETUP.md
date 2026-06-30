# WhatsApp multi-tenant — Setup operativo

Toda la infraestructura ya está en código. Para **activar** WhatsApp para los profesionales Plan 3 hace falta:

## 1. Cuenta Meta Business (una vez para todo OírConecta)

1. Crear cuenta en [business.facebook.com](https://business.facebook.com) a nombre de OírConecta.
2. Verificar negocio (Meta pide RUT/certificado existencia, toma 2–4 semanas).
3. En **Configuración del negocio → Cuentas → WhatsApp Accounts** crear una *WABA* (WhatsApp Business Account).
4. En **Cuentas de aplicaciones → Crear aplicación** → tipo "Business". Anotar **App ID** y **App Secret**.

## 2. Token de sistema (no expira)

1. En Meta Business → **Usuarios → Usuarios del sistema** → crear uno "OirConecta API".
2. Asignar la WABA y la App al usuario de sistema con permisos *Administrar*.
3. Generar token de acceso permanente con scope `whatsapp_business_messaging` + `whatsapp_business_management`.
4. Copiar el token (solo se muestra una vez).

## 3. Configurar env vars en Render → `oirconecta-api` → Environment

```
META_WEBHOOK_VERIFY_TOKEN=<inventa-uno-largo-y-aleatorio>
WHATSAPP_ACCESS_TOKEN=<token-de-sistema-del-paso-2>
WHATSAPP_API_VERSION=v21.0    # opcional
```

> Nota: el token es global a todos los profesionales (es un token de sistema de OirConecta como BSP). Lo que cambia por profesional es el `phoneNumberId` que se envía en cada request.

## 4. Configurar webhook en Meta

1. En la App de Meta → **WhatsApp → Configuración → Webhooks** → Editar.
2. Callback URL: `https://oirconecta-api.onrender.com/api/webhooks/meta-whatsapp`
3. Verify token: el mismo de `META_WEBHOOK_VERIFY_TOKEN`.
4. Click *Verificar y guardar* — debe responder 200 con el challenge.
5. Suscribirse al campo `messages`.

## 5. Por cada profesional Plan 3

a) Agregar su número a la WABA (Meta → WhatsApp → Phone Numbers → Add). Requiere SMS o llamada al número para verificar.

b) Anotar el `phone_number_id` que Meta genera (no es el número visible).

c) Registrar el canal vía la API (desde el portal del profesional o un endpoint admin):

```bash
PUT /api/professional-agenda/me/whatsapp
{
  "phoneNumberId": "1234567890123",      # ID de Meta, no el número
  "phoneNumberE164": "573157939569",     # número visible sin '+'
  "wabaId": "9876543210",
  "displayName": "Dra. Angelica · OirConecta",
  "active": true
}
```

d) (Opcional admin) `POST /api/subscriptions/admin/:profileId/whatsapp/verify` para marcarlo verificado.

## 6. Aprobar plantillas

Las plantillas para confirmación y recordatorios ya están seedadas en `notification_templates` (`cita_agendada`, `recordatorio_24h`, etc.). Para que Meta las acepte hay que registrarlas también en **Meta → WhatsApp → Templates** con el mismo nombre, idioma `es_CO`, y placeholders coincidentes con el `bodyParams` del código.

Mientras no estén aprobadas, los recordatorios outbound fallan con `META_132001` ("template not found"). El chat conversacional **sí funciona sin plantillas** (usa mensajes de texto libre dentro de la ventana de 24h tras respuesta del paciente).

## 7. Costos esperados (Colombia 2026)

| Tipo conversación | Quién inicia | Costo |
|---|---|---|
| Service | Paciente | Gratis |
| Utility (recordatorios) | OírConecta | ~$50 COP / conv |
| Marketing | OírConecta | ~$260 COP / conv |

Para Plan 3 con 300 conv/mes (mayoría service + algunas utility): **~$5,000–15,000 COP / mes por profesional**. Margen del plan ($120k): ~85%.

## 8. Probar end-to-end

1. Profesional Plan 3 configura su canal (paso 5).
2. Un paciente escribe al número visible del profesional vía WhatsApp.
3. Meta envía POST al webhook → `processIncomingEvent` resuelve el `profileId` por `phoneNumberId` → llama `iaAgent.chat()` → responde por WhatsApp.
4. Verificar en `ia_conversations` que se creó una conversación con `channel='whatsapp'`.
5. Verificar en `ia_messages` que aparece el wamid en `externalMessageId` del mensaje del paciente (dedup).
