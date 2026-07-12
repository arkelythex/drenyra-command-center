---
title: Getting Started
description: Setup completo del entorno de desarrollo de Drenyra
last-verified: 2026-07-11
audience: developer
---

# Getting Started — Drenyra Development

Bienvenido. En esta guía vas a tener tu entorno de desarrollo funcionando de 0 a servidor corriendo.

## Prerequisitos

- **Bun 1.3+** — [bun.sh](https://bun.sh)
- **Docker** — con Docker Compose
- **Git** — con LFS si trabajás con archivos grandes

Opcional (solo si trabajás en esas áreas):

- **Go 1.21+** — para `apps/cli/`
- **Python 3.11+** — para `apps/data-engine/`

## Setup rápido

```bash
# 1. Clonar
git clone <repo-url>
cd Drenyra

# 2. Quickstart (recomendado)
bash scripts/dev/quickstart.sh

# 3. Verificar
bun run doctor

# 4. Arrancar dev
bun run dev:api   # API en :3000
bun run dev:web   # Web en :5174
```

## Setup manual (si preferís paso a paso)

```bash
# Instalar dependencias
bun install

# Levantar servicios Docker
docker compose up -d postgres drenyra-engram nats

# Aplicar schema de DB
bun run db:push

# Crear usuario demo
bun run auth:bootstrap:demo

# Arrancar API y Web
bun run dev:api
bun run dev:web
```

## Comandos esenciales

```bash
bun run doctor       # Diagnóstico del entorno
bun run dev:api      # API en http://localhost:3000
bun run dev:web      # Web en http://localhost:5174
bun run typecheck    # TypeScript check (strict)
bun run lint         # ESLint
bun run test         # Tests
bun run db:push      # Push schema a DB
bun run db:studio    # Drizzle Studio
```

## Estructura del proyecto

```
Drenyra/
├── apps/
│   ├── api/          # Backend (Bun + ElysiaJS)
│   ├── web/          # Frontend (React 19 + TanStack Router)
│   ├── cli/          # CLI (Go)
│   ├── landing/      # Landing page (Next.js)
│   └── data-engine/  # Data engine (Python + FastAPI)
├── packages/
│   ├── domain/       # Value objects, entidades fiscales
│   ├── application/  # Casos de uso
│   ├── persistence/  # Drizzle schemas, repos
│   └── ...
├── docs/             # Documentación
└── openspec/         # SDD plans
```

## Troubleshooting

| Problema                         | Solución                                      |
| -------------------------------- | --------------------------------------------- |
| `bun run doctor` muestra errores | Seguí las instrucciones de cada sección       |
| Puerto 5436 ocupado              | `lsof -i :5436` para ver qué proceso lo usa   |
| Redis no disponible              | `docker compose up -d redis` o usá el host    |
| Tests no corren                  | `bun install` primero, después `bun run test` |
