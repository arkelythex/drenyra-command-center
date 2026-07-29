# 10 — Development

**Última actualización:** 2026-07-27
**Propósito:** Guías de desarrollo, convenciones, debugging, testing
**Audiencia:** Todo desarrollador trabajando en Drenyra

---

## Guías

| Guía                                              | Descripción                             |
| ------------------------------------------------- | --------------------------------------- |
| [Getting Started](./getting-started.md)           | Setup del entorno, Bun, monorepo        |
| [Conventions](./conventions.md)                   | Convenciones de código, estilo, commits |
| [How to Add a Feature](./how-to-add-a-feature.md) | Proceso end-to-end para nuevas features |
| [How to Write a Test](./how-to-write-a-test.md)   | Testing patterns, property-based        |
| [Test Patterns](./test-patterns.md)               | Patrones específicos de testing         |
| [How to Debug](./how-to-debug.md)                 | Debugging tools, techniques             |
| [Go-TS Contracts](./go-ts-contracts.md)           | Contratos entre Go y TypeScript         |
| [Engram Guide](./engram-guide.md)                 | Uso de memoria persistente Engram       |

---

## Stack de desarrollo

| Herramienta            | Versión | Propósito                             |
| ---------------------- | ------- | ------------------------------------- |
| Bun                    | 1.3.11  | Runtime, package manager, test runner |
| Turborepo              | latest  | Monorepo orchestration                |
| TypeScript             | 5.x     | Lenguaje principal                    |
| Elysia                 | latest  | API framework                         |
| React + TanStack Start | 19      | Frontend                              |
| PostgreSQL             | 16      | Base de datos                         |
| Temporal               | latest  | Workflows durables                    |
| NATS JetStream         | latest  | Event bus                             |

---

## Comandos comunes

```bash
# Instalación
bun install --frozen-lockfile

# Desarrollo
bun run dev

# Testing
bun run test
bun run test --filter=@drenyra/domain

# Type checking
bun run typecheck

# Linting
bun run lint
bun run lint:all

# Documentación
bun run docs:verify
```

---

## Documentos migrados

| Anterior                                          | Nueva ubicación             |
| ------------------------------------------------- | --------------------------- |
| `docs/development/getting-started.md`             | `./getting-started.md`      |
| `docs/development/conventions.md`                 | `./conventions.md`          |
| `docs/development/how-to-add-a-feature.md`        | `./how-to-add-a-feature.md` |
| `docs/development/how-to-write-a-test.md`         | `./how-to-write-a-test.md`  |
| `docs/development/test-patterns.md`               | `./test-patterns.md`        |
| `docs/development/how-to-debug.md`                | `./how-to-debug.md`         |
| `docs/05-development/go-ts-contracts.md`          | `./go-ts-contracts.md`      |
| `docs/05-development/engram-project-canonical.md` | `./engram-guide.md`         |
| `docs/05-development/drenyra-repo-sync.md`        | `./drenyra-repo-sync.md`    |
