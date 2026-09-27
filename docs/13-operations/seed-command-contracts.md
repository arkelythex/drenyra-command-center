# Contratos pendientes de comandos de seed

**Última actualización:** 2026-09-01

> **Decisión operativa:** los comandos raíz/API `db:seed` permanecen sin resolver hasta elegir un contrato seguro, acotado a desarrollo y aprobado. No se debe restaurar `scripts/dev/seed-dev-bootstrap.sh` por suposición.

Este documento registra la auditoría de contratos de seed. No autoriza ejecutar seeds, resetear datos, crear usuarios, conectar una base persistente ni modificar fiscalidad o aislamiento por RUC.

## Evidencia de auditoría

- El `db:seed` raíz y el `db:seed` del API apuntan a `scripts/dev/seed-dev-bootstrap.sh`, que no existe.
- El paquete de infraestructura sí tiene un contrato propio: `packages/infrastructure/src/db/seed.ts`.
- El seed de dashboard demo y `auth:bootstrap:demo` son contratos activos separados y más estrechos.
- Hay rutas legacy, alternas o de reset que pueden eliminar datos o ejecutar flujos destructivos.
- Algunas rutas observadas usan salida de contraseña demo en texto claro o RUCs demo hardcodeados sin validación de checksum evidenciada.

La existencia de un seed funcional en un paquete no demuestra que sea seguro exponerlo como comando raíz.

## Clasificación actual

| Superficie | Clasificación | Decisión vigente |
| --- | --- | --- |
| Infraestructura `db:seed` | Contrato activo de paquete | No promocionar automáticamente a comando raíz |
| Raíz/API `db:seed` | Candidato para diseño posterior | Mantener sin wrapper hasta definir alcance, target y garantías |
| Dashboard demo seed | Contrato activo separado | Mantener independiente del bootstrap general |
| `auth:bootstrap:demo` | Contrato activo separado | No encadenar silenciosamente con seed de datos |
| Flujos `seed:reset` o legacy full-delete | Inseguros sin rediseño | No exponer ni ejecutar como parte de este trabajo |
| `seed:evidence`, `seed:demos`, `seed:pitch` | Candidatos para auditoría posterior | Auditar individualmente antes de reparar o invocar |

## Controles mínimos antes de restaurar `db:seed`

- [ ] Definir si el comando crea solo compañía/usuario demo, datos operativos demo o un flujo compuesto.
- [ ] Exigir guard de entorno de desarrollo y confirmación explícita del `DATABASE_URL` objetivo.
- [ ] Prohibir `drenyra-db` y su volumen persistente salvo aprobación separada y trazable.
- [ ] Validar checksum de cada RUC demo con las utilidades SUNAT del proyecto.
- [ ] Mantener todos los registros bajo compañía/RUC explícitos y verificables.
- [ ] Evitar contraseñas en stdout, logs, fixtures persistentes o mensajes de error.
- [ ] Definir límites transaccionales, comportamiento ante fallo parcial, reintento e idempotencia.
- [ ] Registrar mutaciones materiales con RUC, periodo cuando aplique, fecha y hora, actor, motivo y resultado.
- [ ] Separar datos demo, auth bootstrap, dashboard demo y evidencia fiscal para que cada contrato sea reversible.

## Acciones prohibidas

- Ejecutar seeds o resets durante la reparación de provisioning/upgrade.
- Restaurar `scripts/dev/seed-dev-bootstrap.sh` apuntando por defecto a un seed destructivo.
- Encadenar auth bootstrap, seed operativo y dashboard demo sin decisión explícita.
- Crear o imprimir secretos demo en texto claro.
- Escribir datos sin compañía/RUC o con RUC no validado.
- Tocar migraciones históricas, `_journal.json`, aliases, replay de `0019`–`0033`, `drenyra-db` o su volumen persistente.

## Siguientes pasos seguros

1. Elegir el contrato exacto del `db:seed` raíz en una unidad de trabajo separada.
2. Diseñar primero pruebas de no producción, no mutación persistente, validación RUC y ausencia de secretos en salida.
3. Implementar un wrapper solo después de aprobar el contrato y con rollback claro.
4. Mantener cada seed especializado como contrato independiente salvo que una decisión explícita apruebe composición.

Hasta completar ese diseño, que el wrapper raíz falte es más seguro que ejecutar un seed ambiguo o destructivo.
