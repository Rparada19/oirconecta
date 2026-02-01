#!/bin/bash
# Inicia el backend de OirConecta.
# Requiere: PostgreSQL corriendo, base de datos creada, npx prisma db push y db:seed hechos al menos una vez.

cd "$(dirname "$0")"

echo "▶ Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo "❌ psql no encontrado. ¿PostgreSQL está instalado?"
  echo "   Mac: brew install postgresql@15"
  exit 1
fi

if ! psql -h localhost -p 5432 -U rafaelparada -d oirconecta_db -c "SELECT 1" &> /dev/null 2>&1; then
  echo "❌ No se puede conectar a PostgreSQL en localhost:5432"
  echo ""
  echo "   Soluciones:"
  echo "   1. Iniciar PostgreSQL: brew services start postgresql@15"
  echo "   2. Crear la base de datos: createdb oirconecta_db"
  echo "   3. Aplicar esquema: npx prisma db push"
  echo "   4. Crear admin: npm run db:seed"
  echo ""
  echo "   Si usas otro usuario: edita backend/.env (DATABASE_URL)"
  exit 1
fi

echo "✅ PostgreSQL OK"
echo "▶ Iniciando backend en puerto 3001..."
npm run dev
