# Docker Compose — CLI Pipeline + Studio (Fase 2)

## Goal

Dockerizar el pipeline `andino` (CLI Python) y el Studio (Next.js 16) para que cualquier persona en el equipo pueda levantar la plataforma completa con un solo `docker compose up --build`.

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    docker-compose.yml                        │
│                                                              │
│  ┌─────────────────────────┐    ┌─────────────────────────┐  │
│  │  service: cli           │    │  service: studio        │  │
│  │  Dockerfile.cli         │    │  Dockerfile.studio      │  │
│  │                         │    │                         │  │
│  │  python:3.13-slim       │    │  node:22-alpine         │  │
│  │  entrypoint: andino     │    │  next start :3000       │  │
│  │  command: --help        │    │  depends_on: cli        │  │
│  └──────────┬──────────────┘    └───────────┬─────────────┘  │
│             │                               │                │
│             └──────────┬────────────────────┘                │
│                        ▼                                     │
│              volume: pipeline_data                            │
│              /app/data (compartido)                          │
└──────────────────────────────────────────────────────────────┘
```

## Services

### cli — Andino Pipeline

| Propiedad | Valor |
|-----------|-------|
| Base image | `python:3.13-slim` |
| Entrypoint | `andino` |
| Default command | `--help` |
| Build | Multi-stage con `uv` |

**Behaviour:**
- `docker compose run cli status` → estado del pipeline
- `docker compose run cli pipeline "mission" --yes` → pipeline completo
- `docker compose run --rm cli --help` → ayuda (default)

**Volumes:**
- `pipeline_data:/app/pipeline_data` — persistir BOMs, CADs, reportes entre ejecuciones

### studio — Andino Studio

| Propiedad | Valor |
|-----------|-------|
| Base image | `node:22-alpine` |
| Port | `3000` |
| Build | Next.js standalone output |

**Behaviour:**
- `docker compose up studio` → abre Studio en http://localhost:3000
- Corre en modo producción (next start)
- No depende del CLI para funcionar (pueden levantar independientes)

## Files

### Dockerfile.cli

Multi-stage build:
1. **builder**: python:3.13-slim + uv, copia deps y source, `uv sync --no-dev --frozen`
2. **runtime**: python:3.13-slim, solo `.venv/` y source, entrypoint `andino`

### Dockerfile.studio

Single-stage:
1. `node:22-alpine`
2. Copia `package.json`, `npm install --production`
3. Copia source, `next build`
4. `next start` en :3000

Requiere `output: "standalone"` en `next.config.ts`.

### docker-compose.yml

```yaml
services:
  cli:
    build:
      context: .
      dockerfile: Dockerfile.cli
    volumes:
      - pipeline_data:/app/pipeline_data
    entrypoint: ["andino"]
    command: ["--help"]

  studio:
    build:
      context: ./studio
      dockerfile: ../Dockerfile.studio
    ports:
      - "3000:3000"
    volumes:
      - pipeline_data:/app/pipeline_data
    depends_on:
      - cli

volumes:
  pipeline_data:
```

### .dockerignore (raíz)

Para el build context del CLI — excluir lo que no necesita el pipeline:

```
.git/
.gitignore
__pycache__/
*.pyc
.pytest_cache/
.venv/
data/
logs/
.andino/
node_modules/
studio/
ros2_ws/
docs/
projects/
scripts/
*.egg-info/
firmware/
hardware/
```

### .dockerignore (studio)

Para el build context del Studio:

```
.git/
node_modules/
.next/
__pycache__/
*.pyc
```

## Edge Cases & Decisions

| Edge | Decision |
|------|----------|
| Next.js standalone necesita `public/` y `static/` | `next.config.ts` con `output: "standalone"` + copiar `public/` y `.next/static/` al runtime |
| CLI sin flags de `--yes` puede colgarse esperando input | Default command `--help` para `docker compose up cli` — siempre interactivo via `docker compose run cli` |
| Build cache de uv y npm | `--mount=type=cache` en Dockerfile.cli para uv; Docker Compose cache mounts para npm |
| Studio necesita URLs absolutas al CLI | No por ahora — son independientes. En Fase 3 se agrega bridge HTTP/gRPC |
| Permisos del volumen compartido | Ambos containers corren como root (estándar en dev), volumen pipeline_data con uid/gid 1000 |
