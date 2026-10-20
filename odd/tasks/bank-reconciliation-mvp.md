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
