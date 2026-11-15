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
