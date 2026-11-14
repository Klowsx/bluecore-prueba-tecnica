import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { buildApp } from '../src/app.js';

test('crea una solicitud autenticada, valida los datos y persiste el estado PENDING', async (t) => {
  assert.ok(process.env.TEST_DATABASE_URL, 'Configura TEST_DATABASE_URL con una base migrada.');
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  const authService = await import('../src/auth/auth.service.js');
  const creditApplicationService =
    await import('../src/credit-applications/credit-application.service.js');
  const { prisma } = await import('../src/prisma.js');
  const app = buildApp({ authService, creditApplicationService, jwtSecret: 'clave-para-pruebas' });
  const idNumber = randomUUID();
  t.after(async () => {
    try {
      await prisma.creditApplication.deleteMany({ where: { idNumber } });
    } finally {
      await app.close();
      await prisma.$disconnect();
    }
  });
  await app.ready();
  const authorization = `Bearer ${app.jwt.sign({ sub: 'usuario-prueba' })}`;
  const payload = { amount: 1234.56, paymentTermMonths: 12, idNumber };

  for (const token of [
    undefined,
    'Bearer inválido',
    `${authorization}x`,
    `Bearer ${app.jwt.sign({ sub: 'usuario-prueba', iat: Math.floor(Date.now() / 1000) - 7200 })}`,
  ]) {
    const response = await app.inject({
      method: 'POST',
      url: '/credit-applications',
      headers: token ? { authorization: token } : {},
      payload,
    });
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, 'UNAUTHORIZED');
  }

  for (const invalid of [
    {},
    { ...payload, amount: 499.99 },
    { ...payload, amount: 50000.01 },
    { ...payload, amount: '500' },
    { ...payload, amount: 1000.001 },
    { ...payload, paymentTermMonths: 5 },
    { ...payload, paymentTermMonths: 61 },
    { ...payload, paymentTermMonths: 6.5 },
    { ...payload, paymentTermMonths: '12' },
    { ...payload, idNumber: '' },
    { ...payload, idNumber: '  \t ' },
    { ...payload, idNumber: 123 },
    { ...payload, status: 'APPROVED' },
  ]) {
    const response = await app.inject({
      method: 'POST',
      url: '/credit-applications',
      headers: { authorization },
      payload: invalid,
    });
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, 'INVALID_REQUEST');
  }
  assert.equal(await prisma.creditApplication.count({ where: { idNumber } }), 0);

  for (const data of [
    payload,
    { ...payload, amount: 500, paymentTermMonths: 6 },
    { ...payload, amount: 50000, paymentTermMonths: 60 },
  ]) {
    const response = await app.inject({
      method: 'POST',
      url: '/credit-applications',
      headers: { authorization },
      payload: { ...data, idNumber: `  ${idNumber}  ` },
    });
    assert.equal(response.statusCode, 201);
    const created = response.json();
    assert.ok(created.id);
    assert.equal(created.status, 'PENDING');
    assert.equal(created.comment, null);
    assert.equal(created.idNumber, idNumber);
    assert.equal(Number(created.amount), data.amount);
    assert.equal(created.paymentTermMonths, data.paymentTermMonths);
    const saved = await prisma.creditApplication.findUniqueOrThrow({ where: { id: created.id } });
    assert.equal(saved.status, 'PENDING');
    assert.equal(saved.amount.toString(), String(data.amount));
    assert.equal(saved.idNumber, idNumber);
    assert.equal(saved.paymentTermMonths, data.paymentTermMonths);
    assert.equal(saved.createdAt.toISOString(), created.createdAt);
  }
  assert.equal(await prisma.creditApplication.count({ where: { idNumber } }), 3);
});
