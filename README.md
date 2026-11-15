# Prueba técnica Bluecore — Gestión de solicitudes de crédito

## Índice

- [Datos del candidato](#datos-del-candidato)
- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Base de datos](#base-de-datos)
- [Prueba manual](#prueba-manual)
- [Pruebas automáticas](#pruebas-automáticas)

## Datos del candidato

| Campo             | Valor                                                                               |
| ----------------- | ----------------------------------------------------------------------------------- |
| Nombre completo   | Javier Hernandez                                                                    |
| Correo            | javierh3r@gmail.com                                                                 |
| Usuario de GitHub | [@Klowsx](https://github.com/Klowsx)                                                |
| Repositorio       | [Klowsx/bluecore-prueba-tecnica](https://github.com/Klowsx/bluecore-prueba-tecnica) |

## Descripción

Aplicación full stack para crear solicitudes de crédito con monto, plazo y cédula, listar y filtrar por estado, y aprobar o rechazar con un comentario. El frontend en Angular consume una API REST protegida con JWT, con registro e inicio de sesión.

El backend valida montos de $500 a $50,000 y plazos enteros de 6 a 60 meses. Las solicitudes se guardan en PostgreSQL y los errores se muestran con mensajes legibles en el frontend.

## Tecnologías

| Capa            | Tecnologías                                      |
| --------------- | ------------------------------------------------ |
| Backend         | Node.js 24, TypeScript, Fastify 5, Prisma 7, JWT |
| Frontend        | Angular 22, TypeScript, Vitest                   |
| Base de datos   | PostgreSQL 17                                    |
| Infraestructura | Docker y Docker Compose                          |

## Requisitos

- Git y acceso al repositorio privado.
- Docker Desktop iniciado con contenedores Linux y Docker Compose v2.
- Conexión a Internet para descargar imágenes y dependencias.
- Puertos libres: `4200`, `3000` y `5432`.

Node.js, npm y PostgreSQL se ejecutan dentro de los contenedores; no necesitas instalarlos en tu máquina.

## Instalación y ejecución

1. Clona el repositorio y entra en la carpeta:

   ```bash
   git clone https://github.com/Klowsx/bluecore-prueba-tecnica.git
   cd bluecore-prueba-tecnica
   ```

   Ejecuta los siguientes comandos desde esta carpeta.

2. Copia la plantilla de configuración:

   ```bash
   cp .env.example .env
   ```

   En PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Completa el `.env` de la raíz:

   ```dotenv
   POSTGRES_USER=bluecore
   POSTGRES_PASSWORD=<tu-clave-local>
   POSTGRES_DB=bluecore
   JWT_SECRET=<tu-secreto-aleatorio>
   ```

   Sustituye los valores entre `<...>` por valores propios, sin los signos. Usa usuario, contraseña y nombre de base alfanuméricos, ya que se interpolan en la URL de conexión. Para JWT, genera un secreto aleatorio de al menos 32 bytes. Las cuatro variables son obligatorias. El archivo `.env` está excluido de Git; no publiques credenciales.

4. Valida la configuración e inicia los servicios:

   ```bash
   docker compose config --quiet
   docker compose up --build -d
   ```

   PostgreSQL crea la base automáticamente y el backend aplica las migraciones y genera el cliente Prisma al arrancar. La primera construcción puede tardar varios minutos.

5. Comprueba el arranque:

   ```bash
   docker compose ps
   ```

   Espera a ver la base como `healthy`, `Server listening` en el backend y `Local: http://localhost:4200/` en el frontend.

6. Abre [la aplicación](http://localhost:4200). El [estado del backend](http://localhost:3000/health) debe devolver `{"status":"ok"}`. No hay usuarios precargados: entra a [Registro](http://localhost:4200/registro), crea una cuenta e inicia sesión.

Para detener los servicios conservando los datos:

```bash
docker compose down
```

Para iniciarlos nuevamente:

```bash
docker compose up -d
```

## Base de datos

Se utiliza PostgreSQL local en Docker. Las variables `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` del `.env` configuran el usuario, la contraseña y la base en su primera inicialización.

Compose construye e inyecta `DATABASE_URL` al backend con el formato `postgresql://<usuario>:<contraseña>@db:5432/<base>?schema=public`. No necesitas añadirla al `.env` de la raíz. Para conectar un cliente SQL desde tu máquina, usa `localhost:5432` con los valores de tu `.env`.

Los modelos están en [backend/prisma/schema.prisma](backend/prisma/schema.prisma) y las migraciones versionadas en [backend/prisma/migrations](backend/prisma/migrations). El backend ejecuta `prisma migrate deploy` al arrancar. Puedes comprobarlas con:

```bash
docker compose exec -T backend npx prisma migrate status
```

Los datos persisten en el volumen `postgres_data`. Cambiar las variables de PostgreSQL en `.env` no modifica las credenciales de una base ya inicializada. Para reiniciar desde cero, `docker compose down -v` **borra todos los datos locales**; luego vuelve a ejecutar `docker compose up -d`.

## Prueba manual

1. Registra una cuenta con correo válido y contraseña de al menos 5 caracteres e inicia sesión.
2. Pulsa **Nueva solicitud** y crea una con monto de $500 a $50,000, plazo de 6 a 60 meses y cédula.
3. Comprueba que aparece como pendiente y prueba los filtros por estado.
4. Pulsa **Gestionar**, elige **Aprobar** y escribe un comentario.
5. Crea otra solicitud y repite el proceso con **Rechazar**. Verifica ambos estados con los filtros.
6. Recarga la página para comprobar que las solicitudes y decisiones se mantienen.

El contrato de la API está documentado en [ENDPOINTS.md](ENDPOINTS.md). Las rutas de solicitudes requieren `Authorization: Bearer <token>`; el token se obtiene al iniciar sesión.

## Pruebas automáticas

Con los servicios iniciados, ejecuta desde la raíz:

```bash
docker compose exec -T backend npm test
docker compose exec -T frontend npm test -- --watch=false
```

El backend prueba contraseñas, autenticación, validaciones y errores HTTP; el frontend prueba el acceso y el flujo de login, listado y filtros.

Para las pruebas de integración con PostgreSQL, crea una base separada una sola vez (si ya existe, continúa):

```bash
docker compose exec -T db sh -c 'createdb -U $POSTGRES_USER bluecore_test'
```

Aplica sus migraciones y ejecuta las pruebas:

```bash
docker compose exec -T backend sh -c 'export DATABASE_URL=${DATABASE_URL%/*}/bluecore_test?schema=public; export TEST_DATABASE_URL=$DATABASE_URL; npx prisma migrate deploy && npm run test:integration'
```

Conserva las comillas simples también en PowerShell. Las pruebas de integración comprueban registro/login, creación, filtros y cambios de estado contra la base `bluecore_test`. Todos los comandos de pruebas deben terminar sin fallos y con código de salida `0`.
