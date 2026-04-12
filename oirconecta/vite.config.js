import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve, join } from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const muiIconsRoot = resolve(__dirname, 'node_modules/@mui/icons-material')

/**
 * El `main` de icons es CJS y deja `require("@mui/material/utils")` → en el navegador
 * Vite lanza "Dynamic require …". El árbol `esm/` usa imports estáticos / reexports ESM.
 */
function muiIconsUseEsmEntries() {
  return {
    name: 'mui-icons-esm-entries',
    enforce: 'pre',
    resolveId(id) {
      const bare = id.split('?')[0]
      if (bare === '@mui/icons-material') {
        const index = join(muiIconsRoot, 'esm/index.js')
        return fs.existsSync(index) ? index : undefined
      }
      if (!bare.startsWith('@mui/icons-material/')) return undefined
      if (bare.includes('/esm/')) return undefined
      const rest = bare.slice('@mui/icons-material/'.length)
      if (!rest) return undefined
      const candidate = join(muiIconsRoot, 'esm', `${rest}.js`)
      return fs.existsSync(candidate) ? candidate : undefined
    },
  }
}

/**
 * Subpaths `@mui/system/…` resuelven al CJS raíz → en el navegador fallan default/named exports.
 * Redirigimos al ESM bajo `esm/`. Para paquetes con barrel (reexports), usar `…/index.js`,
 * no el `.js` interno (p. ej. `styleFunctionSx/index.js` exporta `unstable_defaultSxConfig`).
 */
const MUI_SYSTEM_IMPORT_REWRITES = [
  ['@mui/system/colorManipulator', '@mui/system/esm/colorManipulator.js'],
  ['@mui/system/createStyled', '@mui/system/esm/createStyled.js'],
  ['@mui/system/createTheme', '@mui/system/esm/createTheme/index.js'],
  ['@mui/system/styleFunctionSx', '@mui/system/esm/styleFunctionSx/index.js'],
  ['@mui/system/useMediaQuery', '@mui/system/esm/useMediaQuery/index.js'],
  ['@mui/system/useThemeProps', '@mui/system/esm/useThemeProps/index.js'],
  ['@mui/system/useThemeWithoutDefault', '@mui/system/esm/useThemeWithoutDefault.js'],
  ['@mui/system/DefaultPropsProvider', '@mui/system/esm/DefaultPropsProvider/index.js'],
  ['@mui/system/InitColorSchemeScript', '@mui/system/esm/InitColorSchemeScript/index.js'],
  ['@mui/system/RtlProvider', '@mui/system/esm/RtlProvider/index.js'],
  ['@mui/system/Unstable_Grid', '@mui/system/esm/Unstable_Grid/index.js'],
]

function needsMuiSystemImportRewrite(code) {
  return MUI_SYSTEM_IMPORT_REWRITES.some(([from]) => code.includes(from))
}

function rewriteMuiSystemImports(source) {
  let out = source
  for (const [from, to] of MUI_SYSTEM_IMPORT_REWRITES) {
    out = out.split(`'${from}'`).join(`'${to}'`)
    out = out.split(`"${from}"`).join(`"${to}"`)
  }
  return out
}

function muiSystemImportAliases() {
  return Object.fromEntries(
    MUI_SYSTEM_IMPORT_REWRITES.map(([from, to]) => [from, resolve(__dirname, 'node_modules', ...to.split('/'))])
  )
}

/** Misma reescritura durante el scan/pre-bundle de esbuild (optimizeDeps). */
function muiSystemImportsEsbuild() {
  return {
    name: 'mui-system-imports-esbuild',
    setup(build) {
      build.onLoad({ filter: /node_modules[\\/]@mui[\\/].*\.js$/ }, (args) => {
        let text
        try {
          text = fs.readFileSync(args.path, 'utf8')
        } catch {
          return undefined
        }
        if (!needsMuiSystemImportRewrite(text)) return undefined
        const next = rewriteMuiSystemImports(text)
        if (next === text) return undefined
        return { contents: next, loader: 'js' }
      })
    },
  }
}

/**
 * Reescribe specifiers en fuentes de @mui/* (resolve/alias no cubren todos los caminos).
 */
function muiSystemImportsRollupRewrite() {
  return {
    name: 'mui-system-imports-rollup',
    enforce: 'pre',
    transform(code, id) {
      const p = id.split('?')[0].split('\\').join('/')
      if (!p.includes('node_modules/@mui/')) return null
      if (!needsMuiSystemImportRewrite(code)) return null
      const next = rewriteMuiSystemImports(code)
      return next === code ? null : { code: next, map: null }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [muiIconsUseEsmEntries(), muiSystemImportsRollupRewrite(), react()],
  build: {
    sourcemap: false,
  },
  esbuild: {
    drop: mode === 'production' ? ['debugger'] : [],
  },
  server: {
    port: 5174,
    // `host: true` escanea todas las interfaces; en algunos macOS/Node falla al arrancar
    // (uv_interface_addresses) y el servidor no llega a quedar escuchando → ERR_CONNECTION_REFUSED.
    // Para oír en la red local: VITE_LISTEN_ALL=1 npm run dev
    host: process.env.VITE_LISTEN_ALL === '1',
    strictPort: false,
    open: true,
    // Evitar que el navegador cachee en desarrollo (ver siempre cambios recientes)
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    watch: {
      // usePolling en macOS dispara EMFILE ("too many open files") con proyectos grandes.
      // Si trabajas en carpeta montada (Docker) y no ves cambios: VITE_WATCH_POLLING=1 npm run dev
      usePolling: process.env.VITE_WATCH_POLLING === '1',
      ...(process.env.VITE_WATCH_POLLING === '1' ? { interval: 1000 } : {}),
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/coverage/**',
      ],
    },
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // NO preempaquetar `@mui/material`: en Vite 6 + esbuild el chunk fusionado rompe
  // `createTheme` → "createTheme_default is not a function". Sí preempaquetar iconos
  // (miles de ESM sueltos → EMFILE si se excluyen).
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      'react',
      'react-dom',
      'prop-types',
      'react-is',
      '@mui/system',
      // @mui/icons-material (CJS) hace require("@mui/material/utils"); sin pre-bundle de
      // ese subpath → "Dynamic require … is not supported" en el chunk de iconos.
      '@mui/material/utils',
    ],
    exclude: ['@mui/material'],
    esbuildOptions: {
      plugins: [muiSystemImportsEsbuild()],
    },
  },
  resolve: {
    dedupe: ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
    alias: muiSystemImportAliases(),
  },
}))
