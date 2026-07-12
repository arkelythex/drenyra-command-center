# X8: Architecture Decision Records (ADRs)

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** — (independiente)
**PRs estimados:** 1
**Líneas estimadas:** ~200

---

## Problema

Drenyra tiene decisiones arquitectónicas importantes que no están documentadas explícitamente:

1. ¿Por qué se eligió Bun + Elysia sobre Express/Fastify?
2. ¿Por qué se usa Drizzle y no Prisma/TypeORM?
3. ¿Por qué se eligió TanStack Router sobre React Router / Next.js?
4. ¿Por qué React Context + Zustand y no solo Zustand / Jotai / Redux?
5. ¿Por qué Go para el CLI y no Rust/Python/Bun?
6. ¿Por qué el dominio está en packages separados y no en app?
7. ¿Cómo se decidió el patrón vertical slice vs hexagonal?

Cuando un nuevo developer (o IA) pregunta "¿por qué esto es así?", no hay respuesta escrita. Las decisiones se pierden en conversaciones, PRs y docs de filosofía que no están conectados.

## Solución Propuesta

### PR1: ADR Process + Initial Records

**Formato ADR** (basado en Michael Nygard, 2026 best practices):

```markdown
# ADR-001: Bun + Elysia para API Backend

**Estado:** Aceptado | Propuesto | Deprecado
**Fecha:** 2026-04-15
**Decisores:** [Personas/Equipo]

## Contexto

Drenyra necesita un backend rápido, tipado, con buen soporte para
validación de esquemas y compatibilidad con el ecosistema TypeScript.

## Opciones Consideradas

1. Bun + ElysiaJS
2. Node.js + Express/Fastify
3. Node.js + tRPC
4. Go + Gin/Fiber

## Decisión

Bun + ElysiaJS — por: rendimiento (3x vs Node), tipo seguridad
end-to-end con Eden Treaty, schemas integrados (no Zod separado),
built-in Swagger, hot reload nativo.

## Consecuencias

Positivas:

- API types compartidos con frontend (Eden Treaty)
- Menos boilerplate que Express + Zod + Swagger
- Bundle binario para deploy

Negativas:

- Ecosistema más pequeño que Node.js
- Dependencia de Bun runtime (menos portable)
- Team necesita aprender Elysia

## Fiscal Impact

Ninguno — es una decisión de infraestructura.

## Supersedes

N/A — es la primera decisión.
```

**ADR iniciales a crear:**

| #   | Decisión                                              | Prioridad |
| --- | ----------------------------------------------------- | --------- |
| 001 | Bun + Elysia para API                                 | ALTA      |
| 002 | Drizzle ORM sobre Prisma/TypeORM                      | ALTA      |
| 003 | TanStack Router sobre React Router / Next.js          | ALTA      |
| 004 | Vertical Slices + CQRS en API                         | ALTA      |
| 005 | Domain Package (framework-free) + Application Package | ALTA      |
| 006 | React Context + Zustand sobre estado global único     | MEDIA     |
| 007 | Go para CLI sobre Rust/Python/Bun                     | MEDIA     |
| 008 | Property-Based Testing para invariantes fiscales      | BAJA      |

**Proceso:**

- ADRs se almacenan en `docs/adr/ADR-{NNN}-{titulo}.md`
- Se revisan en cada PR que toca la decisión
- Se actualizan cuando la decisión cambia (estado: deprecated)
- Linkear ADRs en los comentarios de código relevantes

## Criterios de Aceptación

- [ ] 8 ADRs iniciales creados en `docs/adr/`
- [ ] Template de ADR documentado
- [ ] Proceso de revisión de ADR en PR template
- [ ] CI verifica que los ADRs tengan frontmatter válido

## Riesgos

- **Bajo**: ADRs requieren disciplina para mantenerse actualizados
- **Bajo**: Pueden quedar obsoletos si no se revisan periódicamente

## Review Workload Forecast

| PR                     | Líneas | Review time | Reviewer  |
| ---------------------- | ------ | ----------- | --------- |
| PR1: 8 ADRs + template | ~200   | 20 min      | Full team |
