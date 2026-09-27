# Contratos pendientes de comandos de cumplimiento

**Última actualización:** 2026-09-01

> **Decisión operativa:** solo `compliance:sire-repro` y `compliance:sire-gate` están confirmados como controles activos. Los comandos batch, governance, P3 y writeback permanecen bloqueados hasta que exista una especificación aprobada de alcance, evidencia, autorización y mutabilidad.

Este documento evita que un nombre de script se convierta en comportamiento implícito. No autoriza envíos a SUNAT, cierres de periodo, writebacks, migraciones ni cambios de datos.

## Evidencia de auditoría

- `compliance:sire-repro` apunta a `scripts/sire-ledger-repro-check.ts`, que existe y tiene pruebas.
- `compliance:sire-gate` apunta a `scripts/sire-ledger-gate-evaluate.ts`, que existe y tiene pruebas.
- `compliance:sire-repro:batch`, governance, P3, signoff y writeback apuntan a archivos no observados en la auditoría.
- La documentación fiscal y las reglas del repositorio referencian de forma consistente `sire-repro` y `sire-gate` como controles activos.
- No se observó implementación segura para comandos de aplicación, writeback, cierre, signoff o envío.

## Clasificación actual

| Comando | Clasificación | Decisión vigente |
| --- | --- | --- |
| `compliance:sire-repro` | Activo | Mantener como control reproducible y no mutante |
| `compliance:sire-gate` | Activo | Mantener como gate determinístico que falla cerrado |
| `compliance:sire-repro:batch` | Roto o ausente | Diseñar antes de implementar; no inferir desde `sire-repro` |
| Governance run/signoff | Roto o ausente | Requiere modelo de evidencia, actor y aprobación |
| `compliance:p3:*` | Roto o ausente | Candidato para auditoría posterior por comando |
| `apply-writeback` y equivalentes | Inseguro por defecto | No implementar sin workflow autorizado, auditable y reversible |

## Contrato confirmado de SIRE

Los controles existentes deben conservar estas propiedades:

- Reciben compañía y periodo explícitos, con validación de periodo.
- Rechazan argumentos desconocidos, duplicados o inválidos.
- Producen salida determinística y verificable.
- Fallan cerrado si la cobertura no es `COMPLETE_DATA`.
- No ejecutan envío a SUNAT ni writeback observado.

## Controles mínimos para comandos futuros

- [ ] Validar RUC con checksum SUNAT antes de cualquier operación fiscal.
- [ ] Verificar que el RUC pertenece a la organización/compañía autorizada.
- [ ] Exigir filtros por RUC y periodo en toda consulta o mutación.
- [ ] Definir estados explícitos `NO_DATA`, `PARTIAL_DATA` y `COMPLETE_DATA` cuando aplique.
- [ ] Registrar evidencia append-only con RUC, periodo, fecha y hora, actor, motivo, comando y resultado.
- [ ] Documentar si el comando es lectura, preparación, signoff, envío o writeback.
- [ ] Exigir aprobación humana para cierre de periodo, signoff, envío o writeback.
- [ ] Manejar secretos desde configuración aprobada; nunca desde argumentos, código, logs o fixtures comprometidos.
- [ ] Agregar timeouts, reintentos acotados, rate limiting e idempotencia para llamadas externas a SUNAT.
- [ ] Cubrir fallos, datos parciales, scope cruzado y reintentos con pruebas antes de habilitar el comando.

## Acciones prohibidas

- Implementar comandos faltantes solo porque existen en `package.json`.
- Convertir un reporte o auditoría en writeback implícito.
- Enviar información a SUNAT sin contrato, CDR, idempotencia y aprobación.
- Cambiar lógica IGV, detracciones, retenciones, SIRE o CDR sin pruebas de cumplimiento.
- Leer o escribir datos fuera del RUC/periodo autorizado.
- Usar credenciales o datos sensibles en stdout, logs o fixtures.
- Combinar reparación de provisioning/upgrade con comandos de cumplimiento faltantes.

## Siguientes pasos seguros

1. Mantener `compliance:sire-repro` y `compliance:sire-gate` como únicos controles confirmados.
2. Diseñar cada comando faltante como unidad independiente, con contrato de mutabilidad explícito.
3. Empezar por comandos de lectura o reporte antes que signoff, envío o writeback.
4. Someter cualquier writeback o cierre a aprobación humana y evidencia append-only.

Hasta completar estos pasos, los comandos faltantes deben permanecer bloqueados.
