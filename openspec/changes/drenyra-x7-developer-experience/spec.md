# X7: Developer Experience & Onboarding — Spec

**Estado:** spec
**Creado:** 2026-07-11
**Depende de:** — (independiente)
**PRs estimados:** 2
**Líneas estimadas:** ~300

---

## 1. Alcance

### Lo que entra

1. **Comando `bun run doctor`** — script diagnostic que verifica el entorno de desarrollo completo, accesible via `bun run doctor`
2. **Script `scripts/dev/quickstart.sh`** — setup de 0 a dev server en < 5 pasos
3. **Guías de desarrollo** en `docs/development/` (3-5 guías)
4. **Mejora del PR template** existente en `.github/pull_request_template.md`

### Lo que NO entra

- No reescribir el PR template desde cero — se mejora el existente
- No crear un sistema de features flags
- No modificar CI/CD (eso es P4)
- No crear documentación de API (eso es Swagger/docs existente)

---

## 2. PR1: Doctor Command + Quickstart

### 2.1 `bun run doctor`

Basado en `scripts/dev/dev-check.ts` existente pero:

- **Simplificado**: un solo comando, sin env flags
- **Comprensivo**: chequea todo (Docker, tools, env, DB, puertos)
- **Formato legible**: emojis + colores + resumen final

**Qué verifica:**

```
[ENV]      bun doctor v1.0.0

🔧 Tools:
  ✅ Bun 1.3.11 (>=1.3.0)
  ✅ Docker 27.x (running)
  ✅ Go 1.22.x (>=1.21)  [si apps/cli/ existe]
  ✅ Python 3.11.x        [si apps/data-engine/ existe]

🐳 Docker containers:
  ✅ drenyra-db — running (postgres:16)
  ✅ drenyra-engram — running
  ✅ drenyra-nats — running
  ⚠️  drenyra-redis — not found (usando host Redis en :6379)

📡 Services:
  ✅ PostgreSQL — conectable (arkelythex)
  ✅ Engram — saludable (:8733)
  ⚠️  API — no responde (:3000) [ejecutar: bun run dev:api]

🔌 Ports:
  ✅ 5436 — PostgreSQL
  ⚠️  6379 — Redis (en host, no container)
  ✅ 4222 — NATS
  ❌  3000 — API (no listening)
  ❌  5174 — Web (no listening)

📋 Env:
  ✅ .env presente
  ✅ DATABASE_URL configurada
  ✅ 12/12 variables requeridas presentes

📦 Dependencies:
  ✅ node_modules — instalado
  ❌ .venv — no encontrado (data-engine no disponible)

📄 Git:
  ✅ Git hooks instalados (lefthook)
  ✅ En rama: feat/x7-doctor-command

─────────────────────────────────
🔴 2 errors   ⚠️ 3 warnings   ✅ 8 pass
```

**Implementación:**

- Crear `scripts/dev/doctor.sh` (bash — rápido, sin deps de runtime)
- Agregar script en `package.json`: `"doctor": "bash scripts/dev/doctor.sh"`
- Reutilizar lógica de `dev-check.ts` donde sea posible

### 2.2 `scripts/dev/quickstart.sh`

Script interactivo que guía al developer:

```bash
#!/usr/bin/env bash
# Drenyra Quickstart — setup de 0 a dev
set -euo pipefail

echo "🚀 Drenyra Quickstart"
echo "────────────────────"

# 1. Check prerequisites
command -v bun >/dev/null || { echo "❌ Instalá Bun: curl -fsSL https://bun.sh/install | bash"; exit 1; }
command -v docker >/dev/null || { echo "❌ Instalá Docker"; exit 1; }

# 2. Install dependencies
echo "📦 Instalando dependencias..."
bun install

# 3. Start infrastructure
echo "🐳 Levantando servicios..."
docker compose up -d postgres drenyra-engram nats

# 4. Wait for DB
echo "⏳ Esperando PostgreSQL..."
sleep 5

# 5. Push DB schema
echo "🗄️  Aplicando schema..."
bun run db:push

# 6. Seed demo user
echo "👤 Creando usuario demo..."
bun run auth:bootstrap:demo

# 7. Done
echo ""
echo "✅ Todo listo. Ahora ejecutá:"
echo "   bun run dev:api    # API en :3000"
echo "   bun run dev:web    # Web en :5174"
echo ""
echo "   → http://localhost:5174"
```

**Flags:**

- `--no-db`: skip db:push + seed (si ya existe)
- `--no-docker`: skip docker (si ya corren)
- `--ci`: modo no interactivo, exit on first error

---

## 3. PR2: Developer Guides + PR Template

### 3.1 Guías en `docs/development/`

| Archivo                   | Contenido                                                 | Extensión     |
| ------------------------- | --------------------------------------------------------- | ------------- |
| `getting-started.md`      | Setup completo, requisitos, comandos básicos              | ~300 palabras |
| `how-to-add-a-feature.md` | Domain → Application → API → Web pipeline                 | ~500 palabras |
| `how-to-write-a-test.md`  | Patrones: unit (Vitest), integration, property            | ~400 palabras |
| `how-to-debug.md`         | Logs (pino), breakpoints (bun --inspect), Chrome DevTools | ~300 palabras |
| `conventions.md`          | Naming, imports, barrel exports, providers, git           | ~400 palabras |

**Frontmatter requerido para cada guía:**

```yaml
---
title: Cómo agregar una feature
description: Pipeline completo para agregar una nueva feature al dominio fiscal
last-verified: 2026-07-11
audience: developer
---
```

### 3.2 Mejora del PR template

El template actual en `.github/pull_request_template.md` está en español y tiene secciones útiles pero le falta:

- **Fiscal correctness section** — checklist de invariantes fiscales
- **Review path** — por dónde empezar a revisar
- **Workload forecast** — estimación de tiempo de review
- **Cross-stack** — si afecta TS/Go/Python

**Cambios:**

- Agregar sección "Fiscal correctness" debajo de Checklist
- Agregar "Review path" y "Workload forecast"
- Mantener el español (consistente con el proyecto)

---

## 4. Criterios de Aceptación

### PR1

- [ ] `bun run doctor` chequea: Docker, tools, engram, DB, puertos, env, git
- [ ] `scripts/dev/quickstart.sh` funciona de repo fresco a dev server
- [ ] Ambos scripts tienen `--help` y exit codes correctos
- [ ] `doctor.sh` pasa shellcheck sin errores

### PR2

- [ ] 5 guías en `docs/development/` con frontmatter válido
- [ ] PR template actualizado con fiscal correctness + review path
- [ ] `bun run docs:verify` pasa sin errores

---

## 5. Riesgos y Mitigaciones

| Riesgo                                      | Probabilidad | Mitigación                                       |
| ------------------------------------------- | ------------ | ------------------------------------------------ |
| Scripts fallan en macOS/Linux diferencias   | Media        | Testear en ambos; usar `uname -s`                |
| Guías quedan obsoletas                      | Alta         | Agregar `last-verified` en frontmatter; CI check |
| quickstart.sh corre DB push en DB existente | Baja         | Usar `--no-db` flag; verificar existencia previa |
