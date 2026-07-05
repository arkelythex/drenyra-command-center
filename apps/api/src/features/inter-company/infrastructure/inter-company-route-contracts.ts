import { t } from "elysia";

/**
 * interCompanyCreateBodySchema const.
 *
 * @example
 * ```ts
 * console.log(interCompanyCreateBodySchema);
 * ```
 */
export const interCompanyCreateBodySchema = t.Object({
	economicGroupId: t.String(),
	fromCompanyId: t.String(),
	toCompanyId: t.String(),
	concept: t.String(),
	amount: t.Number({ minimum: 0 }),
	taxType: t.Union([
		t.Literal("GRAVADO"),
		t.Literal("EXONERADO"),
		t.Literal("INAFECTO"),
	]),
	detractionProfile: t.Optional(
		t.Union([
			t.Literal("SERVICES"),
			t.Literal("TRANSPORT"),
			t.Literal("CONSTRUCTION"),
			t.Literal("GENERIC"),
		]),
	),
});

/**
 * interCompanyAuditQuerySchema const.
 *
 * @example
 * ```ts
 * console.log(interCompanyAuditQuerySchema);
 * ```
 */
export const interCompanyAuditQuerySchema = t.Object({
	economicGroupId: t.String({ minLength: 1 }),
	detractionProfile: t.Optional(
		t.Union([
			t.Literal("SERVICES"),
			t.Literal("TRANSPORT"),
			t.Literal("CONSTRUCTION"),
			t.Literal("GENERIC"),
		]),
	),
	detractionRuleCode: t.Optional(t.String({ minLength: 1, maxLength: 80 })),
	dateFrom: t.Optional(t.String({ format: "date" })),
	dateTo: t.Optional(t.String({ format: "date" })),
	limit: t.Optional(t.Numeric({ minimum: 1, maximum: 500 })),
	offset: t.Optional(t.Numeric({ minimum: 0, maximum: 100000 })),
	sortBy: t.Optional(
		t.Union([
			t.Literal("createdAt"),
			t.Literal("amount"),
			t.Literal("igvAmount"),
			t.Literal("detractionAmount"),
		]),
	),
	sortDir: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
	format: t.Optional(t.Union([t.Literal("json"), t.Literal("csv")])),
});

/**
 * interCompanyRouteDetails const.
 *
 * @example
 * ```ts
 * console.log(interCompanyRouteDetails);
 * ```
 */
export const interCompanyRouteDetails = {
	create: {
		tags: ["Inter-Company"],
		summary: "Create atomic mirror transactions between two group companies",
	},
	audit: {
		tags: ["Inter-Company"],
		summary: "Audit inter-company detraction by profile/rule",
	},
	groupList: {
		tags: ["Inter-Company"],
		summary: "List all historical inter-company movements for a group",
	},
	spot: {
		tags: ["Inter-Company"],
		summary: "Generate the official SUNAT SPOT (Detraction) certificate",
	},
	stats: {
		tags: ["Inter-Company"],
		summary: "Get consolidated metrics for group transactions",
	},
};
