import type { FastifyInstance } from "fastify";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message },
      });
    }

    if (
      error instanceof Error &&
      "statusCode" in error &&
      typeof error.statusCode === "number" &&
      error.statusCode >= 400 &&
      error.statusCode < 500
    ) {
      return reply.status(error.statusCode).send({
        error: {
          code: "INVALID_REQUEST",
          message: "La solicitud no es válida.",
        },
      });
    }

    request.log.error(
      { err: error },
      "Error inesperado al procesar la solicitud",
    );
    return reply.status(500).send({
      error: { code: "INTERNAL_ERROR", message: "Ocurrió un error interno." },
    });
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "La ruta solicitada no existe." },
    });
  });
}
