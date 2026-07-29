# 02 — Experience Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 1 de 8 — Experiencia
**Propósito:** Superficies de interacción: Workbench, CLI, Mobile, API, Embedded UI
**Principio:** Ghostty — instantáneo, nativo, configurable, cero fricción inicial, profundidad opcional

---

## Filosofía

Drenyra no debe sentirse como una terminal ni como un ERP tradicional. Debe sentirse como un **centro de comando financiero vivo**.

> **El poder de una terminal moderna, la colaboración de GitHub, la automatización de CI/CD, la inteligencia de agentes especializados y la confianza exigida por la contabilidad.**

### Cuatro modos de profundidad

| Modo         | Usuario    | Interacción                  |
| ------------ | ---------- | ---------------------------- |
| Guided       | Básico     | Asistida, pasos guiados      |
| Professional | Contador   | Paneles, comandos, shortcuts |
| Command      | Experto    | CLI, palette, batch          |
| API/CLI      | Integrador | APIs, SDK, automatización    |

### Rendimiento percibido (objetivos)

| Métrica                        | Objetivo  |
| ------------------------------ | --------- |
| Command palette abierta        | < 100ms   |
| Cambio entre vistas cargadas   | Inmediato |
| Respuesta visual a interacción | < 100ms   |
| Restauración de workspace      | < 300ms   |
| Primer evento del agente       | < 500ms   |
| Grid operativo                 | 60 fps    |

---

## Layout principal

```
┌────────────────────────────────────────────────────────────────────┐
│ DRENYRA  Org / Company / Period                  Command      ⌘ K │
├───────────────┬────────────────────────────────┬───────────────────┤
│ PORTFOLIO     │ WORKSPACE                      │ INSPECTOR         │
│               │                                │                   │
│ Attention  18 │ Ledger       │ SIRE Diff       │ Impact            │
│ Companies     │──────────────┼─────────────────│ Evidence          │
│ Periods       │ Documents    │ Agent Activity  │ Policy            │
│ Workspaces    │                                │ Approval          │
│ Automations   │                                │ Receipt           │
│ Skills        │                                │                   │
├───────────────┴────────────────────────────────┴───────────────────┤
│ 7 working · 2 verifying · 3 blocked · 4 approvals                 │
└────────────────────────────────────────────────────────────────────┘
```

### Tres paneles persistentes

1. **Portfolio Explorer** — empresas, periodos, workspaces, skills, automatizaciones
2. **Operational Canvas** — panel central composable con vistas intercambiables
3. **Inspector** — panel derecho contextual que explica el objeto seleccionado

## Documentos planificados

Los siguientes documentos están identificados pero aún no han sido creados. Se generarán como parte de los SDDs correspondientes del [programa FEOS](../01-foundation/feos-program.md):

- `workbench-design.md` — Centro de comando, tres paneles, layout
- `command-palette.md` — ⌘K, comandos, búsqueda fiscal
- `cli-design.md` — Terminal profesional fiscal
- `persistent-layouts.md` — Workspaces guardados, layouts composables
- `attention-inbox.md` — Bandeja priorizada por riesgo × materialidad × deadline
- `financial-diff.md` — Diferencia financiera explicada con impacto
- `mobile-design.md` — Supervisión y aprobaciones móviles
- `api-design.md` — Developer platform

---

## Relación con otros planos

| Plano                                                   | Relación                                             |
| ------------------------------------------------------- | ---------------------------------------------------- |
| [03 — Workspace](../03-workspace-plane/README.md)       | El Workbench proyecta el estado del Workspace        |
| [04 — Intelligence](../04-intelligence-plane/README.md) | Agentes se muestran como Activity en el Canvas       |
| [05 — Trust](../05-trust-plane/README.md)               | Inspector muestra evidence, approvals, receipts      |
| [07 — Financial](../07-financial-plane/README.md)       | Vistas financieras (ledger, close, tax) en el Canvas |

---

## Migración

Documentos migrados desde estructura anterior:

| Anterior                                   | Nueva ubicación                     |
| ------------------------------------------ | ----------------------------------- |
| `docs/products/sire-bench.md`              | Se mantiene en `docs/products/`     |
| `docs/architecture/fiscal-seams-design.md` | `./workbench-design.md`             |
| `docs/architecture/cap-workbench-00.md`    | `./workbench-design.md` (integrado) |
