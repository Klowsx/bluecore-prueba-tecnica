import { buildApp } from './app.js';
import { prisma } from './prisma.js';
import * as authService from './auth/auth.service.js';

// Se obtiene el secret para iniciar el servidor y si no está configurado se lanza un error
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret?.trim()) throw new Error('JWT_SECRET no está configurada');

const app = buildApp({ authService, jwtSecret, logger: true });

// Hook para desconectar de la base de datos cuando el servidor se cierra
app.addHook('onClose', async () => {
  await prisma.$disconnect();
});

// Se registran los manejadores de señales para cerrar el servidor de manera ordenada
// SIGINT y SIGTERM son señales que se envían al proceso para indicar que debe terminar
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void app
      .close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        app.log.error(error);
        process.exit(1);
      });
  });
}

try {
  await prisma.$connect();
  await app.listen({ port: 3000, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
