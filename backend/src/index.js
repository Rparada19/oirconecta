/**
 * OirConecta Backend - Punto de entrada
 */

require('dotenv').config();

const app = require('./app');
const config = require('./config');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Intenta escuchar en `port`; resuelve con `{ server, port }` o rechaza con el error. */
function listenOnce(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve({ server, port });
    });
    server.once('error', reject);
  });
}

const startServer = async () => {
  let httpServer;

  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos PostgreSQL');

    const preferred = config.port;
    const maxAttempts = config.nodeEnv === 'development' ? 50 : 1;
    let actualPort = preferred;

    for (let i = 0; i < maxAttempts; i++) {
      const tryPort = preferred + i;
      try {
        const { server, port } = await listenOnce(tryPort);
        httpServer = server;
        actualPort = port;
        break;
      } catch (err) {
        if (err.code === 'EADDRINUSE' && i < maxAttempts - 1) {
          continue;
        }
        if (err.code === 'EADDRINUSE') {
          if (maxAttempts === 1) {
            console.error(
              `❌ El puerto ${tryPort} ya está en uso. Cambia PORT en el entorno / backend/.env o libera el proceso.`
            );
          } else {
            console.error(
              `❌ No hay puerto libre entre ${preferred} y ${preferred + maxAttempts - 1}. Cierra procesos u otra instancia del API, o cambia PORT en backend/.env.`
            );
          }
        } else {
          console.error('❌ Error al escuchar en el puerto:', err);
        }
        await prisma.$disconnect();
        process.exit(1);
      }
    }

    if (actualPort !== preferred) {
      console.warn(
        `⚠️ El puerto ${preferred} estaba ocupado. API usando ${actualPort}. Si el front va aparte, define VITE_API_PROXY_TARGET=http://127.0.0.1:${actualPort} (o reinicia \`npm run dev\` desde la raíz del monorepo).`
      );
    }

    console.log(`🚀 Servidor corriendo en http://localhost:${actualPort}`);
    console.log(`📦 Entorno: ${config.nodeEnv}`);

    const shutdown = async () => {
      console.log('\n🛑 Cerrando servidor...');
      if (httpServer) {
        await new Promise((resolve) => {
          httpServer.close(() => resolve());
        });
      }
      await prisma.$disconnect();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
