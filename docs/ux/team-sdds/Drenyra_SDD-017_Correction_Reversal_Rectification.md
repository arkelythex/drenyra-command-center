# SDD-017 — Correction, Reversal and Rectification

**Estado:** PROPOSED  
**Depende de:** SDD-011, 013–016  
**Informa:** SDD-077 y recuperación operacional

## Decisión

Drenyra distinguirá tres mecanismos:

- **Correction:** nueva versión antes de aplicación/presentación definitiva.
- **Reversal:** operación compensatoria que neutraliza un resultado aplicado sin borrar historia.
- **Rectification:** workflow fiscal que modifica una obligación o presentación previa y produce nueva evidencia externa.

## Reglas

1. Un artifact aplicado no se edita retroactivamente.
2. Reversal referencia resultado original y conserva ambos.
3. Rectification exige base anterior, diff, impacto, review, approval y receipt cuando exista presentación externa.
4. Periodo cerrado utiliza reapertura o canal correctivo explícito.
5. Motivo y categoría son obligatorios.
6. La reversibilidad se declara antes de apply; “reversible” no promete deshacer efectos externos automáticamente.

## Estados

`REQUESTED → IMPACT_ANALYSIS → PREPARED → REVIEWED → APPROVED → APPLYING → COMPLETED`

Alternativos: `REJECTED`, `CANCELLED`, `FAILED`, `UNKNOWN`.

## UX

El usuario elige objetivo, no mecanismo técnico: “Corregir borrador”, “Revertir aplicación” o “Iniciar rectificación”. La vista muestra qué permanecerá histórico, qué cambiará y qué requiere acción fuera de Drenyra.

## Criterios de aceptación

- Ningún workflow elimina el original para simular estado anterior.
- Diff y evidence enlazan original y resultado.
- Reversal/rectification son idempotentes.
- Tests cubren CLOSED period, external success con local timeout y retry.
- Audit export cuenta la secuencia completa.
