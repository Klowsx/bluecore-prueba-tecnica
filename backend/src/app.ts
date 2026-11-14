import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { authRoutes, type AuthRoutesOptions } from './auth/auth.routes.js';
import { registerErrorHandlers } from './errors.js';

export function buildApp({
  authService,
  logger = false,
}: AuthRoutesOptions & { logger?: boolean }) {
  const app = Fastify({
    logger,
    ajv: { customOptions: { coerceTypes: false, removeAdditional: false } },
  });

  registerErrorHandlers(app);

  app.register(rateLimit, { global: false });

  app.register(authRoutes, { prefix: '/auth', authService });

  app.get('/health', async () => ({ status: 'ok' }));
  return app;
}
