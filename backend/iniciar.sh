#!/bin/bash
# Inicia el backend de OirConecta.
# La base de datos es Neon (Frankfurt), la misma que usa producción: no hay
# PostgreSQL local que arrancar. Ojo con eso — lo que escribas desde aquí
# le pasa a los datos reales.

cd "$(dirname "$0")"

echo "▶ Verificando conexión a la base (Neon)..."
if ! node -e "
  require('dotenv').config();
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  p.\$queryRaw\`SELECT 1\`.then(() => p.\$disconnect()).catch((e) => { console.error(e.message); process.exit(1); });
" 2>&1; then
  echo "❌ No se puede conectar a la base."
  echo ""
  echo "   Revisa DATABASE_URL en backend/.env — debe ser la cadena de Neon"
  echo "   (proyecto Oir-conecta-funcional, branch production)."
  exit 1
fi

echo "✅ Base OK (Neon)"
echo "▶ Iniciando backend en puerto 3001..."
npm run dev
