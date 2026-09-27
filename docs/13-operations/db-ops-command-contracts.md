# Contratos pendientes de comandos operativos de base de datos

**Última actualización:** 2026-09-01

> **Decisión operativa:** los comandos `ops:db:*` deben permanecer sin implementar hasta que sus contratos de seguridad sean diseñados y aprobados. Sus nombres no autorizan ni permiten inferir comportamiento.

Este documento delimita las decisiones mínimas necesarias antes de crear scripts operativos. No autoriza backups, restauraciones, cambios RLS ni acciones sobre bases de datos.

## Evidencia de auditoría

- `package.json`, líneas 113–117, mapea los cinco comandos indicados abajo.
- Las rutas de scripts solicitadas bajo `scripts/ops` no existen.
- Las referencias de health doctor y de preparación de backups convierten el backup y la verificación de restauración en expectativas operativas activas.
- La preparación RLS espera políticas para `invoices`, `bills`, `business_partners`, `bank_accounts` y `bank_transactions`.
- La documentación de seguridad clasifica RLS como parcial o en progreso.

La presencia de referencias no define una implementación segura. Solo demuestra que existe un contrato pendiente.

## Clasificación actual

| Comando | Clasificación | Decisión vigente |
| --- | --- | --- |
| `ops:db:backup` | Contrato activo referenciado; implementación rota o ausente | Mantener sin implementar hasta aprobar destino, alcance, cifrado, retención y evidencia de éxito |
| `ops:db:backup:prune` | Candidato para auditoría posterior | No implementar hasta definir retención, protección contra borrado y modo de simulación |
| `ops:db:backup:verify` | Candidato para auditoría posterior | No implementar hasta que el diseño defina qué significa verificar y qué evidencia debe producir |
| `ops:db:restore:verify` | Contrato activo referenciado | No restaurar sin diseño aprobado y un destino desechable y aislado |
| `ops:db:rls:apply` | Candidato de alto riesgo para auditoría posterior | No implementar automáticamente; requiere diseño de aislamiento por RUC, pruebas y aprobación explícita |

## Controles mínimos de diseño

### Backup

- [ ] Definir el alcance exacto, el formato, el destino permitido y la política de cifrado.
- [ ] Evitar credenciales y contenido del dump en logs, stdout y mensajes de error.
- [ ] Definir consistencia, manejo de fallos, atomicidad y evidencia verificable de finalización.
- [ ] Documentar RPO, retención, permisos de acceso y responsables operativos.

### Prune

- [ ] Definir una política de retención explícita, revisable y vinculada al inventario de backups.
- [ ] Exigir preflight no mutante y modo de simulación antes de cualquier eliminación.
- [ ] Proteger el último backup válido y toda copia bajo retención legal u operativa.
- [ ] Registrar actor, motivo, selección y resultado sin exponer datos sensibles.

### Verificación de backup

- [ ] Definir si verifica existencia, integridad criptográfica, legibilidad, metadatos o restaurabilidad; no tratar estos conceptos como equivalentes.
- [ ] Establecer criterios de aprobación, caducidad de la evidencia y códigos de salida.
- [ ] Ejecutar sin modificar el backup ni conectarse a un objetivo de producción.
- [ ] Probar casos válidos, corruptos, incompletos, inaccesibles y con metadatos incompatibles.

### Verificación de restauración

- [ ] Usar exclusivamente un destino desechable, aislado y explícitamente autorizado.
- [ ] Definir aprovisionamiento, límites de recursos, limpieza y prueba de que el destino no es persistente.
- [ ] Verificar integridad estructural y controles de acceso sin imprimir filas ni contenido del dump.
- [ ] Impedir por diseño cualquier conexión a producción o al volumen persistente `drenyra-db`.

### Aplicación de RLS

- [ ] Inventariar políticas existentes y el estado esperado de las cinco tablas referenciadas.
- [ ] Diseñar SQL idempotente, límites transaccionales, preflight y recuperación ante fallo parcial.
- [ ] Probar aislamiento positivo y negativo, incluidos accesos cruzados entre RUC, antes de habilitar mutaciones.
- [ ] Exigir trazabilidad de actor, motivo, aprobación y resultado para cada cambio de política.
- [ ] Obtener revisión específica de seguridad y aprobación explícita de un mantenedor.

## Acciones prohibidas

- Tocar `drenyra-db` o cualquier volumen persistente.
- Mostrar secretos, credenciales, filas o contenido de dumps en logs o salida de comandos.
- Implementar mutaciones RLS sin pruebas de aislamiento cruzado entre RUC.
- Usar destinos de producción para backup, verificación o restauración.
- Modificar migraciones históricas, `_journal.json`, aliases o la reproducción de `0019`–`0033`.
- Convertir los nombres de los comandos en una especificación implícita o completar sus contratos por suposición.

## Siguientes pasos seguros

1. Diseñar primero las pruebas de contrato, incluidos fallos y garantías de no mutación.
2. Diseñar un preflight e inventario no mutantes antes de cualquier operación que pueda escribir o eliminar datos.
3. Someter cada contrato y su evidencia de pruebas a aprobación explícita de un mantenedor.
4. Implementar solo después de esa aprobación, fuera del trabajo de reparación de migraciones y con objetivos desechables cuando corresponda.

Hasta completar estos pasos, que los comandos fallen por implementación ausente es más seguro que ofrecer una operación ambigua o destructiva.
