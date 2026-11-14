import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';

test('registra, autentica y rechaza duplicados o credenciales incorrectas', async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(databaseUrl, 'Configura TEST_DATABASE_URL con una base de pruebas migrada.');
  process.env.DATABASE_URL = databaseUrl;
  const authService = await import('../src/auth/auth.service.js');
  const { prisma } = await import('../src/prisma.js');
  const creditApplicationService =
    await import('../src/credit-applications/credit-application.service.js');

  const app = buildApp({ authService, creditApplicationService, jwtSecret: 'clave-para-pruebas' });
  const email = `Ana-${randomUUID().replaceAll('-', '')}@example.com`;
  const password = '😀'.repeat(128);
  t.after(async () => {
    try {
      await prisma.user.deleteMany({ where: { email: email.toLowerCase() } });
    } finally {
      await app.close();
      await prisma.$disconnect();
    }
  });

  const created = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email, password },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json().email, email.toLowerCase());

  const login = (email: string, password: string) =>
    app.inject({ method: 'POST', url: '/auth/login', payload: { email, password } });
  const success = await login(email.toUpperCase(), password);
  assert.equal(success.statusCode, 200);
  assert.deepEqual(Object.keys(success.json()), ['accessToken']);
  assert.equal(app.jwt.verify<{ sub: string }>(success.json().accessToken).sub, created.json().id);

  const wrongPassword = await login(email, 'equivocada');
  const unknownEmail = await login(`u-${randomUUID()}@test.com`, password);
  assert.equal(wrongPassword.statusCode, 401);
  assert.equal(unknownEmail.statusCode, 401);
  assert.deepEqual(wrongPassword.json().error, {
    code: 'INVALID_CREDENTIALS',
    message: 'Correo o contraseña incorrectos.',
  });
  assert.deepEqual(unknownEmail.json(), wrongPassword.json());

  const duplicate = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: email.toLowerCase(), password },
  });
  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.json().error.code, 'EMAIL_IN_USE');
});
