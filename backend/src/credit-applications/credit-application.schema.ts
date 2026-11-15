import { CreditApplicationStatus } from '../../generated/prisma/enums.js';

export type ListCreditApplicationsQuery = {
  status?: CreditApplicationStatus;
};

export const listCreditApplicationsSchema = {
  querystring: {
    type: 'object',
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: Object.values(CreditApplicationStatus) },
    },
  },
};

export type CreateCreditApplication = {
  amount: number;
  paymentTermMonths: number;
  idNumber: string;
};

export const createCreditApplicationSchema = {
  body: {
    type: 'object',
    required: ['amount', 'paymentTermMonths', 'idNumber'],
    additionalProperties: false,
    properties: {
      amount: { type: 'number', minimum: 500, maximum: 50000, multipleOf: 0.01 },
      paymentTermMonths: { type: 'integer', minimum: 6, maximum: 60 },
      idNumber: { type: 'string', minLength: 1, pattern: '\\S' },
    },
  },
};
