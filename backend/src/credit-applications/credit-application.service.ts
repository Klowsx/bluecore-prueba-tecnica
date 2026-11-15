import { Prisma } from '../../generated/prisma/client.js';
import type { CreditApplicationStatus } from '../../generated/prisma/enums.js';
import { AppError } from '../errors.js';
import { prisma } from '../prisma.js';
import type {
  CreateCreditApplication,
  UpdateCreditApplicationStatus,
} from './credit-application.schema.js';

export async function updateCreditApplicationStatus(
  id: string,
  { status, comment }: UpdateCreditApplicationStatus,
) {
  try {
    return await prisma.creditApplication.update({
      where: { id },
      data: { status, comment: comment.trim() },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new AppError(404, 'APPLICATION_NOT_FOUND', 'La solicitud de crédito no existe.');
    }
    throw error;
  }
}

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
