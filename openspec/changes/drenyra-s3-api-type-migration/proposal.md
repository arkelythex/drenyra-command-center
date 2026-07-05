# S3: API Type Inline → Package Migration

**Fecha:** 2026-07-04
**Autor:** el Gentleman

---

## Problema

`apps/api/src/types/` contiene **9 archivos de tipos** que deberían vivir en packages del dominio:

```
apps/api/src/types/
├── taxation.types.ts     ← ¿Ya existe en packages/domain?
├── banking.types.ts      ← ¿Ya existe en packages/domain?
├── dashboard.types.ts    ← ¿Ya existe en packages/application?
├── chat.types.ts         ← ¿Ya existe en packages/ai?
├── invoice.types.ts      ← ¿Ya existe en packages/domain?
├── sire.types.ts         ← ¿Ya existe en packages/domain?
├── compliance.types.ts   ← ¿Ya existe en packages/domain?
├── inventory.types.ts    ← ¿Ya existe en packages/domain?
└── transaction.types.ts  ← ¿Ya existe en packages/domain?
```

Además, `apps/api/src/features/shared/` tiene código transversal (governance, api-response, company-scope) que debería estar en packages.

**Riesgo principal**: estos tipos pueden haber divergido de los tipos en packages. No es safe moverlos sin diff.

## Solución Propuesta

1. **Auditar**: comparar cada `apps/api/src/types/*.types.ts` con su contraparte en `packages/domain/` o `packages/application/`
2. **Mergear o re-exportar**: si el tipo ya existe en packages → re-exportar desde el package. Si existe pero diverge → unificar. Si es único → mover.
3. **Migrar `features/shared/`**: mover governance/company-scope/api-response a packages cuando corresponda

### Criterio de decisión por archivo

| Archivo                | Candidate package                           | Acción probable   |
| ---------------------- | ------------------------------------------- | ----------------- |
| `taxation.types.ts`    | `packages/domain/src/fiscal/`               | Merge o re-export |
| `banking.types.ts`     | `packages/domain/src/entities/`             | Merge o re-export |
| `dashboard.types.ts`   | `packages/application/src/`                 | Mover             |
| `chat.types.ts`        | `packages/ai/` o nuevo `@drenyra/agents` | Mover (post S1)   |
| `invoice.types.ts`     | `packages/domain/src/entities/invoice/`     | Merge             |
| `sire.types.ts`        | `packages/domain/src/fiscal/`               | Merge             |
| `compliance.types.ts`  | `packages/domain/`                          | Merge             |
| `inventory.types.ts`   | `packages/domain/src/entities/`             | Merge             |
| `transaction.types.ts` | `packages/domain/`                          | Merge             |

## Entregables

### PR 1: Type Audit & Diff (estimado: ~150 líneas)

- Comparar cada archivo con su contraparte en packages
- Documentar divergencias y decidir unificación
- Mover tipos únicos a su package destino

### PR 2: Re-export Migration (estimado: ~250 líneas)

- Reemplazar imports inline en API con re-exports desde packages
- Migrar `features/shared/` a packages
- Eliminar `apps/api/src/types/` después de migración completa

## Diseño Inspirado en Codex App

La filosofía **"Command Center, not IDE"** de Codex aplica a la organización del código: cada package debe tener un propósito claro, como un thread en Codex. Los tipos inline en la API son como tener el plan de construcción pegado en la pared del edificio — deben estar en el plano (el package).

Codex usa AGENTS.md como "cheat sheet" que carga en contexto. Análogamente, los tipos deben estar donde el desarrollador los encuentra sin buscar: en el package de dominio correspondiente, no en la app.
