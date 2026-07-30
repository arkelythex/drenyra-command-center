# CAP-FEOS-WORKSPACE-00: Persistent Financial Workspace Multiplexer

## Solicitud

### Problema

Drenyra opera con hasta 74+ empresas en paralelo, cada una con múltiples periodos fiscales, workflows de cierre, revisiones SIRE, conciliaciones y agentes ejecutándose. Actualmente no existe una identidad persistente para:

- **Workspaces** que agrupen empresas, periodos y un objetivo (cierre mensual, revisión SIRE, auditoría)
- **Vistas** independientes de los artefactos financieros que muestran
- **Ejecuciones** que sobreviven al cierre del navegador
- **Estado** autoritativo no inferido de la UI

Sin esto, cada recarga de página o desconexión pierde contexto organizacional. No hay rollups de atención, no hay forma de saber qué empresas están bloqueadas en el cierre, ni cómo propagar una urgencia.

### Objetivo

Construir un **Financial Workspace Multiplexer** — un plano de control persistente para organizar, observar, reanudar y dirigir cientos de empresas, periodos, workflows, agentes y revisiones sin perder contexto.

### Principio rector

> Las ejecuciones sobreviven a la interfaz; las vistas sobreviven a la sesión; pero únicamente los eventos autorizados determinan la verdad financiera.

### Scope

| Capability                                                 | SDDs     |
| ---------------------------------------------------------- | -------- |
| Identidad de workspace, empresa, periodo                   | FEOS-020 |
| Estado operacional (lifecycle, attention, risk, freshness) | FEOS-021 |
| Proyección por eventos y replay                            | FEOS-022 |
| Portfolio attention rollups                                | FEOS-023 |
| Layout persistente con paneles                             | FEOS-024 |
| Attach, detach, resume de ejecuciones                      | FEOS-025 |
| Superficie de control unificada (UI + CLI + API)           | FEOS-026 |
| Waits y notificaciones                                     | FEOS-027 |
| Concurrencia multi-cliente                                 | FEOS-028 |
| Seguridad y privacidad                                     | FEOS-029 |
| Performance budgets                                        | FEOS-030 |

### Acceptance Criteria

1. Un workspace sobrevive al cierre del navegador: al recargar, el layout, las vistas y las ejecuciones activas se restauran
2. El estado autoritativo de una ejecución nunca se infiere de la UI; siempre proviene de eventos persistidos
3. UNKNOWN no se rollupa como "completado" nunca
4. El CLI, la web y los agentes usan exactamente los mismos contratos de comando
5. Mover una vista no cambia la identidad del artifacto que muestra
6. Eventos duplicados no generan atención duplicada
7. R2/R3 commands atraviesan FEOS gates sin excepción
8. El portfolio rollup preserva materialidad, riesgo y deadline

### Riesgos

- **Over-engineering**: si no hay evidencia de que los usuarios necesitan layouts custom, no construir docking engine
- **Fallacias de estado**: que una restauración visual se interprete como estado vivo — combatir con el principio de autoridad de eventos
- **Event storming sin formato**: demasiados tipos de eventos sin proyecciones claras
- **Costo de replay**: portfolios grandes (>100 empresas) necesitan checkpoints eficientes

### Dependencias

- `packages/domain` — tipos base (ya existe)
- `packages/drenyra-orchestrator` — routing y authority model (ya existe)
- FEOS governance (R0-R3, approvals, evidence, receipts)
