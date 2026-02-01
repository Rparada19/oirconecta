#!/bin/bash
# Arranca backend y frontend desde la raíz del proyecto (una sola terminal).
# Uso: ./start.sh   o   bash start.sh

cd "$(dirname "$0")"

cleanup() {
  echo ""
  echo "▶ Deteniendo backend y frontend..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

echo "▶ Iniciando backend (puerto 3001)..."
(cd backend && npm run dev) &
BACKEND_PID=$!

echo "▶ Iniciando frontend (puerto 5174)..."
(cd oirconecta && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend PID: $BACKEND_PID | Frontend PID: $FRONTEND_PID"
echo "Para detener: Ctrl+C (se detienen ambos)"
echo ""

wait
