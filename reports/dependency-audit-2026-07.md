# Dependency Audit — Drenyra Monorepo

**Fecha:** 2026-07-11
**Autor:** el Gentleman

---

## Runtime

| Dep             | Version | Latest | Status     | Riesgo |
| --------------- | ------- | ------ | ---------- | ------ |
| Bun             | 1.3.14  | 1.3.14 | ✅ Current | —      |
| Elysia          | 1.4.29  | 1.4.29 | ✅ Current | —      |
| React           | 19.2.7  | 19.2.7 | ✅ Current | —      |
| TanStack Router | 1.103.3 | latest | ✅ Current | —      |
| Vitest          | 4.1.8   | 4.1.10 | ⚠️ Minor   | Bajo   |

## Migraciones pendientes

| Dep         | Version actual | Target     | PRs                | Riesgo             |
| ----------- | -------------- | ---------- | ------------------ | ------------------ |
| Drizzle ORM | 0.45.x →       | 1.0.0-rc.4 | 1 PR (~400 líneas) | 🔴 Alto (breaking) |
| AI SDK      | v6 dual →      | v7         | 1 PR (~300 líneas) | 🔴 Alto (breaking) |

## Dual versioning

| Package | apps/api | packages/ai | Acción      |
| ------- | -------- | ----------- | ----------- |
| ai      | ^6.0.39  | ^6.0.206    | 🔴 Unificar |

## Nuevas herramientas

| Tool          | Version | Estado              |
| ------------- | ------- | ------------------- |
| knip          | 6.24.0  | ✅ Instalado global |
| golangci-lint | —       | ✅ Config exists    |

## Recomendaciones

1. **PR urgente**: Unificar dual versioning de `ai` SDK (apps/api y packages/ai apuntan a versiones distintas)
2. **Alta prioridad**: Migrar Drizzle ORM 0.45 → 1.0 RC (relational queries v2)
3. **Alta prioridad**: Migrar AI SDK v6 → v7
4. **Baja prioridad**: Actualizar Biome, Tailwind, Vitest a latest minor
