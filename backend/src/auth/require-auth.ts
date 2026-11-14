import type { FastifyRequest } from 'fastify';
import { AppError } from '../errors.js';

export async function requireAuth(request: FastifyRequest): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    throw new AppError(401, 'UNAUTHORIZED', 'Se requiere un token válido para acceder.');
  }
}
