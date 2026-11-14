# Prueba técnica Bluecore

## Ejecución con Docker

Requisitos: Docker Desktop (con el motor iniciado) y Docker Compose.

1. Desde la raíz, copia `.env.example` a `.env`. Este es el único archivo de entorno que necesitas. Docker Compose pasa la configuración al backend y a PostgreSQL.
2. Completa las variables de `.env`. Para `JWT_SECRET`, usa una clave de al menos 32 bytes aleatorios.
3. Valida la configuración y arranca los servicios.

```bash
docker compose config --quiet
docker compose up --build
```

- Frontend: http://localhost:4200
- Estado del backend: http://localhost:3000/health
- PostgreSQL: localhost:5432

Para detener los servicios, pulsa Ctrl+C y ejecuta `docker compose down`. Los datos de PostgreSQL se conservan en un volumen. `docker compose down -v` también elimina ese volumen y sus datos.
