import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';
import { AppError } from './errors.js';

test('registra un usuario y responde con sus datos públicos', async () => {
  const app = buildApp({
    authService: {
      async registerUser(email, password) {
        assert.equal(email, 'test@example.com');
        assert.equal(password, 'password123');
        return {
          id: 'user-1',
          email,
          createdAt: new Date('2026-01-01T00:00:00Z'),
        };
      },
    },
  });
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: 'test@example.com', password: 'password123' },
  });
  assert.equal(response.statusCode, 201);
  assert.equal(response.json().email, 'test@example.com');
  assert.equal(response.json().passwordHash, undefined);
  await app.close();
});

test('rechaza datos de registro inválidos', async () => {
  const app = buildApp({
    authService: {
      async registerUser() {
        throw new Error('No debe guardar datos inválidos');
      },
    },
  });
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: 'correo-invalido', password: 'corta' },
  });
  assert.equal(response.statusCode, 400);
  await app.close();
});

test('responde 409 si el correo ya existe', async () => {
  const app = buildApp({
    authService: {
      async registerUser() {
        throw new AppError(409, 'EMAIL_IN_USE', 'Este correo ya está registrado.');
      },
    },
  });
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: 'test@example.com', password: 'password123' },
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.json().error.code, 'EMAIL_IN_USE');
  await app.close();
});

test('rechaza contraseñas numéricas, arreglos y textos de más de 128 caracteres', async (t) => {
  const registerUser = t.mock.fn(async () => {
    throw new Error('No debe guardar datos inválidos');
  });
  const app = buildApp({ authService: { registerUser } });
  t.after(() => app.close());

  for (const password of [12345678, ['password123'], '😀'.repeat(129)]) {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'test@example.com', password },
    });
    assert.equal(response.statusCode, 400);
  }
  assert.equal(registerUser.mock.callCount(), 0);
});

test('rechaza campos adicionales sin llamar al servicio', async (t) => {
  const registerUser = t.mock.fn(async () => {
    throw new Error('No debe ejecutarse');
  });
  const app = buildApp({ authService: { registerUser } });
  t.after(() => app.close());
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email: 'test@example.com',
      password: 'password123',
      role: 'admin',
    },
  });
  assert.equal(response.statusCode, 400);
  assert.equal(registerUser.mock.callCount(), 0);
});

test('limita los intentos de registro por cliente', async (t) => {
  const registerUser = t.mock.fn(async (email: string) => ({
    id: 'user-1',
    email,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  }));
  const app = buildApp({ authService: { registerUser } });
  t.after(() => app.close());
  for (let i = 0; i < 5; i++) {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'test@example.com', password: 'password123' },
    });
    assert.equal(response.statusCode, 201);
  }
  const blocked = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: { email: 'test@example.com', password: 'password123' },
  });
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.json().error.code, 'RATE_LIMITED');
  assert.equal(registerUser.mock.callCount(), 5);
  assert.equal((await app.inject({ method: 'GET', url: '/health' })).statusCode, 200);
});
