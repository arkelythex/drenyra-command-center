import { t } from "elysia";

export const createInvoiceSchema = t.Object({
	companyId: t.String(),
	customerId: t.String(),
	series: t.String(),
	issueDate: t.String(),
	dueDate: t.String(),
	currency: t.Optional(t.Union([t.Literal("PEN"), t.Literal("USD")])),
	exchangeRate: t.Optional(t.String()),
	notes: t.Optional(t.String()),
	items: t.Array(
		t.Object({
			productId: t.Optional(t.String()),
			description: t.String(),
			quantity: t.String(),
			unitPrice: t.String(),
			taxType: t.Optional(
				t.Union([
					t.Literal("GRAVADO"),
					t.Literal("EXONERADO"),
					t.Literal("INAFECTO"),
				]),
			),
		}),
	),
});

export const updateInvoiceStatusSchema = t.Object({
	status: t.Union([
		t.Literal("DRAFT"),
		t.Literal("SENT"),
		t.Literal("OVERDUE"),
		t.Literal("PAID"),
		t.Literal("CANCELLED"),
	]),
});

export const listInvoicesQuerySchema = t.Object({
	companyId: t.Optional(t.String()),
	status: t.Optional(t.String()),
});
