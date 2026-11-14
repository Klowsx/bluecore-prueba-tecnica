import type { FastifyInstance } from 'fastify';
import { credentialsSchema, type Credentials } from './auth.schema.js';
import type * as authService from './auth.service.js';

export type AuthRoutesOptions = {
  authService: typeof authService;
};

export async function authRoutes(
  app: FastifyInstance,
  { authService }: AuthRoutesOptions,
): Promise<void> {
  app.post<{ Body: Credentials }>(
    '/register',
    {
      schema: credentialsSchema,
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const user = await authService.registerUser(request.body.email, request.body.password);
      return reply.status(201).send(user);
    },
  );
}
