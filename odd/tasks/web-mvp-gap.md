# Web app: ¿es MVP? Brecha y plan

**Última actualización**: 2026-10-19

## Objective
Responder con evidencia si `apps/web` ya es un MVP y fijar el camino más corto hasta serlo, sin tocar código fiscal.

## Veredicto (provisional)
**Todavía no es un MVP.** Hay mucha superficie construida (shell agéntico, auth, onboarding, workspace, facturas, cumplimiento, cierre mensual), pero no hay evidencia de que un contador pueda completar de extremo a extremo el flujo emblema («cierre mensual») con datos reales, y el CI de typecheck sigue en rojo controlado por el ratchet.

Limitación de esta evaluación: se hizo leyendo el repo y el estado de los PRs. **No se levantó la app ni se corrieron los e2e**; eso es el primer paso de la fase A.

## Evidencia
- Superficie: 15 features en `apps/web/src/features`; `invoices` (48 tsx, 22 tests), `auth` (29, 9), `compliance` (29, 8) están más cubiertas. Sin tests: `approval-hub`, `reconciliations`, `fiscal-chat`.
- Rutas reales: login/signup/verify/reset, `onboarding`, `settings` y una sola ruta de trabajo, `workspace.$companyId.$year.$month.$intent`. El flujo emblema (`apps/web/MAP.md`, «Monthly close») está documentado como «documentar antes de implementar».
- `features/reconciliations/reconciliation.data.ts` son datos fijos en el cliente con importes `number` (p. ej. `-450.5`), contra la regla de `Money` en centavos de CLAUDE.md. Hoy la conciliación no es dato real.
- Typecheck de web: línea base del ratchet 454 errores de código (tras #254), api 1165, domain 146. Con la fase 1 y #253 ya en `main`.
- Salvaguardas ya hechas: ratchet de CI (#248), defectos reales de `packages/ai` y libro mayor (#253).

## Definición de MVP propuesta (para decidir)
Un contador de una empresa peruana puede, con su cuenta, en una sola sesión:
1. Registrarse, crear organización/empresa con RUC (onboarding).
2. Cargar o sincronizar comprobantes de un periodo.
3. Ver en el workspace de cierre mensual: bloqueos, evidencia y siguiente acción.
4. Aprobar o rechazar propuestas del agente con rastro de auditoría (sin mutación fiscal sin aprobación).
5. Cerrar el periodo (sin envío a SUNAT en el primer corte).

## Plan por fases (cada una = un PR)
- **A. Medir (no cambia código):** levantar API + web, correr e2e `auth`, `drenyra-workspace`, `facturacion`; registrar qué pasa y qué falla. Salida: tabla «flujo → funciona / falla / no existe».
- **B. Desbloquear CI:** #254 (ya retargeteado a `main`), luego #250/#255/#256 si siguen vigentes; decidir dependabot rojos (#238/#239) por separado.
- **C. Conciliación con datos reales:** reemplazar `reconciliation.data.ts` por la API y `Money` (crítico: test-first, review de riesgo alto).
- **D. Flujo cierre mensual de punta a punta** reutilizando `cierre-mensual`, `approval-hub`, `evidence`; tests e2e del camino feliz.
- **E. Endurecer:** cobertura en `approval-hub`/`reconciliations`, accesibilidad, rendimiento (lighthouse).

## Fuera de alcance
SUNAT/SIRE real, bloqueo irreversible de periodo, multi-país.

## Constraints
Fiscal/libros/domain = crítico (CLAUDE.md): test-first, review alto, `scripts/sire-ledger-repro-check.ts` si aplica.

## Estado
- [x] Evaluación inicial (esta nota)
- [ ] A. Medir con la app corriendo
