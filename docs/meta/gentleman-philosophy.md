# Filosofía Gentleman en Drenyra

**Última actualización**: 2026-10-02
**Audiencia**: personas y agentes que contribuyen a este repo.
**Fuente canónica de las reglas operativas:** [`AGENTS.md`](../../AGENTS.md). Este documento explica el *por qué*; no redefine reglas.

## Principios

1. **Menos carga cognitiva.** Responder primero, luego explicar. Tablas y listas antes que párrafos largos; detalle opcional en `<details>`.
2. **Enseñar el porqué.** Un cambio sin su razón (riesgo fiscal, decisión de diseño) es difícil de revisar y de mantener.
3. **Riesgo fiscal y seguridad primero.** SUNAT/SIRE, aislamiento por tenant y trazabilidad van antes que velocidad ([`CLAUDE.md`](../../CLAUDE.md), «Prioridades»).
4. **Ceremonia proporcional.** Lo simple se hace directo; lo incierto se investiga; lo grande se documenta y espera autorización; lo crítico se verifica. Es el flujo **ODD**: [`odd-workflow.md`](../10-development/odd-workflow.md).
5. **Revisar con empatía y evidencia.** El review (RDD) y test-first son independientes; en lo crítico van siempre encendidos.
6. **Rechazos claros.** Si una herramienta o un gate dice que no, debe decir qué camino seguir; nada se queda atascado.

## Delivery Strategies

Cuando un cambio supera 400 líneas se elige una estrategia (`ask-on-risk`, `auto-chain`, `single-pr`, `exception-ok`) y se documenta en el PR. La tabla vigente vive en [`AGENTS.md` → «Delivery strategies for large changes»](../../AGENTS.md) y se resume en [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Delegation Triggers para Agentes

Las condiciones que obligan a delegar en sub-agentes (regla de 4 archivos, cambios fiscales, incidentes, decisiones de arquitectura, sesiones largas) están en [`AGENTS.md` → «Delegation Triggers for AI Agents»](../../AGENTS.md). Los `AGENTS.md` de subdirectorios pueden añadir reglas más estrictas.

## Cómo se aplica a la documentación

Ver [`documentation-standards-2026.md`](documentation-standards-2026.md).
