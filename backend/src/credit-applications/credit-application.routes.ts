import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../auth/require-auth.js';
import { AppError } from '../errors.js';
import {
  createCreditApplicationSchema,
  listCreditApplicationsSchema,
  type CreateCreditApplication,
  type ListCreditApplicationsQuery,
} from './credit-application.schema.js';
import type * as creditApplicationService from './credit-application.service.js';

export type CreditApplicationRoutesOptions = {
  creditApplicationService: typeof creditApplicationService;
};

export async function creditApplicationRoutes(
  app: FastifyInstance,
  { creditApplicationService }: CreditApplicationRoutesOptions,
): Promise<void> {
  app.get<{ Querystring: ListCreditApplicationsQuery }>(
    '/',
    { onRequest: requireAuth, schema: listCreditApplicationsSchema, attachValidation: true },
    async (request) => {
      if (request.validationError) {
        throw new AppError(
          400,
          'INVALID_REQUEST',
          'El único filtro permitido es status y debe ser PENDING, APPROVED o REJECTED.',
        );
      }
      return creditApplicationService.listCreditApplications(request.query.status);
    },
  );

  app.post<{ Body: CreateCreditApplication }>(
    '/',
    {
      onRequest: requireAuth,
      schema: createCreditApplicationSchema,
      attachValidation: true,
    },
    async (request, reply) => {
      if (request.validationError) {
        throw new AppError(
          400,
          'INVALID_REQUEST',
          'Envía únicamente monto de $500 a $50,000 con hasta dos decimales, plazo entero de 6 a 60 meses y cédula como texto obligatorio.',
        );
      }
      const application = await creditApplicationService.createCreditApplication(request.body);
      return reply.status(201).send(application);
    },
  );
}
