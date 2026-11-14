import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

// Metodo para hashear la contraseña usando scrypt y un salt aleatorio.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

// Verficacion de la contraseña ingresada por el usuario con la contraseña hasheada almacenada en la base de datos.
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const parts = passwordHash.split(':');
  if (parts.length !== 3) return false;
  const [algorithm, salt, hash] = parts;
  if (
    algorithm !== 'scrypt' ||
    !salt ||
    !/^[0-9a-f]{32}$/.test(salt) ||
    !hash ||
    !/^[0-9a-f]{128}$/.test(hash)
  ) {
    return false;
  }
  const storedKey = Buffer.from(hash, 'hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(storedKey, derivedKey);
}
