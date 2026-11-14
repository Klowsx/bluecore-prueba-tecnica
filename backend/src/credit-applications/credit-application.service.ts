import { prisma } from '../prisma.js';
import type { CreateCreditApplication } from './credit-application.schema.js';

export async function createCreditApplication(data: CreateCreditApplication) {
  return prisma.creditApplication.create({
    data: {
      amount: data.amount,
      paymentTermMonths: data.paymentTermMonths,
      idNumber: data.idNumber.trim(),
    },
  });
}
