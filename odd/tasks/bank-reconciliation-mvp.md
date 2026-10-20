# Conciliación bancaria MVP

**Estado:** Working · **Nivel:** crítico (dinero, aislamiento por empresa) · **Autorizado:** sí (Dreamcoder, "autorizo todo y avanza")

## Objetivo
Que la pantalla de conciliación bancaria muestre los movimientos reales de la empresa activa, proponga con qué factura o compra casa cada uno y permita confirmarlo. Todo en céntimos enteros y con aislamiento por empresa.

## Alcance
1. **Seguridad:** la API rechaza un `companyId` que no sea el de la sesión (PR #293).
2. **API:**
   - Montos en céntimos (`stats` hoy suma con `parseFloat`).
   - `/:id/matches` real: facturas abiertas para abonos y compras abiertas para cargos, con puntaje por monto exacto, número de comprobante en la referencia o descripción, y cercanía de fecha.
   - `reconcile` enlaza el comprobante elegido (`invoiceId` / `billId`).
3. **Web:** el workspace deja `reconciliation.data.ts` y usa pendientes, coincidencias y confirmación de la API; `useReconciliationDiffs` sin `parseFloat`.

## Fuera de alcance
- Importar extractos por API del banco (el CSV sí entró en el paso 4).
- Conciliar parcialmente o un pago contra varios comprobantes.
- Asientos contables automáticos al conciliar.

## Restricciones
- Test-first.
- Matcher puro sin DB.
- No escribir en libros: solo se marca la transacción bancaria y su vínculo.

## Diagnóstico de punta a punta (2026-10-20, contra Postgres 16 local)
- La conciliación (`/api/reconciliations`) funciona: sugiere bien y guarda el vínculo, y rechaza otra empresa (403/404).
- Un usuario no puede cargar un extracto: no hay pantalla. Solo existe `POST /api/banking/import`, que usa montos `number` (floats), rechaza un primer cargo con saldo 0 ("Insufficient balance") y duplica si se reimporta.
- **`/api/banking` filtraba entre empresas:** con `companyId` de otra empresa en query/body se podían leer cuentas y saldos, importar movimientos, crear cuentas y lanzar `/auto-reconcile`.
- Una misma factura se puede conciliar con dos movimientos (`findOpenDocuments` no excluye los ya vinculados).

## Plan (un PR por paso)
1. **Crítico, aislamiento:** `rejectForeignCompanyId` en `/api/banking`; se retira `POST /transactions/:id/reconcile` (no verificaba el documento y aceptaba `userId` del body). Conciliar va solo por `/api/reconciliations`. Hecho en #335.
2. **Crítico, dinero:** importar en céntimos, sin chequeo de saldo, sin duplicados y en una transacción. `POST /api/banking/import` recibe `amountCents` (entero > 0); la planificación es pura (`application/statement-import.ts`) y el repositorio escribe todo o nada con la cuenta bloqueada. Hecho en #337.
3. **Crítico, conciliación:** un comprobante ya vinculado no se vuelve a ofrecer ni a aceptar; `/matches` responde 422 y no 500 con montos inválidos. El vínculo bloquea la fila del comprobante (`FOR UPDATE`), así que de dos conciliaciones simultáneas solo gana una (la otra recibe 409 `ALREADY_RECONCILED`); `/pending` sale ordenado por fecha. Hecho en #340.
4. Web: "Importar extracto" en `/tesoreria/reconciliations`. El CSV se lee en el navegador (`services/statement-csv.ts`: montos como texto a céntimos, encabezado debajo del preámbulo del banco, monto con signo, columna de tipo o cargo/abono por separado), se previsualiza y se envía a una cuenta existente o a una nueva. Reemplaza el botón muerto "Reconciliar".
5. Limpieza del código muerto de conciliación en `banking`. Se retiran `POST /api/banking/auto-reconcile` (con su `autoReconcile`, `reconcileAndLink`, la comparación shadow con el worker Go y el `MatchingEngine`), el handler y el comando `reconcileTransaction` (con `BankingRepository.reconcileTransaction` y `loadScopedBankTransaction`) y sus pruebas; quedan las métricas shadow (solo lectura), lotes, reglas, importación, cuentas, movimientos y resumen. Hecho en #345.
6. **Crítico, cobro:** conciliar un movimiento contra una factura le aplica el pago en céntimos (`paid_amount` sube, `balance_due` baja, `PAID` con fecha de pago al saldar) y contra una compra la marca `PAID`; desconciliar revierte ambos y la deja `SENT` u `OVERDUE` según su vencimiento. Todo en la misma transacción que bloquea el comprobante.

