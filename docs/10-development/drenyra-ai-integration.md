# Integración con `drenyra-ai` y guía de actualización

**Última actualización**: 2026-10-02
**Audiencia**: quien mantiene la conexión entre este repo y el runtime verificable `drenyra-ai`.
**Estado**: vigente. Versión fijada hoy: **`drenyra-ai@0.5.0`** (6 contratos congelados).

## Posición en el ecosistema

`drenyra-ai` publica los contratos (misión, candidato, recibo, gate, ledger, recuperación). Este repo los **consume**; nunca al revés. Modelo de autoridad: la base contable es la verdad transaccional, Engram aporta contexto («informa, nunca autoriza») y los recibos de `drenyra-ai` son la prueba de ejecución.

## Dónde se consume

| Paquete | Entrada usada | Para qué |
|---------|---------------|----------|
| `packages/mission-domain` | `drenyra-ai/missions`, `drenyra-ai/receipts` | Tipos, eventos, transiciones, errores y recibo de misión |
| `packages/mission-protocol` | `drenyra-ai/missions` | Adaptador (*shim*) que reexporta el contrato de misión: única autoridad |
| `packages/drenyra-orchestrator` | `drenyra-ai/review` | Enrutado de trabajo y lentes de revisión |

La versión se declara con un pin exacto (`"drenyra-ai": "0.5.0"`) en esos tres `package.json`; el paquete sale del registro (con hash de integridad en `bun.lock`). Los tarballs commiteados están prohibidos (`bun run odd:guard`).

## Comprobar que está bien conectado

```bash
bun run ecosystem:doctor
```

Ejecuta `capabilities show` y `doctor run` de la instalación local de `drenyra-ai` en un `HOME` aislado y **falla** si:

- la versión instalada difiere del pin de `packages/mission-protocol/package.json`,
- algún contrato no está `FROZEN`, o
- el doctor no está `healthy`.

Resultado esperado hoy: `drenyra-ai 0.5.0: 6 contracts FROZEN, doctor healthy`. CI lo ejecuta en el job `Security Audit` de `quality-gates.yml`.

## Actualizar a una versión nueva (checklist)

Tarea ODD **crítica** (toca contratos de misión y recibos): test-first, review de riesgo alto, worktree aislado.

1. Leer las notas de versión de `drenyra-ai` y los contratos que cambian de estado.
2. Subir el pin **en los tres** `package.json` a la vez y ejecutar `bun install`.
3. `bun run ecosystem:doctor` — debe seguir verde con la versión nueva.
4. Línea base de pruebas (deben seguir iguales): `mission-protocol`, `mission-domain`, `mission-client`, API de misiones y `drenyra-orchestrator`.
5. `bun run typecheck` no debe subir respecto a su línea base (`odd/tasks/typecheck-baseline.md`).
6. Si cambia el esquema de recibo, revisar `contracts/receipt-schema` y la conformidad nocturna (`contracts-nightly`).
7. Registrar el resultado en `odd/tasks/` y actualizar esta página.

## Historia de la migración 0.2.0 → 0.5.0

- Antes: tarball vendorizado `drenyra-ai-0.2.0.tgz`. Ahora: paquete del registro, tarball eliminado.
- `mission-domain` exporta los comandos canónicos de 0.5.0 (`CreateMissionCommand`, `ApproveMissionCommand`, `RejectMissionCommand`, `ReconcileMissionCommand`, `ExecuteMissionCommand`, `MissionCommand`).
- Alias **deprecados** que siguen exportados mientras la API los use: `RunIntentCommand`, `ApproveCommand`, `RejectCommand`, `ReconcileCommand`.

## Pendiente (*Planned*)

- Migrar `apps/api/src/features/missions` a los nombres canónicos y retirar los alias deprecados.
- El identificador de agente `drenyra-sdd-orchestrator` y el prefijo de temas de Engram `sdd/` se conservan por compatibilidad de datos; renombrarlos exige migrar datos y documentación.

Ver también: [`odd/tasks/gentle-ai-v4-migration.md`](../../odd/tasks/gentle-ai-v4-migration.md) y [`engram-guide.md`](engram-guide.md).
