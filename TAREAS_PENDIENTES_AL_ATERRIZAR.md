# Tareas pendientes al aterrizar

> Estado al 2026-05-30, sesión en avión. Lista priorizada.

---

## 🚀 Bloque 1 — Push y deploy (crítico, 5 min)

- [ ] `cd "/Users/rafaelparada/Desktop/Cursor OirConecta"`
- [ ] `git push origin main`
- [ ] **6 commits locales pendientes**:
  - `2f7dd5f` — 410 Gone para hack japonés (`/items/*`, `/shop/*`, `/wp-*`)
  - `228b5f0` — Helmet + canonical + OG en 14 páginas + noindex en 6 auth
  - `13413cf` — MedicalOrganization + WebSite + BreadcrumbList schema
  - `50f3c54` — preconnect API, theme-color, max-image-preview, sitemap +/ecommerce
  - `3a57597` — PWA manifest + security.txt + meta móvil
  - (último) — react-markdown renderer + seed script blog + 3 artículos
- [ ] Esperar deploy Render (~5 min)

---

## ✅ Bloque 2 — Validación post-deploy (15 min)

### Hack japonés (lo más urgente)
- [ ] `curl -I https://oirconecta.com/items/test` → debe ser **HTTP/2 410**
- [ ] **GSC → Eliminaciones → Remoción temporal** con prefijos:
  - `https://oirconecta.com/items/`
  - `https://oirconecta.com/shop/`
  - `https://oirconecta.com/wp-content/`
  - `https://oirconecta.com/wp-includes/`
  - `https://oirconecta.com/wp-admin/`
- [ ] **GSC → Problemas de seguridad**: si aparece aviso de "sitio hackeado", solicitar revisión

### Schema y meta
- [ ] [Rich Results Test](https://search.google.com/test/rich-results) con `https://oirconecta.com/audifonos/widex` → debe detectar **3 elementos** (MedicalOrganization + WebSite + BreadcrumbList)
- [ ] [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) → URL `https://oirconecta.com/` → botón **"Volver a extraer"** → debe quitar el error de `og:image /logo.png`
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/analysis?url=https://oirconecta.com) → revisar Core Web Vitals reales (especialmente mobile, hoy 84)

### DreamHost (cerrar la puerta)
- [ ] Verificar si DreamHost sigue sirviendo algo. Si tiene WordPress activo, **suspender o borrar archivos**
- [ ] Cambiar contraseñas de DreamHost panel + FTP/SSH si no se hizo tras la migración

---

## 📝 Bloque 3 — Blog (47 artículos pendientes)

### Infra ya lista
- ✅ Renderer markdown completo en `BlogPostPage.jsx` (H1-H4, negritas, enlaces, tablas, blockquotes, listas, imágenes)
- ✅ Script de seed en `backend/scripts/seed_blog_articles.js`
- ✅ Carpeta `backend/content/blog/` con los .md
- ✅ 3 artículos redactados (01, 02, 03)

### Pendiente con Claude (próxima sesión)
- [ ] Redactar artículos #4–#50 (47 restantes), en bloques de 3–5 por turno
- [ ] Plan ya aprobado: ver [PLAN_EDITORIAL_BLOG.md] o el turno anterior en chat

### Pendiente tú
- [ ] Probar el seed con los 3 ya hechos:
  ```bash
  cd backend && node scripts/seed_blog_articles.js
  ```
- [ ] Revisar visualmente en `/blog/tipos-de-perdida-auditiva` etc.
- [ ] Decidir si:
  - `coverUrl` queda en null y subes imágenes manualmente, o
  - Usas placeholder de Unsplash, o
  - Generas con IA con los prompts incluidos al final de cada artículo
- [ ] Cuando estés listo, cambiar `estado: PUBLICADO` y `publishedAt: <fecha>` en frontmatter y re-correr seed
- [ ] Confirmar si quieres mantener las 8 categorías del plan (guías, cuidados, comparativas, glosario, lanzamientos, tecnologia, casos, general) o mapear a las 4 que tiene el frontend actual

---

## 🤔 Bloque 4 — Decisiones de producto pendientes

- [ ] **FAQ visible + Schema FAQPage** en /audifonos o /servicios — requiere que apruebes contenido de preguntas frecuentes
- [ ] **Prerender / SSG** (`vite-plugin-ssg` o Astro) — cambio mayor de arquitectura. Sin esto, OG dinámicos no se ven en WhatsApp/Facebook para páginas profundas (blog posts, perfiles)
- [ ] **Code-splitting agresivo** del bundle 581KB — requiere dev server prendido para validar
- [ ] **Limpieza de `.htaccess`** viejo de DreamHost (irrelevante en Render, solo es ruido)

---

## 🔗 Bloque 5 — GSC e Indexación

- [ ] Confirmar que sitemap nuevo (con /ecommerce) está enviado en GSC
- [ ] Pedir indexación manual de las páginas principales que ahora tienen Helmet:
  - `/`
  - `/blog`
  - `/profesionales/audiologos`
  - `/profesionales/otologos`
  - `/directorio/listado`
  - `/agendar`
- [ ] Validar en GSC que `/directorio-clasico` aparece como noindex y no compite con `/directorio/listado`

---

## 📊 Métricas actuales (pre-push)

| Métrica | Desktop | Mobile |
|---|---|---|
| Rendimiento | 96 | 84 ⚠️ |
| Accesibilidad | 98 | 98 |
| Recomendaciones | 96 | 96 |
| SEO | 100 | 100 |

Mobile performance 84 es el target del próximo bloque.
