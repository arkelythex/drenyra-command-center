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
- [x] A1. Medición automática (2026-10-19, `main` en 0fc4525): `bun install` ok; `vite build` de `apps/web` **pasa**; `vitest run` en `apps/web`: **18 de 75 archivos fallan (21 tests de 551)**.
- [ ] A2. Levantar API + Postgres y correr e2e de Playwright (necesita base de datos; pendiente)

## Resultado de A1: causas de los fallos de `vitest` (web)
| Causa | Archivos | Lectura |
|-------|----------|---------|
| Import a módulos que **no existen**: `@/hooks/useHaptics` (carpeta `src/hooks` no existe), `@/components/layout/MobileTabNavigation`, `@/lib/design-tokens/theme-package.schema` | InvoicesBoard, InvoiceCard, useInvoicesBoardController, SireManagementTab, UserMenu | Tablero de facturas y pestaña SIRE **no cargan**; el build pasa porque ninguna ruta las alcanza (las únicas rutas son auth, onboarding, settings y workspace). Bloquea el MVP. |
| `motion-primitives` lee `stiffness` de un token indefinido | LoginForm, SignupForm, auth-flow, InvoicesSummaryBoard (`modal`) | **Login y registro revientan en test**; hay que confirmar si también en el navegador. Bloquea el MVP. |
| Dependencia ausente: `web-vitals` | web-vitals.test | Higiene. |
| Tests desalineados (BOM en CSV, textos, `QueryClientProvider` faltante, monitoring) | export-service, ClientDetail, ChatAgent, OseStatusBadge, EvidencePages, useAuthSession, useSireReconciliation, monitoring | Mantenimiento de pruebas. |

## Cambio al plan
Antes de C/D, insertar **A3: arreglar lo que impide cargar** (tokens de motion en auth, módulos inexistentes, rutas de facturas y SIRE) con tests; es lo mínimo para que un usuario entre y vea facturas.

## Causa raíz de A3 (investigada 2026-10-19)
- `apps/web/src/lib/design-tokens.ts` es un **stub «minimal»** (solo `tokens`, `MOTION_VARIANTS = {hidden, visible}`, `tokensToClasses`). Los consumidores esperan `MOTION_VARIANTS.spring/springGentle/modal`, `Z_INDEX`, `BORDER_RADIUS`, `useDesignTokens` y `design-tokens/theme-package(.schema)`. Eso rompe `motion-primitives` y, con él, login/registro.
- `src/hooks/useHaptics` y `components/layout/MobileTabNavigation` **nunca existieron en git** (`git log --all` sin rastro): no se pueden restaurar, hay que escribirlos o quitar sus usos.
- Decisión pendiente: restaurar un módulo de tokens real (alineado con `apps/web/DESIGN.md` y `design-system/`) en vez de parchear cada consumidor.

## Hallazgo A2 (2026-10-19): el build de producción renderizaba una página en blanco
Medido con Chromium (Playwright) sobre `vite build` + `vite preview`: pantalla en blanco, `Failed to fetch dynamically imported module`. Tres causas independientes, todas en `apps/web/vite.config.ts` y su entorno:
1. **Module Federation** emitía chunks `loadShare` con rutas crudas `/node_modules/...` (404). Ahora es opt-in (`MF_REMOTE=1`); el build estándar no lo usa. Nadie en el repo consume `remoteEntry.js` (solo lo menciona el ADR-034).
2. **`external` por subcadena:** `id.includes("fs"|"os"|"path"|"stream"…)` externalizaba `@radix-ui/react-compose-refs` («re**fs**»), `react-popover` («p**os**t»…), etc., dejando imports desnudos. Ahora es coincidencia exacta (`vite-plugins/bundle-rules.ts`, con tests).
3. **`import "node:crypto"` en el bundle** (de `@drenyra/shared`/`domain`, imports de efecto sin uso): `treeshake.moduleSideEffects` descarta los externos sin uso. (Importar `@drenyra/shared/validation/ruc` en vez del barril también era buena idea, pero cambia el grafo de tipos del ratchet —carga `@types/node` distinto— y se deja para una fase de tsconfig.)
Resultado: `/login` y `/signup` renderizan en el build de producción (captura verificada). Sin estos cambios ningún usuario podía ver la app.
Pendiente visible en la captura: campos de formulario blancos sobre fondo oscuro, iconos superpuestos al texto (capa de color; ver ODD de sistema de diseño, fase 4).

## Hallazgo (2026-10-19): el contexto de empresa era un stub
`lib/company-context.ts` y `lib/use-active-company-context.ts` devolvían siempre la empresa demo (`demo-1`) y no exportaban `AUTH_STORAGE_KEYS` (que `auth-storage.ts` itera: fallaba en tiempo de ejecución). Facturas, libro mayor y cumplimiento se consultaban siempre con la empresa demo, sin importar la sesión.
Ahora: persistencia real de la empresa activa, cambio solo entre empresas concedidas por la sesión (`availableCompanies`), limpieza al cerrar sesión, y tests de aislamiento (`lib/__tests__/company-context.test.ts`). Pendiente: que la API entregue `availableCompanies` en la sesión y que el selector de empresa de la UI use `setActiveCompanyById`.

## Deuda de tests (2026-10-19): cerrada en web
`vitest` en `apps/web`: 82 archivos, 660 tests en verde (antes 18 archivos fallaban). Además: `monitoring.ts` pasa de stub a Sentry/Plausible reales (inicializado en `client.tsx`), `web-vitals` instalado, y `SelectTrigger` de `@drenyra/ui` ahora reenvía `aria-label` (los filtros no tenían nombre accesible).
Queda para la fase C: `useSireReconciliation` no tiene registros locales (se llenan desde la API) y compara importes `number`; hay que pasar a `Money` en centavos con test-first.

## Fase C, parte 1 (2026-10-19): motor de conciliación SIRE en centavos
`features/compliance/services/sire-reconciliation.ts` reemplaza el cálculo con `number` y tolerancia fija de 0.10 por aritmética en centavos enteros (tolerancia por defecto 0, configurable y validada). Cambios de comportamiento: detecta diferencias de IGV por documento aunque el total coincida, comprobantes duplicados, estado activo/anulado distinto y moneda distinta; la clave del documento incluye tipo y normaliza ceros, mayúsculas y espacios; los totales y el IGV suman solo PEN y excluyen anulados; `matchCount` cuenta solo documentos que coinciden. Revisado de forma independiente (adversarial); sus hallazgos están incorporados y con test.
Sigue pendiente (no se inventó): `parseSireFile` es un mock que ignora el archivo (hace falta el layout real de SUNAT/RVIE-RCE), los registros locales vienen vacíos hasta conectar el libro por API, y la conciliación bancaria (`features/reconciliations`) sigue con datos fijos en `number`. `scripts/sire-ledger-repro-check.ts` necesita `DATABASE_URL` y no se pudo correr aquí (este cambio no toca facturación ni libros del backend).

## Fase C, parte 2 (2026-10-19): lector SIRE real
`parseSireFile` deja de ser un mock. Lee .txt o el .zip de SUNAT con el formato oficial publicado en https://cpe.sunat.gob.pe/estructura-de-archivos: RVIE = Anexo 3 de la RS 112-2021/SUNAT y RCE = Anexo 11 de la RS 40-2022/SUNAT, separados por «|». Reconoce el registro por la fila de títulos (RCE tiene «Año» en el campo 9) o por el nombre oficial (`LE…140400…` ventas, `LE…080400…` compras). Si no lo puede saber, no adivina. Los importes se leen directo a centavos, con validación de RUC, periodo y fecha y error con número de línea; también acepta Latin-1. Limitaciones: el formato no trae estado, así que todo entra como ACTIVO (los anulados vienen en cero); sin un archivo real de SUNAT no se confirmó si la descarga trae fila de títulos (el lector acepta ambos casos).

## Hallazgo (2026-10-19): el cliente API de la web era un stub
`lib/api-client.ts` no tenía `api.api`. Por eso el login real y las llamadas de facturas, OSE y detracciones fallaban con TypeError antes de salir del navegador; solo el modo demo funcionaba. Ahora es Eden Treaty sobre `runtimeConfig.apiUrl`, con la cookie de sesión y los headers de la empresa activa (PR #280). `DetraccionesTab` leía la respuesta como si fuera `fetch` (`res.json()`); ahora usa `unwrap` y `extractOkData`.

## Fase C, parte 3 (2026-10-19): libros de la empresa en la conciliación SIRE
Nuevo `GET /api/sire/comparison/:period/local-records?companyId&kind=RVIE|RCE`, protegido por `companyScopeGuard` y bajo RLS de la empresa. Devuelve las ventas (RVIE, con el RUC de la empresa como emisor) o las compras (RCE, con el RUC del proveedor) emitidas en el mes. Los importes van en centavos enteros, leídos del decimal de la BD sin pasar por float. Se excluyen los borradores; CANCELLED cuenta como ANULADO; las series B se tratan como boleta (03) y el resto como factura (01).
La web toma el periodo y el registro del archivo SUNAT, carga esos libros y pasa los centavos de la API a soles, como los del lector, con validación de entero. Si no hay empresa activa o la API falla, muestra el error en lugar de marcar todo como "falta en Drenyra".
La revisión adversarial encontró dos defectos bloqueantes, ya corregidos con test:
- **Unidades distintas:** la API entrega centavos y el lector soles, así que todo salía con diferencia de monto.
- **Anulados:** los cancelados locales chocaban con la fila en cero que SUNAT usa para los anulados. Ahora esa fila cuenta como ANULADO, y dos anulados no comparan montos.
Limitaciones:
- Notas de crédito y débito no están modeladas en `invoices` ni en `bills`.
- El RCE se filtra por fecha de emisión. SUNAT lo agrupa por periodo de anotación, que puede ser hasta 12 meses después, y `bills` no guarda ese periodo.
- Un `billNumber` sin guion queda con serie vacía y no va a casar.
- Con un archivo SUNAT vacío no se cargan libros, porque no hay periodo del cual partir.
- El mes se corta en UTC: las fechas se guardan como `YYYY-MM-DD` a medianoche UTC.
- `scripts/sire-ledger-repro-check.ts` necesita `DATABASE_URL` y no se pudo correr aquí. El cambio solo lee: no escribe en libros.

## Hallazgo de seguridad (2026-10-20): `companyId` ajeno aceptado por la API
`companyScopeGuard` resuelve la empresa de la sesión, pero `reconciliations`, `analytics`, `compliance` (dashboard, issues, sire-reproducibility) y `evidence-v2` usaban el `companyId` del query o del body sin compararlo con ella. Cualquier usuario con sesión podía leer los movimientos bancarios, KPIs, issues o evidencias de otra empresa, y conciliar o desconciliar sus transacciones. Se verificó con test: `/api/analytics/dashboard?companyId=<otra>` respondía 200.
Ahora existe `rejectForeignCompanyId` en `shared/plugins/company-scope-guard.ts`, aplicado como `onBeforeHandle` en esos módulos. Responde 403 `COMPANY_SCOPE_MISMATCH` si el `companyId` pedido no es el de la sesión.
`governance-audit` y `sire-comparison` ya validaban por su cuenta. En `compliance` el hook va después de las sub-rutas, porque estas tienen su propio control de llamadores, incluidas las máquinas.
