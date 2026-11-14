import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../errors.js';
import { prisma } from '../prisma.js';
import { hashPassword, verifyPassword } from './password.js';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function registerUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);

  try {
    return await prisma.user.create({
      data: { email: normalizeEmail(email), passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'EMAIL_IN_USE', 'Este correo ya está registrado.');
    }
    throw error;
  }
}

export async function loginUser(email: string, password: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, passwordHash: true },
  });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.');
  }
  return user.id;
}
