# SDD Proposal: Data Integrity & Quality — Backend Production Readiness

**Última actualización:** 2026-07-02
**Estado:** Propuesta
**Plan SDD:** B2 de 4 (Backend)
**Dependencia del frontend:** MEDIA — integridad de datos previene bugs difíciles de encontrar en UI

---

## Executive Summary

Eliminar los 50 errores de TypeScript, agregar constraints de integridad referencial entre features (Risk 4), y escribir integration tests para los flujos cross-feature críticos. Esto previene bugs silenciosos que el frontend no puede detectar y asegura que el backend aguante producción sin corrupción de datos.

**Target:** "0 type errors, FK enforcement entre features, integration tests que prueben los 5 escenarios fiscales críticos."

---

## Problem

1. **50 type errors pre-existentes** — El proyecto no compila limpio. Errores incluyen:
   - `TS2300: Duplicate identifier` en barrel exports (schema/index.ts)
   - `TS2307: Cannot find module` en civic skills (ai-swarm/skills/index.ts)
   - `TS2345: Argument type mismatch` en control-tower mappers
   - `TS2345: Argument type mismatch` en sire/diff-commit.route.ts
   - `TS2724: Module has no exported member` en infrastructure/index.ts

2. **Sin FK enforcement para evidenceIds** (Risk 4) — 4 schemas guardan referencias a evidence como `jsonb<string[]>` sin constraint:
   - `accounting_prs.evidence_ids`
   - `close_checklist_items.evidence_ids`
   - `fiscal_memory.evidence_refs` (si existe)
   - `civic.evidence` (si existe)

3. **Sin integration tests cross-feature** — Cada feature se testea aislado. Nadie prueba que:
   - Subir evidence y attach a un PR funcione end-to-end
   - Cerrar un checklist monthly-close con evidence funcione
   - Judgment Day audite un PR correctamente
   - Automation Studio ejecute un workflow multi-paso
   - CFO Analytics calcule KPIs sobre datos reales de billing

4. **accounting-prs recién migrado a DB** — El Risk 2 está fixeado pero no hay tests que verifiquen la migración.

5. **Sin migration automation** — No hay un pipeline de migraciones para producción. Las tablas existen pero no hay control de versiones.

---

## Solution

### 1. Fix 50 Type Errors

| Error                          | File                                                        | Fix                                                 |
| ------------------------------ | ----------------------------------------------------------- | --------------------------------------------------- |
| TS2300: Duplicate identifiers  | `packages/persistence/src/schema/index.ts:294`              | Eliminar re-export duplicados                       |
| TS2307: Civic skills missing   | `apps/api/src/features/ai-swarm/skills/index.ts:27`         | Crear stubs o barrel para civic skills              |
| TS2345: Control-tower mappers  | `packages/persistence/src/repositories/control-tower/`      | Corregir tipos en entity-mappers y repository       |
| TS2345: Sire diff-commit       | `apps/api/src/features/sire/routes/diff-commit.route.ts:36` | Alinear tipo de handler con inline handler contract |
| TS2724: Infrastructure exports | `packages/infrastructure/src/index.ts:54`                   | Corregir re-export faltante                         |

### 2. Evidence FK Enforcement

Crear junction table polimórfica:

```sql
CREATE TABLE evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,  -- 'accounting_pr' | 'checklist_item' | 'fiscal_memory'
  entity_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(evidence_id, entity_type, entity_id)
);

CREATE INDEX idx_evidence_links_entity ON evidence_links(entity_type, entity_id);
```

Migrar datos existentes de `jsonb` arrays a la junction table, y agregar triggers o validación a nivel de aplicación para mantener consistencia.

### 3. Integration Test Suite

5 escenarios críticos como tests E2E con DB real:

| #   | Escenario               | Features                                                 | Setup                                                        |
| --- | ----------------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | **Evidence lifecycle**  | evidence → accounting-prs → monthly-close                | Subir evidence, crear PR con evidenceIds, attach a checklist |
| 2   | **Ciclo de cierre**     | evidence → monthly-close → accounting-prs → judgment-day | Pipeline completo de cierre mensual                          |
| 3   | **SIRE reconciliation** | sire → sire-comparison → judgment-day                    | Diff SIRE, discrepancias, audit                              |
| 4   | **Workflow automation** | automation-studio → (multiples targets)                  | Crear workflow, ejecutar steps, verificar resultados         |
| 5   | **CFO Analytics**       | billing → cfo-analytics                                  | Calcular KPIs sobre datos de facturación                     |

Cada test usa `test-utils` con builders y DB transaction rollback.

### 4. Migration Pipeline

```bash
# packages/persistence/package.json scripts
"db:migrate": "drizzle-kit migrate",
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:seed": "tsx src/seed/index.ts"
```

Agregar migración para `evidence_links` table.

---

## Architecture

```text
packages/persistence/src/
├── schema/
│   └── evidence-links.schema.ts    ← Nueva junction table
├── repositories/
│   └── evidence-links.repository.ts ← Operations para la junction
├── migrations/
│   └── ...                          ← Drizzle migrations generadas

apps/api/src/features/
├── shared/
│   └── integration-tests/           ← Test helpers cross-feature
├── evidence/__tests__/integration/
│   └── evidence-lifecycle.test.ts
├── monthly-close/__tests__/integration/
│   └── close-cycle.test.ts
├── sire-comparison/__tests__/integration/
│   └── sire-audit-flow.test.ts
├── automation-studio/__tests__/integration/
│   └── workflow-execution.test.ts
└── cfo-analytics/__tests__/integration/
    └── kpi-calculation.test.ts
```

---

## Dependencies

| Plan                    | Dependencia                                                     |
| ----------------------- | --------------------------------------------------------------- |
| Plan B1 (API Contracts) | Independiente                                                   |
| Plan B1 (API Contracts) | La integration test suite puede usar el response envelope nuevo |
| Plan B3 (Observability) | Independiente                                                   |
| Plan B4 (Security)      | Independiente                                                   |

---

## Delivery

**Estrategia:** auto-chain — 4 PRs encadenados

| PR  | Scope                                             | Archivos | Líneas |
| --- | ------------------------------------------------- | -------- | ------ |
| PR1 | Fix 50 type errors (mecánico, revisable por diff) | 8-12     | ~150   |
| PR2 | Evidence FK: schema + migration + repository      | 4-6      | ~250   |
| PR3 | Integration tests (5 escenarios)                  | 10-15    | ~600   |
| PR4 | Migration pipeline + seed data                    | 4-6      | ~100   |

**Total estimado:** ~1,100 líneas · 26-39 archivos · 4 PRs

---

## Risks

- Fixear los 50 type errors puede descubrir bugs latentes (types que estaban mal pero nadie se dio cuenta).
- La junction table `evidence_links` requiere migración de datos existentes — si hay evidence en producción, hay que migrar los jsonb arrays.
- Los integration tests requieren DB real — necesitan setup de test container o DB dedicada.
- Civic skills missing pueden requerir crear stubs con comportamiento mínimo en vez de features completas.

---

## Non-goals

- No se agregan nuevas features funcionales
- No se rediseña el schema existente (solo se agregan constraints)
- No se cubren todos los 61 features con integration tests — solo los 5 escenarios críticos
- No se implementa testcontainers ni infraestructura de testing pesada — tests con DB transaction rollback
