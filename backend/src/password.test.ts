import assert from "node:assert/strict";
import { test } from "node:test";
import { hashPassword, verifyPassword } from "./auth/password.js";

test("verifica una contraseña y rechaza una distinta", async () => {
  const hash = await hashPassword("clave-segura-123");
  assert.equal(await verifyPassword("clave-segura-123", hash), true);
  assert.equal(await verifyPassword("contraseña-incorrecta", hash), false);
});

test("genera una sal distinta para la misma contraseña", async () => {
  const first = await hashPassword("clave-segura-123");
  const second = await hashPassword("clave-segura-123");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("clave-segura-123", second), true);
});

test("rechaza hashes mal formados o con un algoritmo desconocido", async () => {
  assert.equal(await verifyPassword("clave", "scrypt:invalido"), false);
  assert.equal(
    await verifyPassword("clave", `otro:${"a".repeat(32)}:${"b".repeat(128)}`),
    false,
  );
  assert.equal(
    await verifyPassword(
      "clave",
      `scrypt:${"a".repeat(32)}:${"z".repeat(128)}`,
    ),
    false,
  );
});
