# AM2 — Right Panel → Artifact Feed

**Estado:** Proposal · **Creado:** 2026-07-05
**Depende de:** AM1

---

## Problema

El panel derecho actual tiene tabs fijos ("Ledger", "Journal", "Documents", "Misiones") que son features disfrazadas de tabs — violan el paradigma Codex donde el contenido aparece contextualmente según la conversación. Además, los strings están en inglés y no pasan por el copy registry.

## Propuesta

Convertir el panel derecho de **tabs fijos** a **feed de artifacts generados por el agente**:

1. **Eliminar tabs fijos** — "Ledger/Journal/Documents/Misiones" desaparecen como pestañas persistentes
2. **Implementar artifact feed** — el panel derecho muestra, en orden cronológico inverso, los últimos artifacts que el agente generó en la conversación actual (aprobaciones, tablas, documentos, gráficos)
3. **Acción "Anclar" explícita** — si el usuario quiere fijar una vista (ej: dejar el Ledger visible durante el cierre), es una acción manual, no el estado por defecto
4. **Migrar copy** — Todos los strings del panel derecho pasan por `lib/copy/copy-registry.ts`

### PRs

| PR  | Contenido                                            | Archivos | Líneas est. |
| --- | ---------------------------------------------------- | -------- | ----------- |
| PR1 | Eliminar tabs fijos + implementar artifact feed base | ~6       | ~300        |
| PR2 | Acción "Anclar" + migración copy registry + cleanup  | ~4       | ~200        |

## Riesgos

- **Alto**: El panel derecho se usa activamente — eliminar tabs sin reemplazo funcional rompe flujos de trabajo existentes. PR1 debe implementar el feed ANTES de eliminar los tabs, no después.
- **Medio**: "Ledger" es requisito legal de auditoría — debe seguir siendo accesible como board persistente aunque ya no sea un tab del panel derecho.
