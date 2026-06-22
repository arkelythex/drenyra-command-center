# ───────────────────────────────────────────────────────
# ARKELYTHEX Data Engine — Python/FastAPI + Polars
# ───────────────────────────────────────────────────────
# Standalone Python service (not part of the bun/turbo
# monorepo). Uses uv for fast dependency installation.
#
# Build: docker build -f apps/data-engine/Dockerfile .
# Bake:  docker buildx bake data-engine

# ── Stage 1: Builder ───────────────────────────────────
# Installs dependencies and compiles Python (bytecode).
FROM python:3.11-slim-bookworm AS builder

# Install uv — the Rust-powered package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy only dependency definition first (layer caching)
COPY pyproject.toml .

# Install dependencies into a local site-packages dir
# that we can copy into the runtime stage
RUN uv pip install --system --no-cache -r pyproject.toml

# Copy source and pre-compile .pyc for faster startup
COPY src/ ./src/
RUN python -m compileall -b -q src/

# ── Stage 2: Runner ────────────────────────────────────
FROM python:3.11-slim-bookworm AS runner

# Only runtime essentials — no curl, no build toolchain
WORKDIR /app

# Copy site-packages + source from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages/ /usr/local/lib/python3.11/site-packages/
COPY --from=builder /app/src ./src

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "uvloop"]
