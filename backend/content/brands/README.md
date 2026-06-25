# Brand data enrichment

Carpeta donde vive la información estructurada por marca que usan las páginas
`/audifonos/<slug>` y `/implantes/<slug>`. Se mantiene actualizada mediante
un script que llama a la Claude API con búsqueda web y refresca cada JSON.

## Estructura

Un archivo `<slug>.json` por marca. Slug = mismo que la URL.

### Schema

```jsonc
{
  "slug": "widex",
  "nombre": "Widex",
  "categoria": "audifono", // "audifono" | "implante"

  "metadata": {
    "actualizado": "2026-06-24T14:00:00Z",
    "fuente": "claude-sonnet-4-6 con web_search",
    "version": 1
  },

  "marca": {
    "fabricante": "WS Audiology",
    "origen_pais": "Dinamarca",
    "año_fundacion": 1956,
    "sitio_oficial": "https://www.widex.com",
    "sitio_oficial_co": "https://www.widex.com/es-co",
    "fuerza_principal": "Tecnología PureSound™ para sonido más natural",
    "publico_objetivo": "Pacientes que priorizan calidad de sonido y diseño discreto"
  },

  "lineas_actuales": [
    {
      "nombre": "Moment Sheer™",
      "tipo": "RIC",
      "año_lanzamiento": 2023,
      "descripcion_corta": "...",
      "tecnologias_clave": ["PureSound™", "ZeroDelay"],
      "niveles_perdida": ["leve", "moderada", "severa"],
      "conectividad": ["Bluetooth 5.0 LE", "iPhone", "Android"],
      "bateria": { "tipo": "recargable", "horas_max": 30 },
      "resistencia": "IP68",
      "rango_precio_cop": { "min": 3500000, "max": 9500000, "nota": "Por par. Varía según centro y nivel tecnológico." }
    }
  ],

  "tecnologias_destacadas": [
    {
      "nombre": "PureSound™",
      "descripcion": "...",
      "patentado": true
    }
  ],

  "presencia_colombia": {
    "distribuidor_oficial": "Widex Colombia",
    "ciudades_principales": ["Bogotá", "Medellín", "Cali", "Barranquilla"],
    "centros_afiliados": "Red de centros auditivos en >40 ciudades",
    "soporte_post_venta": "..."
  },

  "preguntas_frecuentes": [
    { "q": "¿Cuánto cuesta un audífono Widex en Colombia?", "a": "..." }
  ]
}
```

## Cómo se actualiza

### Manual (una sola marca)

```bash
cd backend
ANTHROPIC_API_KEY=sk-ant-... node scripts/refresh-brand-data.js --brand widex
```

### Manual (todas las marcas)

```bash
cd backend
ANTHROPIC_API_KEY=sk-ant-... node scripts/refresh-brand-data.js
```

### Automático

Workflow `.github/workflows/monthly-brand-refresh.yml` corre el día 1 de cada
mes y hace commit + push de los cambios. Mensual y no semanal porque los
catálogos de fabricantes no cambian con esa frecuencia.

## Cómo se consume

`BrandPageTemplate.jsx` puede recibir el JSON como prop opcional. Si no se
provee, cae al fallback hard-coded en cada `<Marca>Page.jsx`. Esto permite que
la página siga funcionando aunque el refresh falle.

Implementación pendiente (próxima sesión): inyectar el JSON en cada página de
marca y enriquecer secciones del template con datos del JSON (precios, FAQ,
distribuidor, etc.).
