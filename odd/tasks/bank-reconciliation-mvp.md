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
- Importar extractos bancarios (CSV/API).
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
1. **Crítico, aislamiento:** `rejectForeignCompanyId` en `/api/banking`; se retira `POST /transactions/:id/reconcile` (no verificaba el documento y aceptaba `userId` del body). Conciliar va solo por `/api/reconciliations`.
2. **Crítico, dinero:** importar en céntimos, sin chequeo de saldo, sin duplicados y en una transacción.
3. **Crítico, conciliación:** un comprobante ya vinculado no se vuelve a ofrecer ni a aceptar; `/matches` responde 422 y no 500 con montos inválidos.
4. Web: "Importar extracto" en `/tesoreria/reconciliations`.
5. Limpieza del código muerto de conciliación en `banking`.

