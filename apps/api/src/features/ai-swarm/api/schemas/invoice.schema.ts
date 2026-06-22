/**
 * Invoice validation schemas
 *
 * Zod schemas for invoice validation endpoints
 *
 * @module ai-swarm/api/schemas/invoice
 */

import { t } from "elysia";

/**
 * Invoice validation request schema
 */
export const InvoiceSchema = t.Object({
	id: t.String(),
	ruc: t.String({ minLength: 11, maxLength: 11 }),
	serie: t.String(),
	numero: t.String(),
	fecha: t.String(),
	moneda: t.Union([t.Literal("PEN"), t.Literal("USD"), t.Literal("EUR")]),
	subtotal: t.Number(),
	igv: t.Number(),
	total: t.Number(),
	items: t.Array(
		t.Object({
			descripcion: t.String(),
			cantidad: t.Number(),
			precioUnitario: t.Number(),
			subtotal: t.Number(),
		}),
	),
});

export const ValidateInvoicesRequestSchema = t.Object({
	invoices: t.Array(InvoiceSchema),
	priority: t.Optional(
		t.Union([
			t.Literal("low"),
			t.Literal("medium"),
			t.Literal("high"),
			t.Literal("critical"),
		]),
	),
});
