import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import { AppError, registerErrorHandlers } from './errors.js';

test('devuelve errores de negocio con su código y mensaje', async () => {
  const app = Fastify();
  registerErrorHandlers(app);
  app.get('/test', () => {
    throw new AppError(409, 'INVALID_STATE', 'Estado inválido.');
  });
  const response = await app.inject({ method: 'GET', url: '/test' });
  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.json(), {
    error: { code: 'INVALID_STATE', message: 'Estado inválido.' },
  });
  await app.close();
});

test('oculta los detalles de errores inesperados', async () => {
  const app = Fastify();
  registerErrorHandlers(app);
  app.get('/test', () => {
    throw new Error('detalle interno');
  });
  const response = await app.inject({ method: 'GET', url: '/test' });
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.json(), {
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error interno.' },
  });
  await app.close();
});

test('responde con un mensaje claro cuando el JSON es inválido', async () => {
  const app = Fastify();
  registerErrorHandlers(app);
  app.post('/test', () => ({ ok: true }));
  const response = await app.inject({
    method: 'POST',
    url: '/test',
    headers: { 'content-type': 'application/json' },
    payload: '{',
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, 'INVALID_REQUEST');
  await app.close();
});

test('conserva el código 415 cuando el tipo de contenido no está soportado', async () => {
  const app = Fastify();
  registerErrorHandlers(app);
  app.post('/test', () => ({ ok: true }));
  const response = await app.inject({
    method: 'POST',
    url: '/test',
    headers: { 'content-type': 'application/desconocido' },
    payload: 'datos',
  });
  assert.equal(response.statusCode, 415);
  assert.equal(response.json().error.code, 'INVALID_REQUEST');
  await app.close();
});
