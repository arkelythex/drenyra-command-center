/**
 * Reconciliation Rule Handlers
 * API handlers for reconciliation rule CRUD operations.
 */

import type { z } from "zod";
import { ReconciliationRule } from "@drenyra/domain/entities/ReconciliationRule";
import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { reconciliationRules } from "@drenyra/persistence/schema";
import type { CompanyContext } from "../../../shared/plugins/company-scope-guard";
import { fail, ok } from "../../shared/api-response";
import type {
	CreateReconciliationRuleSchema,
	UpdateReconciliationRuleSchema,
} from "./banking-reconciliation.schemas";

// ── Context Types ──────────────────────────────────────────────────────────

type IdWithCompany = {
	params: { id: string };
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

type CreateRuleCtx = {
	body: z.infer<typeof CreateReconciliationRuleSchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

type UpdateRuleCtx = {
	params: { id: string };
	body: z.infer<typeof UpdateReconciliationRuleSchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

// ── Helpers ────────────────────────────────────────────────────────────────

function requireCompanyContext(
	companyContext: CompanyContext | undefined,
	set: { status?: number | string },
): CompanyContext | null {
	if (!companyContext) {
		set.status = 401;
		return null;
	}
	return companyContext;
}

// ── Handlers ───────────────────────────────────────────────────────────────

export const reconciliationRuleHandlers = {
	/**
	 * Create a new reconciliation rule.
	 */
	createRule: async ({ body, companyContext, set }: CreateRuleCtx) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx)
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		try {
			const domainRule = ReconciliationRule.createNew({
				companyId: ctx.companyId,
				name: body.name,
				ruleType: body.ruleType,
				conditions: body.conditions as Record<string, unknown>,
				priority: body.priority,
				isActive: body.isActive,
			});

			const [saved] = await db
				.insert(reconciliationRules)
				.values({
					id: domainRule.id,
					companyId: ctx.companyId,
					name: domainRule.name,
					ruleType: domainRule.ruleType,
					conditions: domainRule.conditions,
					priority: domainRule.priority,
					isActive: domainRule.isActive,
				})
				.returning();

			return ok({ ...saved, domainRule: domainRule.toJSON() });
		} catch (error) {
			set.status = 400;
			return fail(
				error instanceof Error ? error.message : "Error creating rule",
				"RULE_CREATION_ERROR",
			);
		}
	},

	/**
	 * List all reconciliation rules for the company.
	 */
	listRules: async ({
		companyContext,
		set,
	}: {
		companyContext?: CompanyContext;
		set: { status?: number | string };
	}) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx)
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const rules = await db.query.reconciliationRules.findMany({
			where: eq(reconciliationRules.companyId, ctx.companyId),
			orderBy: [reconciliationRules.priority],
		});

		return ok(rules);
	},

	/**
	 * Get a single reconciliation rule by ID.
	 */
	getRule: async ({ params, companyContext, set }: IdWithCompany) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx)
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const rule = await db.query.reconciliationRules.findFirst({
			where: and(
				eq(reconciliationRules.id, params.id),
				eq(reconciliationRules.companyId, ctx.companyId),
			),
		});

		if (!rule) {
			set.status = 404;
			return fail("Regla de conciliación no encontrada", "RULE_NOT_FOUND");
		}

		return ok(rule);
	},

	/**
	 * Update a reconciliation rule.
	 */
	updateRule: async ({ params, body, companyContext, set }: UpdateRuleCtx) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx)
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		// Verify rule exists
		const existing = await db.query.reconciliationRules.findFirst({
			where: and(
				eq(reconciliationRules.id, params.id),
				eq(reconciliationRules.companyId, ctx.companyId),
			),
		});

		if (!existing) {
			set.status = 404;
			return fail("Regla de conciliación no encontrada", "RULE_NOT_FOUND");
		}

		// Validate through domain entity
		const domainRule = ReconciliationRule.create({
			id: existing.id,
			companyId: existing.companyId,
			name: body.name ?? existing.name,
			ruleType: existing.ruleType as "MATCH" | "EXCLUSION",
			conditions:
				body.conditions ?? (existing.conditions as Record<string, unknown>),
			priority: body.priority ?? existing.priority,
			isActive: body.isActive ?? existing.isActive ?? true,
			createdAt: existing.createdAt ?? new Date(),
		});

		const [updated] = await db
			.update(reconciliationRules)
			.set({
				name: domainRule.name,
				conditions: domainRule.conditions,
				priority: domainRule.priority,
				isActive: domainRule.isActive,
			})
			.where(eq(reconciliationRules.id, params.id))
			.returning();

		return ok(updated);
	},

	/**
	 * Delete (deactivate) a reconciliation rule.
	 */
	deleteRule: async ({ params, companyContext, set }: IdWithCompany) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx)
			return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const [updated] = await db
			.update(reconciliationRules)
			.set({ isActive: false })
			.where(
				and(
					eq(reconciliationRules.id, params.id),
					eq(reconciliationRules.companyId, ctx.companyId),
				),
			)
			.returning();

		if (!updated) {
			set.status = 404;
			return fail("Regla de conciliación no encontrada", "RULE_NOT_FOUND");
		}

		return ok({ deleted: true });
	},
};
