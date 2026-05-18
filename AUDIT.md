# Auditoría técnica OírConecta — Plan rumbo "Airbnb de la salud auditiva"

**Fecha:** 2026-05-17 · **Rama:** `claude/condescending-galileo-f1e011` · **Alcance:** auditoría sin cambios de código.

---

## 1. Estado actual (resumen)

| Capa | Stack | Estado |
|---|---|---|
| Frontend | React 18 + Vite 6 + MUI 5 + Tailwind 4, ~50 páginas | Funcional; deuda técnica alta |
| Backend | Node + Express + Prisma 5 + Postgres (Neon) | Funcional; 2 bugs críticos detectados |
| Auth | JWT separado CRM (`User`) y directorio (`DirectoryAccount`) | ✅ Bien aislado |
| Hosting | DreamHost (front) + Render (API) + Neon (DB) | Una sola DB compartida |

Modelos existentes: `User`, `DirectoryAccount`, `DirectoryProfile`, `DirectoryWorkplace`, `DirectoryInquiry`, `BlockedSlot`, `Lead`, `Patient`, `Maintenance`, `Interaction`, `Appointment`, `Consultation`, `Campaign`, `Quote`, `QuoteHistory`, `Sale`, `BlogPost`, `MarketplaceListing`.

---

## 2. Hallazgos críticos (rompen producción ahora)

### 🔴 C1 — `blog.routes.js` import roto
`const { authenticateToken } = require('../middleware/auth')` — el middleware exporta `authenticate`, no `authenticateToken`. **Todos los endpoints admin del blog (POST/PATCH/DELETE) devuelven 500.**
**Fix:** renombrar a `authenticate`. [backend/src/routes/blog.routes.js:4](backend/src/routes/blog.routes.js)

### 🔴 C2 — `marketplace.routes.js` doble import roto
- Importa `authenticateToken` y `authenticateDirectoryAccount` de `../middleware/auth`; el segundo vive en `directoryAuth.js`. → **TODOS** los endpoints del marketplace caen.
- Usa `req.account.id`; el middleware setea `req.directoryAccount`.
**Fix:** corregir imports y referencias. [backend/src/routes/marketplace.routes.js:4](backend/src/routes/marketplace.routes.js)

### 🟡 C3 — Sin code splitting
[oirconecta/src/App.jsx](oirconecta/src/App.jsx) importa estáticamente ~50 páginas (CRM, directorio, 14 marcas de audífonos, 3 implantes). Cualquier visitante descarga ~1MB+ aunque solo vea la home. → Tiempo de carga móvil malo, SEO penalizado.

### 🟡 C4 — SEO en SPA roto
- Meta tags y JSON-LD fijos en `index.html` → cada ruta tiene el mismo `<title>` y descripción al crawler que no ejecuta JS.
- `react-helmet` usado solo en 10 de ~50 páginas (no en home, directorio, admin, perfiles).
- **No existen** `public/robots.txt` ni `public/sitemap.xml`.

### 🟡 C5 — 14 páginas de marca casi idénticas
Cada `AudifonosWidexPage.jsx`, `AudifonosOticonPage.jsx`, etc., son ~320 LOC con la misma estructura y solo cambia el `data`. → ~4500 LOC duplicadas; cualquier cambio de diseño implica tocar 14 archivos.

### 🟡 C6 — Páginas monolíticas
- `CitasPage.jsx`: 3122 LOC
- `DirectorioProfesionalPage.jsx`: 2068 LOC
- `LeadsPage.jsx`: 1873 LOC
- `ProfessionalProfilePage.jsx`: 1619 LOC

Sin sub-componentes, difícil mantener.

### 🟡 C7 — Campo `profesion` libre y sin normalización
`DirectoryProfile.profesion String?` permite cualquier valor. Buscar "fonoaudiólogo" no encuentra "Fonoaudióloga", "fonoaudiologa", "fono". → Búsqueda rota en la práctica.

---

## 3. Gaps frente a la visión (Airbnb de salud auditiva)

### Modelos que NO existen y la visión requiere

| Modelo | Para qué |
|---|---|
| `Profession` (lookup + sinónimos + slug) | Normalización canónica de fonoaudiólogo/audiólogo/otólogo/otorrino |
| `Review` (rating, comentario, autor, status, profileId) | Reseñas de profesionales |
| `Report` | Reportes/denuncias contra perfiles |
| `RankingScore` (campo calculado en `DirectoryProfile`) | Posicionamiento por calificación + actividad + conversión |
| `Brand` | 14 audífonos + 5 implantes + accesorios |
| `Category` / `Subcategory` | Audífonos / Implantes / Accesorios / Consumibles |
| `Product` | Catálogo transaccional |
| `ProductMedia` | Imágenes oficiales |
| `Order` / `OrderItem` / `Payment` | Marketplace transaccional |
| `MarketingAsset` (Popup, Banner, Landing) | Módulo marketing |
| `EmailCampaign` / `SmsCampaign` con `Recipient` y métricas reales (impresiones, CTR, conversiones) | Marketing campaigns |
| `NewsletterSubscriber` | Newsletter |
| `SponsoredPlacement` | Destacados pagos |
| `City` (lookup) | "Destacados por ciudad" |
| `ProfileView` (log de visitas) | Métrica "más consultados" |

### Funcionalidad faltante

- Portal profesional **autoadministrable** completo (existe esqueleto en `pages/profesional/`, falta wiring real con backend para fotos, horarios, servicios).
- Flujo de **aprobación/rechazo/solicitud de ajustes** desde admin (existe `adminSetStatus` pero sin "request changes" ni notificaciones por email).
- **Reseñas + ranking** (0% implementado).
- **Marketplace transaccional** (solo hay `MarketplaceListing` = servicios de profesionales, no productos de marcas con carrito/checkout).
- Páginas de **marca administrables** desde admin (hoy son hardcodeadas en JSX).
- Módulo **marketing** completo (popups, banners, emailing, sms, métricas).
- **Dashboards** con KPIs + export Excel/CSV/PDF (existe `xlsx` y `html2pdf.js` instalados; usar).
- **Búsqueda potente** (hoy filtra por profesión libre, ciudad, póliza — falta geolocalización, rango precio, modalidad, rating mínimo, "cerca de mí").

---

## 4. Plan faseado (recomendado)

Cada fase es entregable y deployable. Tiempo estimado en sesiones de trabajo enfocadas (no días calendario).

### Fase 0 — Hotfixes + cimientos (1 sesión)
- Fix C1 y C2 (imports rotos blog/marketplace).
- Crear `public/robots.txt` y `public/sitemap.xml` (estático inicial).
- Configurar Prisma `multiSchema` con schemas `crm`, `directory`, `public_site`. Migración no destructiva: cada modelo recibe `@@schema(...)` y Prisma genera la migración de movimiento de tablas.
- Lazy-load todas las páginas del CRM y de marca con `React.lazy` + `Suspense`. Esperado: bundle inicial cae 60-70%.

### Fase 1 — Directorio Airbnb-grade (3 sesiones)
**Modelos nuevos:** `Profession` (con `slug`, `nombreCanonico`, `sinonimos String[]`), `Review`, `Report`, `City`, `ProfileView`.
**Schema:** `directory.*`.
**Cambios:**
- Migración: convertir `DirectoryProfile.profesion` a `professionId` (lookup). Seed con las 4 profesiones + sinónimos.
- Función `normalizeProfesion(input)` en backend que mapea cualquier variante al slug canónico (búsqueda y registro).
- `Review` con moderación admin (`PENDING/APPROVED/REJECTED/REPORTED`). Solo `APPROVED` cuentan al ranking.
- Campo calculado `rankingScore` (job/trigger) = `0.4 * ratingPromedio + 0.2 * log(reseñasAprobadas) + 0.2 * completitudPerfil + 0.1 * conversiones30d + 0.1 * actividad30d`.
- Endpoints: `GET /api/directory/search` con `sort=ranking|recent|rating|distance`, `minRating`, `modalidad`.
- Endpoints destacados: `/api/directory/featured`, `/featured/by-city/:slug`, `/sponsored`.
- Portal profesional autoadministrable: completar `pages/profesional/` (perfil con upload de fotos, horarios visuales tipo calendario, servicios, modalidad).
- Flujo admin aprobación: nuevos endpoints `POST /admin/profiles/:id/request-changes` con mensaje + email al profesional.
- Cards públicas tipo Airbnb (imagen, rating, ciudad, profesión, precio desde, modalidad).

### Fase 2 — Marketplace transaccional + Marcas (4 sesiones)
**Modelos nuevos:** `Brand`, `Category`, `Product`, `ProductMedia`, `ProductVariant`, `Order`, `OrderItem`, `Payment`, `Cart`.
**Schema:** `public_site.*`.
- Migrar páginas hardcodeadas de marca a `Brand` + `Product` + `ProductMedia`. Una sola página template `<BrandPage brand={data}>` reemplaza las 14 actuales (elimina ~4500 LOC).
- Carrito persistido por sesión + checkout. Integración con pasarela (recomiendo **Wompi** para Colombia, fallback Stripe). **NOTA:** la pasarela requiere KYC y cuenta — decisión a parte.
- Admin de marcas/productos/categorías en `/portal-admin/marcas`, `/portal-admin/productos`.
- 14 marcas audífonos + 5 implantes (Cochlear, Advanced Bionics, MED-EL, Oticon Medical, Nurotron) + accesorios.

### Fase 3 — Marketing + dashboards (3 sesiones)
**Modelos nuevos:** `MarketingAsset` (kind: POPUP/BANNER/LANDING), `EmailCampaign`, `SmsCampaign`, `CampaignRecipient`, `CampaignEvent` (sent/delivered/opened/clicked/converted), `NewsletterSubscriber`, `SponsoredPlacement`.
**Schema:** `public_site.*`.
- Editor de popups/banners en admin (CTA, segmentación por página, fecha inicio/fin, A/B).
- Email/SMS con plantillas (Resend para email, Twilio o Movistar para SMS — decisión).
- Métricas: impresiones, CTR, leads, conversiones, ROI; agregación por ciudad/profesión/dispositivo.
- Dashboard admin: gráficas con Recharts (ya estilísticamente coherente con MUI) o Tremor. Export Excel (`xlsx` ya instalado), CSV y PDF (`html2pdf.js` ya instalado).

### Fase 4 — Educación, blog avanzado, SEO técnico (2 sesiones)
- Blog avanzado: categorías, tags, autor real, related posts, lectura ~ min, comentarios moderados.
- SEO técnico:
  - `react-helmet` en todas las páginas con título/descripción/canonical únicos.
  - `sitemap.xml` dinámico (script Node que arma desde DB: blog publicados + profesionales aprobados + marcas + productos).
  - JSON-LD por tipo: `MedicalBusiness` por profesional, `Article` por blog, `Product` por audífono, `BreadcrumbList`.
  - Pre-render selectivo de páginas críticas con `vite-plugin-prerender` o migrar a Next.js (decisión grande — ver §6).
- Páginas educativas: tópicos audición, pérdida auditiva, audífonos, implantes, accesorios.

### Fase 5 — Refactor y hardening (2 sesiones)
- Romper páginas >800 LOC en sub-componentes.
- Audit de a11y (WCAG AA) — relevante porque el público objetivo tiene discapacidad auditiva, posiblemente con accesibilidad reducida en otras áreas.
- Tests E2E críticos (Playwright): registro profesional, búsqueda directorio, checkout, login CRM.
- Rate limit con Redis (Upstash) para escalar.
- Imágenes: optimización + `loading="lazy"` + Cloudinary o equivalente.

**Total estimado:** ~15 sesiones de trabajo enfocado distribuidas en 6-10 semanas calendario, según disponibilidad.

---

## 5. Decisiones arquitectónicas

### 5.1 Separación CRM/Directorio/Web pública
**Decisión:** una sola Postgres, tres schemas (`crm`, `directory`, `public_site`).
**Por qué:** aislamiento lógico real (queries cruzadas explícitas), un solo deploy, costo Neon estable, backups simples. Prisma 5+ soporta `multiSchema`. No requiere migrar de proveedor.

### 5.2 Modelos compartidos
- `User` (CRM) y `DirectoryAccount` (directorio) ya están separados ✅.
- `Patient` y `Lead` viven solo en `crm`.
- `Appointment` se queda en `crm` pero mantiene FK opcional a `DirectoryProfile` (directorio) para trackear "vino del directorio público".

### 5.3 Pasarela de pago
Wompi (Colombia, MasterCard/Visa/PSE/Nequi/Daviplata). Render + Wompi probados. KYC requiere certificado RUT + cuenta bancaria empresarial OírConecta — bloqueo externo, no técnico.

### 5.4 Email/SMS transaccional
- **Email:** Resend (mejor DX) o AWS SES (más barato a escala). Decisión depende de volumen estimado.
- **SMS:** Twilio (caro) o Vonage. En Colombia, considerar **LabsMobile** o **Hablame**.

### 5.5 Búsqueda
Para Fase 1 basta Postgres + `pg_trgm` (similitud) + índices. Si llega a >50k perfiles o búsqueda semántica, migrar a Meilisearch o Algolia.

### 5.6 SPA vs SSR
Migrar a Next.js daría SEO real (SSR/SSG) sin parches de helmet ni prerender. **Costo:** reescritura de routing, ~1 fase extra. **Recomendación:** posponer hasta Fase 4. Si SEO orgánico es prioridad de negocio en los próximos 3 meses, hacerlo antes de Fase 2.

---

## 6. Checklist de seguridad

| Item | Estado |
|---|---|
| Helmet activo | ✅ |
| Rate limit en prod | ✅ (in-memory; escalar a Redis en F5) |
| JWT secret diferentes CRM/directorio | ✅ |
| Validación con `express-validator` | ✅ parcial (algunos endpoints sin validar — blog y marketplace usan body crudo) |
| Documento identidad protegido | ⚠️ Verificar que no se expone en `publicSearch`/`publicProfileById` |
| CORS restringido en prod | ✅ |
| Helmet CSP custom | ❌ default; en F5 endurecer |
| Logs de auditoría (quién aprobó/rechazó perfil) | ✅ campo `reviewedByCrmUserId` |
| 2FA admin | ❌ |
| Backups Neon | ✅ provisto por Neon |

---

## 7. Próximos pasos sugeridos

1. **Confirmar Fase 0** como siguiente entrega: hotfixes + multiSchema + lazy-load. 1 sesión.
2. Después de Fase 0, decidir si arrancamos Fase 1 (directorio + ranking) o priorizamos otro entregable de negocio (ej. marketplace primero por revenue).
3. Decisiones bloqueantes externas: Wompi (KYC), proveedor email/SMS, Next.js sí/no.

---

## 8. Archivos clave referidos en la auditoría

- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — 709 LOC, 18 modelos
- [backend/src/routes/blog.routes.js](backend/src/routes/blog.routes.js) — 🔴 import roto
- [backend/src/routes/marketplace.routes.js](backend/src/routes/marketplace.routes.js) — 🔴 import roto
- [backend/src/routes/directory.routes.js](backend/src/routes/directory.routes.js) — base sólida del directorio
- [backend/src/middleware/auth.js](backend/src/middleware/auth.js)
- [backend/src/middleware/directoryAuth.js](backend/src/middleware/directoryAuth.js)
- [oirconecta/src/App.jsx](oirconecta/src/App.jsx) — 50 imports estáticos, candidato a lazy-load
- [oirconecta/index.html](oirconecta/index.html) — SEO estático
- [oirconecta/src/pages/AudifonosWidexPage.jsx](oirconecta/src/pages/AudifonosWidexPage.jsx) — patrón duplicado x14
- [oirconecta/src/pages/crm/CitasPage.jsx](oirconecta/src/pages/crm/CitasPage.jsx) — 3122 LOC, monolítica

---

## 9. Estado Fase 0 (✅ entregado)

| Item | Estado | Archivo |
|---|---|---|
| Fix C1 — blog.routes.js import roto | ✅ | [backend/src/routes/blog.routes.js](backend/src/routes/blog.routes.js) |
| Fix C2 — marketplace.routes.js imports + `req.account` | ✅ | [backend/src/routes/marketplace.routes.js](backend/src/routes/marketplace.routes.js) |
| `public/robots.txt` | ✅ | [oirconecta/public/robots.txt](oirconecta/public/robots.txt) |
| `public/sitemap.xml` estático | ✅ | [oirconecta/public/sitemap.xml](oirconecta/public/sitemap.xml) |
| Lazy-load de páginas (`React.lazy` + `Suspense`) | ✅ | [oirconecta/src/App.jsx](oirconecta/src/App.jsx) |
| Prisma `multiSchema` activado + `@@schema` en todos los modelos/enums | ✅ schema validado | [backend/prisma/schema.prisma](backend/prisma/schema.prisma) |
| `npm run build` frontend | ✅ Build limpio, chunks por página generados | — |
| `prisma validate` | ✅ Schema válido | — |

### Resultado lazy-load (verificado)
Bundle inicial: ~545 kB (gz 171 kB). Cada página ahora es su propio chunk (ej. `CitasPage` 75 kB, `AudifonosWidexPage` 14 kB, etc.). Antes todo se cargaba en un único bundle.

### ⚠️ Migración multiSchema — pendiente de aplicar a la DB

El schema declara `schemas = ["crm", "directory", "public_site"]` pero la DB en Neon todavía tiene todas las tablas en `public`. Prisma generará una migración que ejecutará `ALTER TABLE ... SET SCHEMA ...` para cada tabla. **No la apliqué automáticamente para evitar romper prod.**

**Pasos para aplicar (cuando estés listo):**

1. Backup primero:
   ```bash
   # Desde Neon dashboard: snapshot / branch antes de migrar.
   ```

2. En local con copia de la BD de prod:
   ```bash
   cd backend
   npx prisma migrate dev --name multi_schema_setup --create-only
   ```
   Prisma generará el SQL. Revísalo: debe contener `CREATE SCHEMA "crm"`, `CREATE SCHEMA "directory"`, `CREATE SCHEMA "public_site"` y `ALTER TABLE public.<tabla> SET SCHEMA <schema>` para cada modelo.

3. Aplicar a prod (Neon) con ventana de mantenimiento corta:
   ```bash
   DATABASE_URL="<neon-prod-url>" npx prisma migrate deploy
   ```

4. Redesplegar backend (Render) — el cliente Prisma generado ya conoce los schemas.

5. Si algo falla, restaurar desde el branch/snapshot de Neon.

**Tiempo estimado de migración:** segundos en tablas pequeñas (ningún dato se mueve, solo metadata).

### Próxima fase

Cuando confirmes que migraste multiSchema a prod sin incidentes, podemos arrancar **Fase 1: Directorio + Portal Profesional Airbnb-grade** (normalización profesiones, reseñas, ranking, flujo aprobación).

---

## 10. Fase 1 — Directorio Airbnb-grade (backend entregado, frontend pendiente)

**Rama:** `fase-1-directorio`. Lista para PR cuando se aplique la migración SQL.

### Modelos nuevos
| Modelo | Para qué |
|---|---|
| `Profession` | Catálogo canónico (4 profesiones + sinónimos) |
| `City` | Catálogo (15 ciudades de Colombia con coordenadas) |
| `Review` | Reseñas con moderación (`PENDING/APPROVED/REJECTED/REPORTED`) |
| `Report` | Reportes contra perfil o reseña |
| `ProfileView` | Log de visitas (para `viewsCount30d` y "más consultados") |

### Cambios en `DirectoryProfile`
- `professionId` (FK → `professions`) + `cityId` (FK → `cities`).
- Cache: `ratingAvg`, `reviewsCount`, `viewsCount30d`, `completeness` (0-100), `rankingScore`.
- Destacados: `isFeatured`, `isSponsored`, `sponsoredUntil`.
- Estado nuevo `NEEDS_CHANGES` + campo `needsChangesNote`.

### Endpoints nuevos
| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/directory/professions` | Catálogo público |
| GET | `/api/directory/cities` | Catálogo público |
| GET | `/api/directory/featured` | Destacados generales |
| GET | `/api/directory/featured/by-city/:slug` | Por ciudad |
| GET | `/api/directory/featured/by-profession/:slug` | Por profesión |
| GET | `/api/directory/sponsored` | Placements pagados |
| GET | `/api/directory/search-v2` | Búsqueda con `q`, `professionSlug`, `citySlug`, `modalidad`, `minRating`, `poliza`, `sort=ranking|rating|reviews|recent` |
| POST | `/api/directory/profiles/:id/views` | Registrar visita |
| POST | `/api/directory/profiles/:id/reviews` | Enviar reseña (público) |
| GET | `/api/directory/profiles/:id/reviews` | Listar reseñas aprobadas |
| POST | `/api/directory/reviews/:id/report` | Reportar reseña |
| POST | `/api/directory/profiles/:id/report` | Reportar perfil |
| GET | `/api/directory/admin/reviews` | Moderación (admin) |
| PATCH | `/api/directory/admin/reviews/:id` | Aprobar/rechazar reseña |
| GET | `/api/directory/admin/reports` | Lista de reportes |
| PATCH | `/api/directory/admin/reports/:id` | Resolver/desestimar |
| PATCH | `/api/directory/admin/profiles/:accountId` | Ahora acepta `status=NEEDS_CHANGES` + `needsChangesNote` |

### Ranking
[backend/src/services/ranking.service.js](backend/src/services/ranking.service.js)
```
rankingScore = 0.4 ratingNorm + 0.2 reviewsNorm + 0.2 completenessNorm + 0.1 viewsNorm + 0.1 activityNorm
```
Se recalcula al guardar perfil (en `updateMyDirectoryProfile`). Completeness se infiere de 12 señales del perfil.

### Normalización de profesiones
[backend/src/utils/normalizeProfesion.js](backend/src/utils/normalizeProfesion.js)
- Catálogo en memoria + lookup en `professions.sinonimos`.
- "Fonoaudióloga", "fono", "fonoaudiologa" → todos mapean a `slug=fonoaudiologo`.

### Aplicar migración a prod
La migración solo **agrega** tablas, columnas y enum — no mueve datos. Riesgo bajo.

1. Backup branch en Neon (igual que F0 §9).
2. `cd backend && DATABASE_URL='<URL_NEON_SIN_POOLER>' npx prisma migrate deploy`
3. `DATABASE_URL='<URL_NEON_SIN_POOLER>' npx prisma generate`
4. Reseed: `DATABASE_URL='<URL_NEON>' npx prisma db seed` (llena `professions` y `cities`).
5. Render manual deploy.
6. Smoke test: `curl https://oirconecta-api.onrender.com/api/directory/professions` debe devolver 4 items.

### Frontend Fase 1 (pendiente, próxima sesión)
- Portal profesional autoadministrable (fotos, horarios visual, servicios, completitud %).
- Cards públicas tipo Airbnb (imagen, rating, ciudad, profesión, modalidad, "desde $").
- Buscador con filtros (chips por profesión/ciudad, slider minRating, sort).
- Página `/directorio/destacados`, `/directorio/ciudad/:slug`, `/directorio/profesion/:slug`.
- Componente de reseñas (estrellas, formulario, lista).
- Admin moderación (lista pendientes, botones aprobar/rechazar).
