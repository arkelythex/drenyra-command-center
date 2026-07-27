# Documentación de Seguridad — Drenyra

Documentos de seguridad del proyecto Drenyra. Revisar periódicamente según el calendario definido en cada documento.

## Archivos

| Archivo                                                          | Descripción                                                                                                          |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [`threat-model.md`](./threat-model.md)                           | Modelo de amenazas STRIDE — 30+ escenarios de amenaza sobre 8 límites de confianza                                   |
| [`nist-csf-baseline.md`](./nist-csf-baseline.md)                 | Línea base NIST CSF 2.0 — autoevaluación de 75 subcategorías con mapa de brechas priorizadas                         |
| [`incident-response-runbook.md`](./incident-response-runbook.md) | Plan de respuesta a incidentes — 4 playbooks detallados (próximamente en Fase 4)                                     |
| [`monitoring-strategy.md`](./monitoring-strategy.md)             | Estrategia de monitoreo de seguridad — inventario de logs, disparadores de alerta y roadmap (próximamente en Fase 4) |
| [`secret-management.md`](./secret-management.md)                 | Gestión de secretos — inventario, rotación y estrategia de migración a Infisical (próximamente en Fase 3)            |

## Cadencia de revisión

| Actividad                                   | Frecuencia                                      | Responsable       |
| ------------------------------------------- | ----------------------------------------------- | ----------------- |
| Revisión del modelo de amenazas             | Cada 6 meses o ante cambio arquitectónico mayor | Engineering Lead  |
| Re-baseline NIST CSF                        | Anual                                           | Engineering Lead  |
| Auditoría de permisos RBAC                  | Trimestral                                      | Security Champion |
| Auditoría de rotación de secretos           | Mensual                                         | Infrastructure    |
| Simulacro de respuesta a incidentes         | Cada 6 meses (tabletop)                         | Todo el equipo    |
| Escaneo de vulnerabilidades en dependencias | Semanal (CI automatizado)                       | CI Pipeline       |

---

**Última actualización:** 2026-07-25
