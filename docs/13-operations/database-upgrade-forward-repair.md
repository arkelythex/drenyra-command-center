# Reparación hacia adelante para actualizaciones de base de datos

**Última actualización:** 2026-09-01

> **Decisión operativa:** la actualización está bloqueada hasta diseñar y aprobar una reparación controlada hacia adelante. Mientras tanto, el bootstrap desde cero continúa siendo la vía segura de aprovisionamiento.

Este runbook documenta el estado verificado y los controles previos. No autoriza ejecutar migraciones ni modificar una base de datos persistente.

## Invariantes preservados

- No modificar migraciones históricas.
- No editar `packages/infrastructure/drizzle/meta/_journal.json`.
- No crear alias de migraciones.
- No reproducir automáticamente las migraciones `0019`–`0033`.
- No mutar `drenyra-db` ni su volumen persistente.

## Estado verificado

| Evidencia | Resultado |
| --- | --- |
| Aprovisionamiento limpio | Correcto con `pgvector/pgvector:pg16` |
| Esquema aprovisionado | 147 tablas y 27 enums |
| Integración SIRE | 4/4 pruebas aprobadas |
| Contenedores efímeros | Eliminados después de la verificación |

## Evidencia del guard de inventario

`bun scripts/dev/validate-infra-migration-inventory.ts` termina antes de establecer una conexión con la base de datos y reporta:

- Archivos faltantes en el journal: `0001_cool_lady_ursula.sql` y `0007_loose_squirrel_girl.sql`.
- Archivos numéricos no registrados en el journal: entre otros, `0001_add_ai_worker_queues.sql`, `0007_add_ai_control_plane_tables.sql` y el rango `0019`–`0033`.

Este resultado bloquea la ruta de actualización; no debe corregirse alterando el historial ni el journal.

## Matriz de comandos

| Comando | Clasificación actual | Uso permitido |
| --- | --- | --- |
| `bun run db:bootstrap` | Activo; vía segura de aprovisionamiento limpio | Solo para entornos nuevos y desechables, conforme al procedimiento autorizado |
| `bun run db:upgrade:preflight` | Activo; bloqueado por el guard de inventario | Inspección no mutante; no continuar a una conexión o migración mientras falle el guard |
| `bun run db:migrate` | Bloqueado para actualización persistente | No ejecutar hasta aprobar la reparación hacia adelante y superar el preflight |
| `bun run quality:max-lines` | Activo, restaurado | Control de calidad no mutante; no forma parte de la reparación de base de datos |
| `bun run quality:core` | Activo, restaurado como wrapper acotado de `quality:max-lines` | Control de mantenibilidad no mutante; no es un control fiscal o de cumplimiento ni forma parte de la reparación de base de datos |
| `bun run db:seed` | Candidato para diseño posterior | Mantener sin restaurar ni ejecutar hasta aprobar los [contratos de comandos de seed](./seed-command-contracts.md) |
| Comandos de backup/restore de operaciones | Activos, rotos donde existen referencias de salud | Mantener sin implementar hasta aprobar los [contratos de comandos operativos](./db-ops-command-contracts.md) |
| Comandos RLS de operaciones | Candidatos de alto riesgo | Mantener sin implementar hasta aprobar los [contratos de comandos operativos](./db-ops-command-contracts.md), incluida la auditoría de aislamiento por RUC |
| `bun run compliance:sire-gate` / `bun run compliance:sire-repro` | Activos | Mantener como controles SIRE confirmados; otros `compliance:*` deben seguir los [contratos de comandos de cumplimiento](./compliance-command-contracts.md) |

## Lista de diseño para la reparación hacia adelante

Antes de cualquier acción sobre una base persistente, el diseño debe incluir:

- [ ] Inventario reproducible de migraciones, journal, objetos existentes y evidencia de cada discrepancia.
- [ ] Auditoría de objetos, constraints e índices duplicados o equivalentes.
- [ ] Auditoría de políticas RLS, incluido el aislamiento por RUC y los efectos sobre políticas existentes.
- [ ] SQL idempotente que clasifique cada objeto antes de crearlo o modificarlo.
- [ ] Límites de transacción, comportamiento ante errores y notas de rollback o recuperación.
- [ ] Clasificación del preflight: seguro, ya aplicado, requiere reparación o bloqueado.
- [ ] Verificación seca y no mutante contra una copia desechable representativa.
- [ ] Aprobación explícita de un mantenedor antes de cualquier acción sobre `drenyra-db` o un volumen persistente.

## No objetivos

- Reparar comandos de calidad, seeds, backup/restore, RLS o cumplimiento como parte de la reparación de base de datos.
- Rediseñar el sistema de migraciones o consolidar el historial existente.
- Certificar una ruta de actualización persistente antes de completar el diseño, la verificación y la aprobación.
- Sustituir los procedimientos de backup, recuperación o respuesta a incidentes.

## Acciones prohibidas

- Reescribir, renombrar o eliminar migraciones históricas.
- Editar `_journal.json` para hacer coincidir artificialmente el inventario.
- Introducir aliases o wrappers que oculten archivos huérfanos.
- Reproducir automáticamente `0019`–`0033` sobre una base existente.
- Ejecutar `db:migrate` o una reparación SQL sobre `drenyra-db` o su volumen persistente.
- Mutar, reiniciar o reemplazar contenedores o volúmenes persistentes como parte de esta preparación.

## Siguiente paso

Revisar la [propuesta de diseño para la reparación hacia adelante](./database-forward-repair-proposal.md), que constituye el siguiente artefacto de planificación y define las fases, salidas, criterios de aceptación y condiciones de bloqueo de una futura unidad de trabajo. La propuesta no autoriza ejecución alguna.

Hasta su aprobación, usar únicamente el bootstrap limpio para aprovisionamiento nuevo y mantener bloqueada la actualización persistente.
