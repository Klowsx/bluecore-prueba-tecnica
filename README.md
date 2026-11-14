# Prueba técnica Bluecore

## Ejecución con Docker

Requisitos: Docker Desktop (con el motor iniciado) y Docker Compose.

Desde la raíz del proyecto ejecuta:

```bash
docker compose up --build
```

- Frontend: http://localhost:4200
- Estado del backend: http://localhost:3000/health
- PostgreSQL: localhost:5432

Compose utiliza credenciales de ejemplo para desarrollo local. Para cambiarlas, crea un archivo `.env` en la raíz con `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` antes de iniciar los contenedores.

No es necesario crear un archivo `.env` para iniciar con los valores de ejemplo. Al iniciar, el backend aplica automáticamente las migraciones existentes con `prisma migrate deploy` antes de arrancar el servidor.

Para detener los servicios, pulsa Ctrl+C y ejecuta `docker compose down`. Los datos de PostgreSQL se conservan en un volumen. `docker compose down -v` también elimina ese volumen y sus datos.
