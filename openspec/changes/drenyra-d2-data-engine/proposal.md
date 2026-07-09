# D2: Data Engine — Python Quality Foundation

**Fecha:** 2026-07-09
**Autor:** el Gentleman
**PRs estimados:** 2
**Líneas estimadas:** ~400
**Depende de:** Nada (puede arrancar en paralelo)
**Tags:** python, data-engine, quality, testing

---

## Problema

`apps/data-engine` (Python + FastAPI + Polars) aparece en CODEX-MAP pero:

- **0 archivos fuente** detectados (posiblemente el directorio está vacío o no indexado)
- **Sin cobertura en ningún SDD plan existente**
- No hay linting, formatting, type checking, ni tests configurados
- Si el data engine maneja datos fiscales masivos, necesita quality gates como el resto del proyecto

## Diagnóstico

Primero hay que entender el estado actual del data engine:

```bash
# ¿Qué hay en el directorio?
ls -la apps/data-engine/
cat apps/data-engine/pyproject.toml 2>/dev/null || echo "No pyproject.toml"
cat apps/data-engine/MAP.md 2>/dev/null || echo "No MAP.md"
```

## Cambios Propuestos

### PR 1: Python Quality Baseline (200 líneas)

**Qué:** Configurar herramientas de calidad para Python.

**Acciones:**

1. **pyproject.toml** — Configurar:
   - `ruff` para linting + formatting (reemplaza flake8 + isort + black)
   - `mypy` para type checking
   - `pytest` con `pytest-cov` para coverage
   - `pre-commit` hooks

2. **CI Integration**:

   ```yaml
   # .github/workflows/data-engine-quality.yml
   - name: Lint
     run: ruff check apps/data-engine
   - name: Type check
     run: mypy apps/data-engine
   - name: Test
     run: pytest apps/data-engine --cov=apps/data-engine
   ```

3. **Conventions**:
   - Google-style docstrings
   - Type hints obligatorios en funciones públicas
   - `pydantic` models para schemas de datos fiscales

### PR 2: Data Engine Testing (200 líneas)

**Qué:** Escribir tests para la funcionalidad del data engine.

**Acciones:**

1. **Test structure**:
   - Tests por módulo en `apps/data-engine/tests/`
   - `conftest.py` con fixtures compartidos
   - `pytest-benchmark` para benchmarks de Polars

2. **Test areas** (depende de lo que exista):
   - SIRE bench tests
   - Procesamiento de grandes volúmenes
   - Conversión de datos fiscales
   - API endpoints (FastAPI TestClient)

## Criterios de Aceptación

1. `ruff check apps/data-engine` pasa con 0 errores
2. `mypy apps/data-engine` pasa con 0 errores
3. `pytest apps/data-engine` pasa con >50% coverage
4. CI workflow configurado para PRs que tocan `apps/data-engine/`
5. `pyproject.toml` configurado con ruff, mypy, pytest
