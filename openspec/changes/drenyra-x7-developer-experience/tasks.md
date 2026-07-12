# X7: Developer Experience & Onboarding — Tasks

**Estado:** tasks
**Creado:** 2026-07-11

---

## PR1: Doctor Command + Quickstart

### `[ ] T1: Crear scripts/dev/doctor.sh`

- [ ] Implementar `scripts/dev/doctor.sh` con checks:
  - Tools: bun, docker, go, python
  - Docker: containers running (db, engram, nats)
  - Services: DB connect, Engram health
  - Ports: 5436, 6379, 4222, 3000, 5174
  - Env: .env presente, vars requeridas
  - Dependencies: node_modules
  - Git: hooks instalados
- [ ] Output coloreado con emojis y resumen
- [ ] Exit code: 0 si todo ok, 1 si hay errors
- [ ] `--help` flag

**Archivos:** `scripts/dev/doctor.sh`
**Estimado:** ~150 líneas

### `[ ] T2: Agregar script en package.json`

- [ ] Agregar `"doctor": "bash scripts/dev/doctor.sh"` en root `package.json`

**Archivos:** `package.json`
**Estimado:** 1 línea

### `[ ] T3: Crear scripts/dev/quickstart.sh`

- [ ] Implementar `scripts/dev/quickstart.sh`:
  - Check prerequisites (bun, docker)
  - `bun install`
  - `docker compose up -d postgres drenyra-engram nats`
  - `bun run db:push`
  - `bun run auth:bootstrap:demo`
  - Mensaje final con URLs
- [ ] Flags: `--no-db`, `--no-docker`, `--ci`, `--help`

**Archivos:** `scripts/dev/quickstart.sh`
**Estimado:** ~80 líneas

---

## PR2: Developer Guides + PR Template

### `[ ] T4: Crear docs/development/getting-started.md`

- [ ] Setup completo: prerequisites, clone, install, run
- [ ] Comandos básicos: dev, test, lint, typecheck
- [ ] Troubleshooting común

**Archivos:** `docs/development/getting-started.md`
**Estimado:** ~300 palabras

### `[ ] T5: Crear docs/development/how-to-add-a-feature.md`

- [ ] Pipeline: domain → application → API → web
- [ ] Ejemplo concreto (ej: agregar "Tipo de documento")
- [ ] Checklist de archivos a crear/tocar

**Archivos:** `docs/development/how-to-add-a-feature.md`
**Estimado:** ~500 palabras

### `[ ] T6: Crear docs/development/how-to-write-a-test.md`

- [ ] Unit tests (Vitest): estructura, describe/it, mocks
- [ ] Integration tests: DB, API
- [ ] Property-based tests: fast-check
- [ ] Patrones: Arrange/Act/Assert, fábricas

**Archivos:** `docs/development/how-to-write-a-test.md`
**Estimado:** ~400 palabras

### `[ ] T7: Crear docs/development/how-to-debug.md`

- [ ] Logs: pino, niveles, filtros
- [ ] API: bun --inspect, Chrome DevTools
- [ ] Web: React DevTools, Vite HMR
- [ ] DB: drizzle studio, pgAdmin

**Archivos:** `docs/development/how-to-debug.md`
**Estimado:** ~300 palabras

### `[ ] T8: Crear docs/development/conventions.md`

- [ ] Naming: camelCase, PascalCase, kebab-case para archivos
- [ ] Imports: path aliases (@/), barrel exports
- [ ] Providers: jerarquía de context
- [ ] Git: conventional commits, branch naming

**Archivos:** `docs/development/conventions.md`
**Estimado:** ~400 palabras

### `[ ] T9: Mejorar PR template`

- [ ] Agregar sección "Fiscal correctness"
- [ ] Agregar "Review path" y "Workload forecast"
- [ ] Mantener español

**Archivos:** `.github/pull_request_template.md`
**Estimado:** ~20 líneas

---

## Resumen

| Task | Archivos                                   | Estimado     | Depende de |
| ---- | ------------------------------------------ | ------------ | ---------- |
| T1   | `scripts/dev/doctor.sh`                    | 150 líneas   | —          |
| T2   | `package.json`                             | 1 línea      | T1         |
| T3   | `scripts/dev/quickstart.sh`                | 80 líneas    | —          |
| T4   | `docs/development/getting-started.md`      | 300 palabras | —          |
| T5   | `docs/development/how-to-add-a-feature.md` | 500 palabras | —          |
| T6   | `docs/development/how-to-write-a-test.md`  | 400 palabras | —          |
| T7   | `docs/development/how-to-debug.md`         | 300 palabras | —          |
| T8   | `docs/development/conventions.md`          | 400 palabras | —          |
| T9   | `.github/pull_request_template.md`         | 20 líneas    | —          |

**Total estimado:** ~230 líneas de script + ~1900 palabras de documentación + 20 líneas de template
