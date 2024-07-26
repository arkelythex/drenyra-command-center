# 03 — Workspace Plane

**Última actualización:** 2026-07-27
**FEOS Plano:** 2 de 8 — Workspace
**Propósito:** dar un alcance operativo, persistente y composable a todo trabajo financiero.

---

## Qué es

El Workspace Plane define el modelo universal con el que Drenyra organiza trabajo financiero: **Organización → Portfolio → Compañía → Período → Workspace**. Esta jerarquía permite que la misma plataforma atienda una empresa o miles sin cambiar el significado de una tarea, su evidencia ni su responsabilidad.

Un workspace es una unidad de trabajo con alcance explícito: compañía, período, objetivo, participantes, estado, artefactos y workflows vinculados. “Cerrar junio de Compañía A”, “revisar RVIE” y “conciliar el Banco X” son workspaces distintos, aunque compartan compañía y período. El modelo evita que un agente, una persona o una automatización opere sobre un contexto implícito.

Herdr inspira dos propiedades: **persistencia** y **composición**. Un workspace recuerda sus panes, contexto, actividad y decisiones entre sesiones; también puede componerse con otros workspaces y rollups, sin fusionar su evidencia ni borrar sus límites de autoridad.

## Qué no es

No es una carpeta libre de documentos ni una simple vista de UI. Tampoco es un ledger: los hechos contables pertenecen al [Financial Plane](../07-financial-plane/README.md). El Workspace Plane da contexto y coordinación; Trust decide si una propuesta puede aprobarse y Execution garantiza que el trabajo se complete de forma durable.

## Estados operacionales canónicos

Todo objeto operativo se expresa con un vocabulario común:

| Estado | Significado |
| --- | --- |
| `queued` | admitido y esperando capacidad o dependencia previa |
| `working` | ejecución o investigación activa |
| `verifying` | validación determinista o revisión en curso |
| `waiting` | espera datos, evidencia, autoridad o una señal externa |
| `blocked` | existe un impedimento accionable que requiere intervención |
| `completed` | resultado confirmado y cerrado para ese objetivo |
| `failed` | terminó con error no recuperable o requiere reinicio controlado |
| `unknown` | no se puede afirmar el resultado; requiere reconciliación |

Las causas refinan el estado sin crear taxonomías incompatibles: `waiting:approval`, `waiting:evidence` o `blocked:period_locked`. `unknown` nunca se convierte en `completed` por timeout o reintento; se conserva hasta que [Execution](../06-execution-plane/README.md) reconcilie el hecho externo.

## Lifecycle y Change Sets

Un workspace nace cuando se fija su scope y objetivo. Pasa por preparación, trabajo, verificación y cierre; puede pausar por espera, bloquearse o entrar en reconciliación. Al completarse retiene su timeline, evidencias y receipts como registro operativo. Reabrir un período o iniciar una rectificatoria crea un nuevo objetivo y referencias explícitas, no reescribe silenciosamente el anterior.

Los **Change Sets** aíslan propuestas financieras como un branch de Git: un escenario de provisión, un ajuste de auditoría o una rectificatoria se trabaja sin modificar el estado publicado. Cada Change Set contiene su base, cambios propuestos, financial diff, evidencia y candidato de aprobación. Sólo un flujo autorizado puede integrarlo o producir asientos compensatorios; “merge” no significa editar directamente el ledger.

## Portfolio Attention Rollups

Un portfolio agrega compañías y workspaces mediante semántica, no sólo conteo. Su Attention Inbox ordena trabajo por riesgo, materialidad, deadline e impacto downstream. Un comprobante inválido puede bloquear una conciliación, que bloquea un cierre y eleva la atención de la compañía; el rollup muestra la causa raíz y evita que un gerente vea únicamente un semáforo rojo.

Ejemplo: un estudio gestiona 200 empresas. Diez cierres están `working`, tres esperan aprobación y una empresa está `blocked` porque falta evidencia de una transacción material antes de SUNAT. El portfolio la prioriza por vencimiento e impacto, mientras cada equipo conserva el workspace específico donde puede resolverla.

## Relación con los demás planos

- [Experience](../02-experience-plane/README.md) presenta Explorer, panes y Attention Inbox sobre este modelo.
- [Intelligence](../04-intelligence-plane/README.md) asigna especialistas y skills dentro de un scope explícito.
- [Trust](../05-trust-plane/README.md) vincula Change Sets y propuestas a evidencia, política y aprobaciones exactas.
- [Execution](../06-execution-plane/README.md) implementa el lifecycle durable y reporta estados reales.
- [Financial](../07-financial-plane/README.md) aporta el ledger, períodos y diffs; [Country](../09-country-plane/README.md) aporta calendarios y vocabulario locales.

La jerarquía de workspace es el contrato que permite que la automatización escale sin perder la pregunta esencial: qué compañía, qué período, qué objetivo y bajo qué estado se está operando.
