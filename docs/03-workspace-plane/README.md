# 03 — Workspace Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 2 de 8 — Workspace
**Propósito:** Portfolio, companies, periods, change sets, estado operacional
**Principio:** Herdr — workspaces persistentes, composición, rollups semánticos

---

## Filosofía

Así como Herdr resuelve la supervisión de múltiples proyectos y agentes, Drenyra debe hacer lo mismo con empresas.

```
Portfolio
├── Empresa A   READY
├── Empresa B   WORKING
├── Empresa C   BLOCKED
├── Empresa D   APPROVAL REQUIRED
└── Empresa E   UNKNOWN
```

`UNKNOWN` nunca significa éxito.

### Rollup operacional

Un problema profundo se propaga hacia arriba:

```
Comprobante inválido
→ bloquea conciliación
→ bloquea cierre
→ bloquea empresa
→ afecta portfolio
→ aparece en Attention
```

### Estados canónicos

| Estado             | Significado                                    |
| ------------------ | ---------------------------------------------- |
| `QUEUED`           | En cola para procesar                          |
| `WORKING`          | Agente trabajando activamente                  |
| `VERIFYING`        | Validación en curso                            |
| `WAITING_INPUT`    | Esperando datos del usuario                    |
| `WAITING_EVIDENCE` | Esperando evidencia externa                    |
| `WAITING_APPROVAL` | Puerta de aprobación humana                    |
| `BLOCKED`          | Impedimento que requiere intervención          |
| `COMPLETED`        | Procesado exitosamente                         |
| `FAILED`           | Error no recuperable                           |
| `UNKNOWN`          | Estado indeterminado — requiere reconciliación |

---

## Conceptos clave

### Financial Workspace

Un workspace es el equivalente financiero de un proyecto/repositorio:

- **Scope**: Empresa + periodo + objetivo
- **Estado**: Workflow states con rollup
- **Agentes**: Skills asignados ejecutando
- **Change Sets**: Propuestas aisladas
- **Evidence**: Receipts vinculados

### Portfolio

Maneja 1, 10, 100 o 10,000 empresas mediante la misma jerarquía.

```
Portfolio
├── Company A (RUC: 20512345671)
│   ├── Period 2026-06
│   │   ├── Close workspace
│   │   ├── SIRE workspace
│   │   └── Reconciliation workspace
│   └── Period 2026-07
│       └── ...
├── Company B
└── ...
```

### Change Set

Propuesta aislada como un branch de Git:

- Escenario fiscal (qué pasaría si ajustamos X)
- Borrador de cierre
- Propuesta de rectificatoria
- Ajuste de auditoría

---

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs del [programa FEOS](../01-foundation/feos-program.md):

- `financial-workspace.md` — Workspace model, lifecycle, scope
- `portfolio-management.md` — Multi-company, rollups, dashboards
- `change-sets.md` — Aislamiento, diff, merge de propuestas
- `attention-system.md` — Priorización, notificaciones, escalamiento
- `period-lifecycle.md` — Apertura, cierre, locking de periodos

---

## Relación con otros planos

| Plano                                                   | Relación                               |
| ------------------------------------------------------- | -------------------------------------- |
| [02 — Experience](../02-experience-plane/README.md)     | El Explorer proyecta el portfolio      |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Agentes operan dentro de workspaces    |
| [05 — Trust](../05-trust-plane/README.md)               | Cada cambio genera evidence y receipts |
| [06 — Execution](../06-execution-plane/README.md)       | Workspaces ejecutan workflows durables |
