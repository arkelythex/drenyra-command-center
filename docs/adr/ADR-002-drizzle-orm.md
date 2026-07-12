# ADR-002: Drizzle ORM para Base de Datos

**Estado:** Aceptado
**Fecha:** 2026-04-15
**Decisores:** Equipo Drenyra

## Contexto

Drenyra necesita un ORM para PostgreSQL que sea type-safe, performante, y que permita consultas complejas fiscales sin sacrificar control del SQL. El dominio fiscal requiere joins multi-tabla, window functions, y queries optimizadas.

## Opciones Consideradas

1. **Drizzle ORM** — type-safe, SQL-like, zero abstraction, generación de migrations
2. **Prisma** — type-safe, pero genera cliente aparte, más lento en queries complejas
3. **TypeORM** — maduro, pero decorators verbose, type-safety débil
4. **Kysely** — type-safe, SQL puro, pero sin migrations integradas
5. **Raw SQL + pg** — máximo control, pero sin type-safety en queries

## Decisión

Drizzle ORM.

**Razones:**

- Type-safe nativo (los schemas son tipos, no se genera cliente aparte)
- SQL-like: las queries se escriben como SQL, no como ORM abstraction
- Migraciones con `drizzle-kit`: push/pull, generación, studio
- Relaciones explícitas (no automáticas como Prisma)
- Bundle pequeño, sin runtime pesado

## Consecuencias

**Positivas:**

- Consultas fiscales complejas se escriben naturalmente (joins, window functions)
- Migraciones sin fricción (db:push para dev, db:migrate para prod)
- Drizzle Studio para explorar datos

**Negativas:**

- Menos comunidad que Prisma
- Las relaciones no se cargan automáticamente (hay que hacer join explícito)
- El schema de Drizzle no es tan expresivo como Prisma para relaciones complejas

## Impacto Fiscal

Bajo — las queries fiscales se benefician del control SQL directo.

## Supersedes

N/A
