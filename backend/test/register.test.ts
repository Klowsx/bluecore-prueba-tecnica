import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { buildApp } from "../src/app.js";

test("registra con 128 caracteres Unicode y rechaza el mismo correo con otra capitalización", async (t) => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  assert.ok(
    databaseUrl,
    "Configura TEST_DATABASE_URL con una base de pruebas migrada.",
  );
  process.env.DATABASE_URL = databaseUrl;
  const authService = await import("../src/auth/auth.service.js");
  const { prisma } = await import("../src/prisma.js");

  const app = buildApp({ authService });
  const email = `Ana-${randomUUID().replaceAll("-", "")}@example.com`;
  const password = "😀".repeat(128);
  t.after(async () => {
    try {
      await prisma.user.deleteMany({ where: { email: email.toLowerCase() } });
    } finally {
      await app.close();
      await prisma.$disconnect();
    }
  });

  const created = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email, password },
  });
  assert.equal(created.statusCode, 201);
  assert.equal(created.json().email, email.toLowerCase());

  const duplicate = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { email: email.toLowerCase(), password },
  });
  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.json().error.code, "EMAIL_IN_USE");
});
