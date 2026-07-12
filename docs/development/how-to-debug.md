---
title: Cómo debuggear
description: Técnicas de debugging para cada stack de Drenyra
last-verified: 2026-07-11
audience: developer
---

# Cómo debuggear

## API (Bun + Elysia)

### Logs estructurados (pino)

La API usa pino para logging. Los logs se ven en la terminal donde corre `bun run dev:api`.

```bash
# Nivel default: info
# Para ver debug logs:
DEBUG=1 bun run dev:api
```

Cada log tiene: timestamp, nivel, módulo, mensaje y metadata.

```json
{
  "level": "info",
  "time": "2026-07-11T17:22:59.984Z",
  "module": "app-listen",
  "port": 3000,
  "msg": "Drenyra API listening"
}
```

### Breakpoints con Bun

```bash
bun --inspect run dev:api
# Luego abrí chrome://inspect en Chrome
# o usá VS Code: F5 con configuración de Bun
```

### Swagger UI

La API expone Swagger en <http://localhost:3000/api/swagger>. Podés probar endpoints directamente desde el browser.

## Web (React + Vite)

### React DevTools

- Instalá la extensión [React DevTools](https://react.dev/learn/react-developer-tools)
- Component tree, props, state, y profiling

### Vite HMR

Vite hace hot reload automático. Si un cambio no se refleja, verificá:

1. Que el archivo esté importado correctamente
2. Los errores aparecen en la consola del browser y en la terminal

### Network

- En Chrome DevTools → Network: verificá requests al API
- Las requests pasan por el proxy de Vite (`:5174 → :3000`)

## DB (PostgreSQL + Drizzle)

### Drizzle Studio

```bash
bun run db:studio
# Abrí http://localhost:4983 para ver/editar datos
```

### Queries directas

```bash
docker exec -it drenyra-db psql -U user -d drenyra
# o con el nombre legacy:
docker exec -it drenyra-db psql -U user -d arkelythex
```

## CLI (Go)

```bash
cd apps/cli
go run . --debug   # Modo debug si está implementado
# o build + ejecutar con delve:
go build -o drenyra && dlv exec ./drenyra
```

## Data Engine (Python)

```bash
cd apps/data-engine
uv run uvicorn src.main:app --reload --log-level debug
```
