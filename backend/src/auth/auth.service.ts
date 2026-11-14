import { Prisma } from '../../generated/prisma/client.js';
import { AppError } from '../errors.js';
import { prisma } from '../prisma.js';
import { hashPassword } from './password.js';

export async function registerUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);

  try {
    return await prisma.user.create({
      data: { email: email.trim().toLowerCase(), passwordHash },
      select: { id: true, email: true, createdAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'EMAIL_IN_USE', 'Este correo ya está registrado.');
    }
    throw error;
  }
}
