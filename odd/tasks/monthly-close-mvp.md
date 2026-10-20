# Fase D: cierre mensual de punta a punta

**Estado:** Working (D1 #309, D2 #311 y D3 #313 mergeados; D4 en curso). Autorizado por Dreamcoder ("te autorizo todo y avanza de forma autónoma", 2026-10-20).

## Objetivo
Que un contador vea en el workspace del periodo los bloqueos, la evidencia y la siguiente acción. Que apruebe o rechace las propuestas del agente, dejando rastro de auditoría. Que cierre el periodo sin envío a SUNAT (ver `web-mvp-gap.md`).

## Diagnóstico (2026-10-20, solo lectura)
- **La web llama a las misiones con `fetch` directo** (`features/workspace/services/mission-client.ts`), usando un token Bearer que nadie escribe, sin cookie de sesión y sin cabeceras de empresa. El API las rechazaría.
- **El API de misiones no tiene base de datos:** se monta con `createMissionsRoutes(null)` (`missions.module.ts`). Además devuelve sus errores con HTTP 200.
- **Formas que no calzan entre web y API:**
  - La web inventa el id de la misión y nunca la crea.
  - Envía `expectedMissionVersion: 0` y el API exige 1 o más.
  - El API envuelve las respuestas en `{success,data}` y la web no las desenvuelve.
  - `/api/approval/*` no existe; lo más cercano es `/api/review-queue`.
- **`CierreMensualPage` tiene un estado de misión propio** que nunca corre. Además tiene valores fijos: nombre `Empresa ${companyId}`, conteos de evidencia inventados y firmas derivadas del recibo.
- **No hay acción real de cerrar el periodo:** `MonthlyCloseOrchestrator.applyEntries` es un stub y no existe un `POST` de cierre.
- **El rastro de auditoría es parcial:** el recibo de aprobación va firmado, pero no hay log append-only, y la web envía `rejectedBy: "current-user"`.
- **Aislamiento entre empresas:** `/api/v1/close` aceptaba el `companyId` y los ids de otra empresa, y tomaba `overrideById`/`completedById` del body. Se corrige en D1.

## PRs (cada uno chico; crítico = test-first + revisión de riesgo)
1. **D1 (crítico, tenant):** `/api/v1/close` rechaza el `companyId` ajeno. Los ids de checklist, item y gate se verifican contra la empresa de la sesión, y el actor sale de la sesión. Nuevos `findItemById`/`findGateById` en el repo.
2. **D2 (crítico, DB/AI-control):** misiones con base de datos real y estados HTTP de error correctos, con tests de forma de respuesta.
   - Hecho: `missionsModule` usa el `db` de `@drenyra/persistence/client`. Los errores responden 404/409/500 según `MissionError.statusCode` (antes 200). Los 500 ya no exponen el mensaje interno. El id debe ser UUID (422). `companyId` en el body es opcional y, si viene, debe ser el de la sesión (403).
3. **D3 (tenant):** transporte web de misiones con cookie y cabeceras de empresa. Desenvuelve `{data}`, crea la misión antes de ejecutarla y usa la versión del servidor.
   - Hecho: `mission-client` usa `runtimeConfig.apiUrl`, `credentials: "include"` y `resolveRequestHeaders()` (sin Bearer de sessionStorage). Lee `{success,data}` y `{success:false,error}`. `run` crea la misión, la ejecuta con la versión devuelta y consulta `GET /:id` cada 1,5 s mientras esté QUEUED/RUNNING. Aprobar, rechazar y reconciliar muestran el snapshot del servidor (sin `rejectedBy: "current-user"`).
   - Nota: el `execute` del API responde JSON; su generador SSE nunca llega al cliente, así que la web consulta el snapshot en vez de usar SSE. Se borraron `sse-mission-stream.ts` y `useMissionEventStream.ts` (sin uso).
4. **D4:** un único estado de misión compartido con `CierreMensualPage`, con empresa y RUC reales y sin valores inventados.
   - Hecho: `MissionWorkspace` pasa su misión a `CierreMensualPage` (ya no hay un segundo `useAccountingMission`). Nombre y RUC salen de `useActiveCompanyContext`. Se quitaron los conteos de evidencia inventados (428, 378…) y los checks "Verificado" fijos. SIRE, bancos e IGV quedan "PENDIENTE" hasta que la misión traiga evidencia. Firmas: solo la del contador, firmada cuando hay recibo de aprobación. El id del cierre es el de la misión del servidor.
5. **D5 (crítico, DB/migración):** log de auditoría append-only para aprobar y rechazar, con el actor real.
6. **D6 (crítico, libros/money/domain):** acción de cierre de periodo (`applyEntries`, `PeriodCloseService`, `POST` con permiso). Test-first y `sire-ledger-repro-check`.
7. **D7:** rutas `/cierre-mensual`, `/evidence` y `/review-queue` (o quitarlas del menú), más un e2e del camino feliz.

## Fuera de alcance
Envío a SUNAT, bloqueo irreversible del periodo, multi-país.

## Restricciones
`scripts/sire-ledger-repro-check.ts` y los tests `RUN_DB_TESTS=1` necesitan Postgres, que no hay en este entorno; se anota en cada PR que los toque.
