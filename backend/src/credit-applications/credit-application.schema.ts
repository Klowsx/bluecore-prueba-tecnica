import { CreditApplicationStatus } from '../../generated/prisma/enums.js';

const decisionStatuses = [
  CreditApplicationStatus.APPROVED,
  CreditApplicationStatus.REJECTED,
] as const;

export type UpdateCreditApplicationStatus = {
  status: (typeof decisionStatuses)[number];
  comment: string;
};

export const updateCreditApplicationStatusSchema = {
  body: {
    type: 'object',
    required: ['status', 'comment'],
    additionalProperties: false,
    properties: {
      status: { type: 'string', enum: decisionStatuses },
      comment: { type: 'string', pattern: '\\S' },
    },
  },
};

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
