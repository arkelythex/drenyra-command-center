# X7: Developer Experience & Onboarding

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** S6 (Docs Cleanup — working-draft), P4 (CI/CD — proposal)
**PRs estimados:** 2
**Líneas estimadas:** ~300

---

## Problema

El proyecto tiene 60+ cambios SDD, 14+ packages, 4 apps, 4 stacks distintos. Para un developer nuevo:

1. El onboarding es lento: "¿Dónde empiezo? ¿Qué necesito instalar? ¿Cómo contribuyo?"
2. No hay un `doctor` command que verifique que todo está bien configurado
3. Los errores de setup son silenciosos (redis ocupado, puertos en conflicto)
4. No hay templates de PR/commit estandarizados
5. No hay guías de "cómo agregar X" (feature, ruta, paquete)

## Solución Propuesta

### PR1: Doctor Command + Onboarding Script

```bash
# scripts/dev/doctor.sh
# Verifica:
#   - Docker running + containers saludables
#   - Puertos requeridos libres (5436, 6379, 3000, 5174, 4222)
#   - Node/Bun/Go/Python versiones correctas
#   - .env completo (variables requeridas)
#   - Lockfiles sincronizados
#   - Git hooks instalados
#   - Node_modules / .venv existentes
#   - Permisos de Docker (usuario en grupo docker)
```

```bash
bun run doctor
# ✅ Docker running (drenyra-db, drenyra-engram, drenyra-nats)
# ✅ Bun 1.3.11 (>=1.3.0)
# ✅ Go 1.22 (>=1.21)
# ✅ Python 3.11 (>=3.11)
# ✅ .env: 12/12 variables presentes
# ✅ PostgreSQL conectable (arkelythex)
# ⚠️  Redis en host (no Docker) — ok
```

**Quickstart script:**

```bash
# scripts/dev/quickstart.sh
git clone <repo>
cd Drenyra
./scripts/dev/quickstart.sh
# 1. bun install
# 2. uv sync (data-engine)
# 3. go mod download (CLI)
# 4. docker compose up -d postgres redis nats engram
# 5. bun run db:push
# 6. bun run auth:bootstrap:demo
# 7. bun run dev
# → http://localhost:5174 🎉
```

### PR2: Developer Guides + PR/Commit Templates

**Guías en `docs/development/`:**

- `getting-started.md` — Setup de 0 a dev server corriendo (ya existe parcialmente)
- `how-to-add-a-feature.md` — Paso a paso: domain → application → API → web
- `how-to-write-a-test.md` — Patrones de test, mocking, integration vs unit
- `how-to-debug.md` — Debugging API/web/CLI, logs, breakpoints
- `conventions.md` — Naming, imports, barrel exports, provider hierarchy

**PR Template:**

```markdown
## Summary

<!-- Una línea: qué cambia y por qué -->

## Scope

<!-- Archivos tocados Y no tocados -->

## Fiscal correctness

<!-- [ ] Invariantes fiscales cubiertas
     [ ] Tests actualizados
     [ ] Cross-stack: TS + Go + Python -->

## Review path

<!-- Por dónde empezar a revisar -->

## Workload forecast

<!-- ~XXX líneas, ~XX min de review -->
```

**Commit convention:**

```
feat(scoped): descripción en inglés, presente imperativo

- bullet points con cambios clave
- referencia a issue/plan si aplica

Fiscal: invariante X cubierta, tests actualizados
```

## Criterios de Aceptación

- [ ] `bun run doctor` funciona y da diagnóstico completo
- [ ] `scripts/dev/quickstart.sh` funciona de 0 a dev server en <5 pasos
- [ ] 5 guías de desarrollo en `docs/development/`
- [ ] PR template implementado en `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] Commit convention documentada y verificable

## Riesgos

- **Bajo**: Scripts pueden fallar en diferentes entornos (Linux vs macOS)
- **Bajo**: Guías pueden quedar obsoletas si no se actualizan

## Review Workload Forecast

| PR                       | Líneas | Review time | Reviewer  |
| ------------------------ | ------ | ----------- | --------- |
| PR1: Doctor + quickstart | ~200   | 15 min      | DevOps    |
| PR2: Guides + templates  | ~100   | 10 min      | Full team |
