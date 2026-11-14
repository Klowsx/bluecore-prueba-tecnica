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
  const options = {
    schema: credentialsSchema,
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
  };

  app.post<{ Body: Credentials }>('/register', options, async (request, reply) => {
    const user = await authService.registerUser(request.body.email, request.body.password);
    return reply.status(201).send(user);
  });

  app.post<{ Body: Credentials }>('/login', options, async (request, reply) => {
    const { email, password } = request.body;
    const userId = await authService.loginUser(email, password);
    const accessToken = await reply.jwtSign({ sub: userId });
    return reply.header('Cache-Control', 'no-store').send({ accessToken });
  });
}
