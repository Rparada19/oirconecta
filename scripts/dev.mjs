/**
 * Arranque coordinado: backend (API) + Vite (sitio público y CRM en la misma SPA).
 * Lee puertos desde la raíz del monorepo: `.env` / `.env.local` (opcional) o variables de entorno.
 * Si el puerto del API o de Vite está ocupado, elige el siguiente libre para evitar crash.
 */

import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function quotePath(p) {
  return `"${String(p).replace(/"/g, '\\"')}"`;
}

/** Comprueba si TCP puede escuchar en `port` (misma comprobación que bind real). */
function portIsFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.listen(port, () => {
      srv.close(() => resolve(true));
    });
  });
}

/** Prueba `start`, luego start+1 … hasta encontrar uno libre (máx. `span` intentos). */
async function pickFreePort(start, span = 50) {
  const n = Math.max(1, parseInt(String(start), 10) || 1);
  for (let p = n; p < n + span; p++) {
    if (await portIsFree(p)) {
      if (p !== n) {
        console.warn(`[oirconecta] El puerto ${n} estaba ocupado; usando ${p}.`);
      }
      return String(p);
    }
  }
  throw new Error(`No hay puerto TCP libre entre ${n} y ${n + span - 1}`);
}

async function main() {
  const fileEnv = {
    ...parseEnvFile(path.join(root, '.env')),
    ...parseEnvFile(path.join(root, '.env.local')),
  };

  const preferredBackend = String(fileEnv.BACKEND_PORT || process.env.BACKEND_PORT || '3001').trim();
  const preferredFrontend = String(fileEnv.FRONTEND_PORT || process.env.FRONTEND_PORT || '5174').trim();

  const BACKEND_PORT = await pickFreePort(preferredBackend, 60);
  const FRONTEND_PORT = await pickFreePort(preferredFrontend, 40);
  const apiTarget = `http://127.0.0.1:${BACKEND_PORT}`;

  const defaultCorsPorts = '5173,5174,5175,5176,5177,5178,5180,5181,5182,5200';
  const corsFromFile = (fileEnv.CORS_DEV_PORTS || process.env.CORS_DEV_PORTS || '').trim();
  const corsPorts = [
    ...new Set(
      [FRONTEND_PORT, ...(corsFromFile ? corsFromFile.split(',') : defaultCorsPorts.split(','))]
        .map((s) => String(s).trim())
        .filter(Boolean)
    ),
  ].join(',');

  const backendDir = path.join(root, 'backend');
  const frontendDir = path.join(root, 'oirconecta');

  const cmd1 = `cd ${quotePath(backendDir)} && cross-env PORT=${BACKEND_PORT} npm run dev`;
  const cmd2 = `cd ${quotePath(frontendDir)} && cross-env VITE_DEV_PORT=${FRONTEND_PORT} VITE_API_PROXY_TARGET=${apiTarget} npm run dev`;

  console.log(
    `[oirconecta] Dev: API → http://localhost:${BACKEND_PORT} | Sitio + CRM (Vite) → http://localhost:${FRONTEND_PORT}`
  );

  const child = spawn('npx', ['concurrently', '-n', 'backend,sitio+crm', '-c', 'blue,green', cmd1, cmd2], {
    cwd: root,
    stdio: 'inherit',
    shell: false,
    env: {
      ...process.env,
      BACKEND_PORT,
      FRONTEND_PORT,
      CORS_DEV_PORTS: corsPorts,
    },
  });

  child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 1);
  });
}

main().catch((err) => {
  console.error('[oirconecta]', err.message || err);
  process.exit(1);
});
