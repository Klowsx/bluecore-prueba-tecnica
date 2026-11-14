import Fastify from "fastify";
import { registerErrorHandlers } from "./errors.js";
import { prisma } from "./prisma.js";

const app = Fastify({ logger: true });
registerErrorHandlers(app);

app.get("/health", async () => ({ status: "ok" }));

app.addHook("onClose", async () => {
  await prisma.$disconnect();
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void app
      .close()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        app.log.error(error);
        process.exit(1);
      });
  });
}

try {
  await prisma.$connect();
  await app.listen({ port: 3000, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  await prisma.$disconnect();
  process.exit(1);
}
