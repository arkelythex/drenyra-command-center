# X1: Cross-Stack Contract Testing & Truth Consistency

**Estado:** proposal
**Creado:** 2026-07-11
**Depende de:** S3 (API Type Migration — applied), S4 (Domain Boundary Audit — applied)
**PRs estimados:** 3
**Líneas estimadas:** ~800

---

## Problema

Drenyra tiene 4 stacks (Bun/TypeScript API, React/TypeScript web, Go CLI, Python data-engine) pero **no hay un mecanismo que garantice que las reglas fiscales sean consistentes entre ellos**. Hoy el dominio en `packages/domain/` es la fuente de verdad en TypeScript, pero:

1. El CLI en Go duplica lógica fiscal sin verificación cruzada
2. El data-engine en Python tiene sus propios cálculos
3. No hay tests que verifiquen que un cálculo de IGV da el mismo resultado en TypeScript, Go y Python
4. Cambiar una regla fiscal (ej: tasa IGV) requiere cambios manuales en 3+ stacks

## Solución Propuesta

### PR1: Contract Definition Layer (TSDocs + JSON Schema)

Crear un sistema de `fiscal-contracts/` en el dominio que:

- Defina **todos los contratos fiscales** (IGV, detracciones, RUC, accounting periods) en un formato neutral
- Exponga JSON Schema autogenerado desde los types de TypeScript
- Sea el único punto de verdad para: tasas, fórmulas, validaciones, estados

```typescript
// packages/domain/src/fiscal-contracts/igv.contract.ts
export const IGV_CONTRACT = {
  version: '2.0',
  tasaGeneral: 0.18,
  tasaExportacion: 0.0,
  formulas: {
    calcularIGV: {
      input: { baseImponible: 'Money' },
      output: { igv: 'Money', total: 'Money' },
      invariant: 'total = baseImponible + igv',
    },
  },
} as const
```

### PR2: Cross-Stack Contract Tests

Test suite que verifica invariantes fiscales idénticas entre stacks:

- Para cada cálculo fiscal: ejecutar en TS, obtener resultado esperado
- Comparar contra implementación Go (CLI) mediante subprocess
- Comparar contra implementación Python (data-engine) mediante HTTP/API
- Los tests FALLAN si difieren → no hay divergencia silenciosa

```bash
bun run test:cross-stack  # Hace:
# 1. Corre tests fiscales en TS
# 2. Corre los mismos escenarios contra CLI Go
# 3. Corre los mismos escenarios contra Python data-engine
# 4. Compara resultados — falla si no coinciden
```

### PR3: Shared Contract CI Gate

Pipeline que:

- Detecta cambios en `packages/domain/src/fiscal-contracts/`
- Trigger automático de los cross-stack tests
- Bloquea PR si los contratos no están sincronizados
- Genera reporte de divergencia

## Criterios de Aceptación

- [ ] 100% de las fórmulas fiscales (IGV, detracción, RUC, retención) tienen contrato definido
- [ ] Cross-stack tests existen y se ejecutan en CI
- [ ] 0 divergencias entre TS, Go y Python para todos los escenarios fiscales
- [ ] Un cambio en `igv.contract.ts` falla CI si Go/Python no se actualizan

## Riesgos

- **Alto**: Los cross-stack tests agregan ~2-3 minutos a CI
- **Medio**: El CLI Go actual puede no tener todas las funciones fiscales implementadas aún
- **Bajo**: Los tests pueden ser frágiles si los contratos cambian rápido al inicio

## Review Workload Forecast

| PR                        | Líneas | Review time | Reviewer      |
| ------------------------- | ------ | ----------- | ------------- |
| PR1: Contract definitions | ~250   | 15 min      | Domain expert |
| PR2: Cross-stack tests    | ~350   | 20 min      | Backend + CLI |
| PR3: CI gate              | ~200   | 10 min      | DevOps        |
