import { t } from "elysia";

export const CreateChecklistSchema = t.Object({
	companyId: t.String({ format: "uuid" }),
	period: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
	name: t.String({ minLength: 1, maxLength: 255 }),
	assignedToId: t.Optional(t.String({ format: "uuid" })),
	dueDate: t.Optional(t.String({ format: "date-time" })),
	notes: t.Optional(t.String()),
});

export const UpdateChecklistSchema = t.Partial(
	t.Object({
		name: t.String({ minLength: 1, maxLength: 255 }),
		status: t.Union([
			t.Literal("PENDING"),
			t.Literal("IN_PROGRESS"),
			t.Literal("COMPLETED"),
			t.Literal("VERIFIED"),
			t.Literal("LOCKED"),
		]),
		assignedToId: t.Optional(t.String({ format: "uuid" })),
		dueDate: t.Optional(t.String({ format: "date-time" })),
		notes: t.Optional(t.String()),
	}),
);

export const CreateItemSchema = t.Object({
	name: t.String({ minLength: 1, maxLength: 255 }),
	description: t.Optional(t.String()),
	category: t.Union([
		t.Literal("bank_reconciliation"),
		t.Literal("depreciation"),
		t.Literal("tax_provision"),
		t.Literal("accrual"),
		t.Literal("deferral"),
		t.Literal("inventory"),
		t.Literal("intercompany"),
		t.Literal("other"),
	]),
	assignedToId: t.Optional(t.String({ format: "uuid" })),
	sortOrder: t.Optional(t.Number({ default: 0 })),
});

export const UpdateItemSchema = t.Partial(
	t.Object({
		status: t.Union([
			t.Literal("PENDING"),
			t.Literal("IN_PROGRESS"),
			t.Literal("COMPLETED"),
			t.Literal("WAIVED"),
		]),
		notes: t.Optional(t.String()),
		assignedToId: t.Optional(t.String({ format: "uuid" })),
	}),
);

export const AttachEvidenceSchema = t.Object({
	evidenceId: t.String({ format: "uuid" }),
});

export const OverrideGateSchema = t.Object({
	status: t.Union([
		t.Literal("PASSED"),
		t.Literal("FAILED"),
		t.Literal("WAIVED"),
	]),
	resolution: t.String({ minLength: 1 }),
	overrideById: t.String({ format: "uuid" }),
});

export const ChecklistQuerySchema = t.Object({
	companyId: t.String({ format: "uuid" }),
	period: t.Optional(t.String({ pattern: "^\\d{4}-\\d{2}$" })),
});

export const GateQuerySchema = t.Object({
	companyId: t.String({ format: "uuid" }),
	period: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
});

export const DashboardQuerySchema = t.Object({
	companyId: t.String({ format: "uuid" }),
	period: t.String({ pattern: "^\\d{4}-\\d{2}$" }),
});

export const PeriodsQuerySchema = t.Object({
	companyId: t.String({ format: "uuid" }),
});
