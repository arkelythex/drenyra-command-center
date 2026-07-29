# ADR-001: Bun + Elysia para API Backend

**Estado:** Aceptado
**Fecha:** 2026-04-15
**Decisores:** Equipo Drenyra

## Contexto

Drenyra necesita un backend rápido, con tipo seguro de punta a punta, validación de esquemas integrada, y buen soporte para el ecosistema TypeScript. El backend expone 42+ features fiscales, autenticación, y sirve como contrato para el frontend web y CLI.

## Opciones Consideradas

1. **Bun + ElysiaJS** — runtime rápido, Elysia con tipos inferidos, Eden Treaty para frontend
2. **Node.js + Express/Fastify** — ecosistema maduro, más lento, más boilerplate (Zod + Swagger separados)
3. **Node.js + tRPC** — tipo seguro, pero binding muy fuerte backend-frontend
4. **Go + Gin/Fiber** — rendimiento superior, pero sin tipo compartido con frontend TS

## Decisión

Bun + ElysiaJS.

**Razones:**

- Rendimiento 3-5x vs Node.js en benchmarks de inicio
- Tipo seguro end-to-end con Eden Treaty: los tipos del backend se consumen en el frontend sin generar stubs
- Schemas integrados en Elysia (t()): reemplaza Zod + Swagger + validación manual
- Hot reload nativo (bun --watch)
- Bundle binario para deploy sin Node.js runtime

## Consecuencias

**Positivas:**

- API types compartidos con frontend sin herramienta externa
- Menos boilerplate que Express + Zod + Swagger (todo es Elysia)
- Build binario para producción

**Negativas:**

- Ecosistema más pequeño que Node.js (menos middlewares, menos documentación)
- Dependencia de Bun runtime (menos portabilidad)
- Team necesita aprender Elysia (curva inicial)

## Impacto Fiscal

Ninguno — es decisión de infraestructura.

## Supersedes

N/A — primera decisión.
