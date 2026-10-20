# Fase D: cierre mensual de punta a punta

**Estado:** Working (D1–D6a mergeados: #309, #311, #313, #316, #318, #328; D7 en curso; publicar asientos espera decisión). Autorizado por Dreamcoder ("te autorizo todo y avanza de forma autónoma", 2026-10-20).

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
   - Hecho: aprobar y rechazar escriben una fila en `mission_receipts` (actor de la sesión, decisión, hashes) en la misma transacción que el cambio de estado. La migración `0034_mission_receipts_append_only.sql` rechaza UPDATE, DELETE y TRUNCATE. También se corrigió `receiptId`: tenía 40 caracteres y Postgres lo rechazaba, así que ninguna aprobación real se guardaba.
   - Probado contra Postgres 16 local (`drizzle-kit push` + la migración), con `RUN_DB_TESTS=1`.
6. **D6 (crítico, libros/money/domain):** acción de cierre de periodo (`applyEntries`, `PeriodCloseService`, `POST` con permiso). Test-first y `sire-ledger-repro-check`.
   - Hallazgo previo (D5): aprobar recalcula `computeEvidenceHash(proposal.evidence)` con `JSON.stringify` después de pasar por jsonb, que reordena las claves. Además, `build-evidence.step.ts` calcula `evidenceHash` con otra función (`hashObject`). Así, una propuesta real del pipeline nunca coincide y aprobar falla con EVIDENCE_MISMATCH. Hay que unificar un hash canónico (claves ordenadas) en productor y verificador.
   - Diagnóstico D6 (2026-10-20, ejecutado contra Postgres 16 local):
     - Una misión real muere en el paso 1. `loadMission`, `blockMission`, `transitionMission` y el handler usan sintaxis knex sobre Drizzle. `MissionEventStore.appendEvent` usa `FOR UPDATE` con `MAX()`, y Postgres lo rechaza. La misión queda en RUNNING para siempre.
     - El orquestador nunca guarda la propuesta ni el estado AWAITING_APPROVAL en la misión.
     - El hash de evidencia está roto en tres lugares: `hashObject` reduce los arrays a `[{}]`; aprobar hashea `proposal.evidence`, que el pipeline no escribe; y jsonb reordena las claves.
     - `applyEntries` es un stub. `TransactionalApplyUseCase` sí publica asientos cuadrados y cierra el periodo (`cerrado_final`), sin forma de reabrirlo.
     - **La propuesta es de mentira:** 3 asientos fijos, con fechas de otro mes. "IGV" se registra como gasto en la cuenta 641. No se lee nada de los libros reales. Además, todos los gates se marcan PASSED sin evaluarlos.
     - Montos: `number` en una columna int4, no el VO Money.
   - Plan: D6a (plomería: Drizzle, event store, guardar la propuesta, hash canónico) llega hasta "esperando aprobación". La publicación de asientos queda apagada hasta que la propuesta salga de datos reales; ver la decisión en el hilo.
   - **D6a hecho:** puerto `MonthlyCloseMissionStore` (adaptador Drizzle, siempre por empresa y solo desde RUNNING), `computeEvidenceBundleHash` en `@drenyra/domain` para productor y verificador, ids de evidencia estables, aprobar exige evidencia no vacía, eventos no fatales y append con advisory lock. Probado de punta a punta contra Postgres (`monthly-close-pipeline.postgres.test.ts`): crear → ejecutar → AWAITING_APPROVAL → aprobar.
   - Pendiente: los bloqueos y el motivo de fallo solo quedan en el log de eventos (no hay columna). `applyEntries` sigue apagado.
7. **D7:** rutas `/cierre-mensual`, `/evidence` y `/review-queue` (o quitarlas del menú), más un e2e del camino feliz.
   - **D7 hecho:** `/cierre-mensual` redirige al workspace de la empresa y periodo activos (`intent=monthly-close`); `/` también. El menú y la paleta solo muestran pantallas que existen (`lib/available-nav-paths.ts`, con test contra el route tree); evidencia y aprobaciones viven dentro del workspace. Corregido: "Iniciar misión" enviaba `2026-3` y la API exige `YYYY-MM`.
   - El camino feliz completo está cubierto contra Postgres en la API (`monthly-close-pipeline.postgres.test.ts`) y en el cliente con tests de hooks. El e2e en navegador queda para la fase A2.

## Fuera de alcance
Envío a SUNAT, bloqueo irreversible del periodo, multi-país.

## Restricciones
`scripts/sire-ledger-repro-check.ts` y los tests `RUN_DB_TESTS=1` necesitan Postgres, que no hay en este entorno; se anota en cada PR que los toque.
