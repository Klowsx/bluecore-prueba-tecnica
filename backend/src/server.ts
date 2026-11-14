import { buildApp } from "./app.js";
import { prisma } from "./prisma.js";
import * as authService from "./auth/auth.service.js";

const app = buildApp({ authService, logger: true });

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
