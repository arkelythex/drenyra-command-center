# X7: Developer Experience & Onboarding — Design

**Estado:** design
**Creado:** 2026-07-11

---

## 1. Arquitectura

### 1.1 PR1: Doctor Command

```
scripts/dev/doctor.sh  (bash entry point)
  └── llama a funciones en scripts/dev/doctor-lib/ (modular)
        ├── check-tools.sh     — Bun, Docker, Go, Python
        ├── check-docker.sh    — containers, ports
        ├── check-services.sh  — API, Engram, DB health
        ├── check-env.sh       — .env vars
        ├── check-deps.sh      — node_modules, .venv
        └── check-git.sh       — hooks, branch

package.json:
  "doctor": "bash scripts/dev/doctor.sh"

dev-check.ts (existente):
  Se mantiene — es el check programático para CI
  doctor.sh es la versión humana e interactiva
```

**Output design:** coloreado, emojis, agrupado por categoría, resumen al final.

### 1.2 PR1: Quickstart

```
scripts/dev/quickstart.sh
  → Script secuencial con flags:
    --no-db     (skip db push + seed)
    --no-docker (skip docker compose)
    --ci        (non-interactive, fail fast)
```

### 1.3 PR2: Developer Guides

```
docs/development/
  ├── getting-started.md
  ├── how-to-add-a-feature.md
  ├── how-to-write-a-test.md
  ├── how-to-debug.md
  └── conventions.md
```

Cada guía:

- Frontmatter YAML con `title`, `description`, `last-verified`, `audience`
- Lenguaje: español (consistente con el proyecto)
- Tono: warm teaching, ejemplos concretos

### 1.4 PR2: PR Template

Modificar `.github/pull_request_template.md` existente:

- Mantener estructura actual en español
- Agregar sección "Fiscal correctness" entre Checklist y OpenSpec
- Agregar "Review path" y "Workload forecast" al final

---

## 2. Flujo de uso

### Developer nuevo

```text
1. git clone <repo>
2. cd Drenyra
3. ./scripts/dev/quickstart.sh
   → bun install, docker compose up, db:push, seed
4. bun run doctor  → verifica que todo funciona
5. bun run dev     → API + Web corriendo
```

### Developer experimentado

```text
bun run doctor   → diagnóstico rápido cuando algo no funciona
```

---

## 3. Decisiones técnicas

| Decisión                        | Opción      | Por qué                                        |
| ------------------------------- | ----------- | ---------------------------------------------- |
| Shell script vs TS para doctor  | **Bash**    | Sin dependencias de runtime, arranca siempre   |
| Mantener dev-check.ts existente | **Sí**      | Es usado en CI y tiene retry lógica            |
| Guías en español o inglés       | **Español** | Consistente con PR template existente y equipo |
| Frontmatter en guías            | **YAML**    | Para `docs:verify` y eventual indexación       |
