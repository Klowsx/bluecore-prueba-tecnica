import type { CreditApplicationStatus } from '../../generated/prisma/enums.js';
import { prisma } from '../prisma.js';
import type { CreateCreditApplication } from './credit-application.schema.js';

export async function listCreditApplications(status?: CreditApplicationStatus) {
  return prisma.creditApplication.findMany({
    where: status ? { status } : {},
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
}

export async function createCreditApplication(data: CreateCreditApplication) {
  return prisma.creditApplication.create({
    data: {
      amount: data.amount,
      paymentTermMonths: data.paymentTermMonths,
      idNumber: data.idNumber.trim(),
    },
  });
}
