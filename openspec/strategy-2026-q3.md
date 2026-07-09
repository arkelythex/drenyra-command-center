# Drenyra Transformation — Estrategia Q3 2026

**Última actualización:** 2026-07-07
**Filosofía:** Gentleman Programming — evidencia-first, refinar sin reescribir, calidad sobre velocidad
**Autor:** el Gentleman

---

## Estado Actual

### ✅ Completado (22 planes)

| Área                       | Plans | Estado                                                                |
| -------------------------- | ----- | --------------------------------------------------------------------- |
| **Agentic Migration (AM)** | 4     | ✅ Aplicados — sidebar reducido, features unificadas                  |
| **Design System (DS)**     | 5     | ✅ Aplicados — tokens cyan/violet, tipografía, vocabulario, layouts   |
| **Backend (B)**            | 4     | B1 aplicado, B2-B3 implementados, B4 en propuesta                     |
| **Structural (S)**         | 6     | S1-S4 aplicados, S5-S6 en working-draft                               |
| **Frontend (F)**           | 6     | F1 en spec, F2-F3 aplicados, F4-F6 en propuesta                       |
| **Otros**                  | 4     | Evidence vault, fiscal editorial, pi-extraction, smart reconciliation |

### 🔴 Gaps Críticos Detectados

1. **No hay plan de Performance** — bundle sizes, cold starts, queries lentas, sin benchmarks
2. **No hay plan de Testing** — coverage targets, integration tests, property-based testing para reglas fiscales
3. **No hay plan de CI/CD** — pipelines, release automation, Docker caching
4. **No hay plan de Code Quality** — linting estricto, dead code, dependency audit
5. **No hay plan de Package Health** — tree-shaking, circular deps, bundle budgets
6. **Drenyra CLI no es un fiscal terminal** — es un Go CLI clásico, no un gentle-pi-style terminal con sesiones, slash commands, sub-agentes

---

## 6 Nuevos Planes SDD

| #      | Plan                              | Cambio clave                                                                        | PRs   | Líneas | Depende de           |
| ------ | --------------------------------- | ----------------------------------------------------------------------------------- | ----- | ------ | -------------------- |
| **P1** | **Fiscal Terminal**               | CLI → gentle-pi con agent pane, slash commands, sesiones, memoria                   | 4 PRs | ~1,500 | S5 (contratos Go↔TS) |
| **P2** | **Performance & Optimization**    | Bundle analysis, lazy loading, query N+1, cold starts, benchmarks                   | 3 PRs | ~800   | F1 (agentic shell)   |
| **P3** | **Testing Infrastructure**        | Vitest config, coverage targets, property-based fiscal tests, integration framework | 2 PRs | ~600   | —                    |
| **P4** | **Build & CI/CD Pipeline**        | Turborepo tasks, Docker layer caching, GitHub Actions matrix, release               | 3 PRs | ~500   | P3 (tests first)     |
| **P5** | **Code Quality & Technical Debt** | Strict TS config, lint rules, dead code elimination, dependency health              | 2 PRs | ~400   | —                    |
| **P6** | **Package Health Audit**          | Tree-shaking, bundle budgets, unused exports, circular deps, knip/ts-prune          | 2 PRs | ~300   | S3 (types migrated)  |

---

## Dependencias Reales

```text
F1-F6 (frontend) ─── paralelo ─── P2 (perf necesita F1)
                                         │
B1-B4 (backend) ──── paralelo ──── P3 (testing) ─── P4 (CI/CD)
                                         │
S5-S6 (structural) ── bloquea ──── P1 (fiscal terminal)
                                         │
P5 (code quality) ─── independiente ─── paralelo con todo
P6 (package health) ─ independiente ─── después de S3
```

---

## Principios Gentleman para Ejecución Autónoma

### 1. Evidencia sobre opinión

Cada plan produce evidencia cuantificable antes de declararse completo:

- **P1**: "el CLI responde a `/close --period` y produce un artifact"
- **P2**: "Lighthouse score subió 15 puntos" o "cold start bajó 40%"
- **P3**: "coverage >80% en domain/accounting/"
- **P4**: "CI pasa en <5 minutos"
- **P5**: "0 errores de TS strict, 0 exports sin usar"
- **P6**: "0 circular deps, bundle budget <500KB"

### 2. Refinar, no reescribir

Ningún plan propone reescribir algo que funciona. Los cambios son:

- Evolutivos (mejorar lo que existe)
- Reversibles (cada PR es pequeño y autónomo)
- Medibles (sabemos si mejoró o no)

### 3. Review budget: 400 líneas por PR

Los planes ya están partidos en PRs de <400 líneas. Si un PR excede, se divide automáticamente.

### 4. Autonomous continuation

Cuando un agente complete un plan, debe:

1. Marcar `state.yaml` como `applied`
2. Actualizar `master-index.md`
3. Buscar el siguiente plan desbloqueado en el grafo de dependencias
4. Ejecutar `sdd-verify` antes de declarar terminado

### 5. Prioridad: fiscal correctness > UX > performance > refactor

Nunca sacrificar una regla fiscal por performance. Nunca refactorizar sin tests.

---

## Ejecución Recomendada

### Semana 1: Foundation

1. **P5 + P6** (independientes, quick wins) — lint + dead code + bundle budgets
2. **P3** (testing) — configuración de cobertura, patrones de test

### Semana 2: Quality Gates

3. **P4** (CI/CD) — pipelines que corren los tests de P3
4. **P2** (performance) — benchmarks, bundle analysis, query optimization

### Semana 3-4: Product

5. **P1** (fiscal terminal) — CLI como gentle-pi, el diferenciador real

---

## Paths de los Nuevos Planes

| Plan | Dir                                            |
| ---- | ---------------------------------------------- |
| P1   | `openspec/changes/drenyra-p1-fiscal-terminal/` |
| P2   | `openspec/changes/drenyra-p2-performance/`     |
| P3   | `openspec/changes/drenyra-p3-testing/`         |
| P4   | `openspec/changes/drenyra-p4-ci-cd/`           |
| P5   | `openspec/changes/drenyra-p5-code-quality/`    |
| P6   | `openspec/changes/drenyra-p6-package-health/`  |
