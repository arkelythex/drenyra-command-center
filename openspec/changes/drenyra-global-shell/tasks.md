# Tasks — drenyra-global-shell

**Estrategia:** single-pr

| #   | Task                                                   | File                      | Action |
| --- | ------------------------------------------------------ | ------------------------- | ------ |
| 1   | Wrap __root.tsx in AgenticLayout                       | routes/__root.tsx         | MODIFY |
| 2   | Remove AgenticLayout from drenyra.tsx                  | routes/drenyra.tsx        | MODIFY |
| 3   | Remove FiscalInspectorProvider from cierre-mensual.tsx | routes/cierre-mensual.tsx | MODIFY |
| 4   | Remove FiscalInspectorProvider from index.tsx          | routes/index.tsx          | MODIFY |
| 5   | Typecheck + verify routes                              | —                         | VERIFY |

**Verificación:** `bun run typecheck`, navegar a /, /cierre-mensual, /drenyra
