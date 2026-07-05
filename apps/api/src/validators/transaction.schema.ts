import { t } from "elysia";

export const createTransactionSchema = t.Object({
	companyId: t.String(),
	type: t.Union([t.Literal("INCOME"), t.Literal("EXPENSE")]),
	partnerId: t.String(),
	totalAmount: t.String(),
	currency: t.Union([t.Literal("PEN"), t.Literal("USD")]),
	hasDetraction: t.Boolean(),
	detractionProfile: t.Optional(
		t.Union([
			t.Literal("SERVICES"),
			t.Literal("TRANSPORT"),
			t.Literal("CONSTRUCTION"),
			t.Literal("GENERIC"),
		]),
	),
});

export const updateTransactionSchema = t.Object({
	type: t.Optional(t.Union([t.Literal("INCOME"), t.Literal("EXPENSE")])),
	partnerId: t.Optional(t.String()),
	totalAmount: t.Optional(t.String()),
	currency: t.Optional(t.Union([t.Literal("PEN"), t.Literal("USD")])),
	hasDetraction: t.Optional(t.Boolean()),
	detractionProfile: t.Optional(
		t.Union([
			t.Literal("SERVICES"),
			t.Literal("TRANSPORT"),
			t.Literal("CONSTRUCTION"),
			t.Literal("GENERIC"),
		]),
	),
});

export const listTransactionsQuerySchema = t.Object({
	type: t.Optional(t.String()),
	partnerId: t.Optional(t.String()),
});
