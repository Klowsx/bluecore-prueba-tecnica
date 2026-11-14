import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from './app.js';
import { AppError } from './errors.js';
import type { AuthRoutesOptions } from './auth/auth.routes.js';
import { requireAuth } from './auth/require-auth.js';

function buildTestApp({ authService }: { authService: Partial<AuthRoutesOptions['authService']> }) {
  const unexpectedCall = async () => {
    throw new Error('Llamada inesperada al servicio');
  };
  return buildApp({
    jwtSecret: 'clave-para-pruebas',
    authService: { registerUser: unexpectedCall, loginUser: unexpectedCall, ...authService },
  });
}

test('el token del login permite acceder a una ruta protegida durante una hora', async (t) => {
  const app = buildTestApp({ authService: { loginUser: async () => 'usuario-1' } });
  t.after(() => app.close());
  app.get('/privada', { onRequest: requireAuth }, async (request) => request.user);

  const login = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email: 'usuario@example.com',
      password: '12345',
    },
  });
  assert.equal(login.statusCode, 200);
  const { accessToken } = login.json();
  const response = await app.inject({
    url: '/privada',
    headers: { authorization: `Bearer ${accessToken}` },
  });
  assert.equal(response.statusCode, 200);
  const { sub, exp, iat } = response.json();
  assert.equal(sub, 'usuario-1');
  assert.equal(exp - iat, 3600);

  const expired = app.jwt.sign({ sub: 'usuario-1', iat: iat - 7200 });
  for (const authorization of [
    '',
    'Bearer inválido',
    `Bearer ${expired}`,
    `Bearer ${accessToken}x`,
  ]) {
    const denied = await app.inject({
      url: '/privada',
      headers: authorization ? { authorization } : {},
    });
    assert.equal(denied.statusCode, 401);
    assert.equal(denied.json().error.code, 'UNAUTHORIZED');
  }
});

test('el login valida los datos y limita los intentos por cliente', async (t) => {
  const app = buildTestApp({ authService: {} });
  t.after(() => app.close());
  const invalidLogin = () => app.inject({ method: 'POST', url: '/auth/login', payload: {} });
  for (let i = 0; i < 5; i++) assert.equal((await invalidLogin()).statusCode, 400);
  const blocked = await invalidLogin();
  assert.equal(blocked.statusCode, 429);
  assert.equal(blocked.json().error.code, 'RATE_LIMITED');
});

test('registra un usuario y responde con sus datos públicos', async () => {
  const app = buildTestApp({
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
  const app = buildTestApp({
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
  const app = buildTestApp({
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
  const app = buildTestApp({ authService: { registerUser } });
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
  const app = buildTestApp({ authService: { registerUser } });
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
  const app = buildTestApp({ authService: { registerUser } });
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
