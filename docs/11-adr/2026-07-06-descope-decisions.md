# ADR: Descope Decisions — Approval Hub & CaseProgress Parallel Gate

**Fecha:** 2026-07-06
**Contexto:** Post-migración gentle-ai. Fases 0-5 implementadas y mergeadas a `main` (b581c1e2).
Dos features definidas en el spec original fueron evaluadas durante ejecución y
conscientemente descopeadas. Este registro documenta la decisión.

---

## 1. Approval Hub cross-case inbox (Phase 5.2 original spec)

**Estado:** 🟢 OK as-is — no merge, no new component

**Lo que decía el spec:** Crear un `/approval-hub` como inbox unificado de
aprobaciones cross-case, separado del `/approvals` existente en cumplimiento.

**Lo que encontramos:**

- `/approvals` (apps/web/src/routes/approvals.tsx) existe y redirige a
  `/cumplimiento/approvals`
- `/cumplimiento/approvals` usa `ApprovalHubPage` — un componente que ya
  funciona como inbox cross-case de aprobaciones
- ApprovalGateEngine + ApprovalStore ya manejan el enrutamiento por tenantId

**Decisión:** No crear un nuevo `/approval-hub`. La ruta existente
`/cumplimiento/approvals` ya es el inbox de aprobaciones cross-case.
Renombrar y duplicaría funcionalidad sin beneficio fiscal o de auditoría.

---

## 2. CaseProgress parallel gate verification (Phase 1.5)

**Estado:** 🟡 Feature-complete, but NOT ACTIVATED

**Lo que decía el spec:** Barra de progreso cross-agent que muestra
`(completado/total)` en la sesión activa.

**Lo que implementamos:**

- `CaseProgress` component (`apps/web/src/features/agents/CaseProgress.tsx`)
  con 4 estados + barra de progreso delegada a `AgentProgressBar`
- Integración en `CommandCenterChat.tsx` líneas 581-588
- Protegido por dev flag: `localStorage.getItem("DRENYRA_V2_CASE_PROGRESS")`

**Razón del descope (no activar sin validación):**

- Mock data: `CaseProgress` usa datos estáticos (4 completadas / 7 totales)
  en lugar de sesión real del caso. La sesión real necesita:
  - Conectar al stream de SSE del CommandCenterChat para contar
    artifacts completados en vivo
  - Sincronizar con `useChatHistory` para determinar total de pasos
    del plan del caso
- El componente NO ha sido probado con datos reales de sesión
  (paralelismo entre agentes)
- Activarlo sin validación causaría confusión: progreso incorrecto,
  totales estancados, o barras que no avanzan

**WARNING en código:** `// ⚠️ NO ACTIVAR sin validación paralela — mock data`
(Línea 582 de `CommandCenterChat.tsx`)

**Para activar:** Ejecutar con un caso fiscal real en paralelo:

1. Abrir una sesión con multi-agente activo
2. Verificar que `completed` y `total` reflejan el progreso real
3. Verificar que la barra avanza correctamente al completar cada phase
4. Solo entonces quitar el dev flag y reemplazar mock data con
   datos de sesión real

---

## Impacto

| Feature      | Spec status       | Riesgo                          | Mitigación               |
| ------------ | ----------------- | ------------------------------- | ------------------------ |
| Approval Hub | Not built         | None — existing route covers it | Documentado en este ADR  |
| CaseProgress | Built but flagged | Bajo (detrás de dev flag)       | Flag + warning en código |

**Próximo paso:** Revisar ambos items en la siguiente iteración de migración.
