/**
 * Banking Reconciliation Schemas
 * Zod schemas for reconciliation batch and rule endpoints.
 */

import { z } from "zod";

/**
 * Reconciliation mode enum.
 */
export const ReconciliationModeSchema = z.enum(["MANUAL", "AUTO"]);

/**
 * Request body for creating a reconciliation batch.
 */
export const CreateReconciliationBatchSchema = z.object({
	bankAccountId: z.string().uuid(),
	periodStart: z.coerce.date(),
	periodEnd: z.coerce.date(),
	openingBalance: z.number().nonnegative(),
	currency: z.string().length(3).default("PEN"),
	mode: ReconciliationModeSchema.optional().default("MANUAL"),
});

/**
 * Request body for closing a reconciliation batch.
 */
export const CloseReconciliationBatchSchema = z.object({
	closingBalance: z.number().nonnegative(),
});

/**
 * Request body for adding a manual match to a batch.
 */
export const CreateBatchMatchSchema = z.object({
	bankTransactionId: z.string().uuid(),
	documentId: z.string().uuid(),
	documentType: z.enum(["INVOICE", "BILL"]),
	matchScore: z.number().int().min(0).max(100),
	matchCriteria: z.enum(["REFERENCE", "AMOUNT_DATE", "AMOUNT_ENTITY", "PARTIAL"]),
});

/**
 * Reconciliation batch list query params.
 */
export const ListBatchesQuerySchema = z.object({
	bankAccountId: z.string().uuid().optional(),
	status: z
		.enum([
			"OPEN",
			"IN_PROGRESS",
			"PARTIALLY_MATCHED",
			"MATCHED",
			"CLOSED_WITH_DISCREPANCY",
			"CLOSED",
		])
		.optional(),
	limit: z.coerce.number().int().min(1).max(100).optional().default(20),
	offset: z.coerce.number().int().min(0).optional().default(0),
});

// ── Reconciliation Rules ───────────────────────────────────────────────────

/**
 * Rule type enum.
 */
export const ReconciliationRuleTypeSchema = z.enum(["MATCH", "EXCLUSION"]);

/**
 * Request body for creating a reconciliation rule.
 */
export const CreateReconciliationRuleSchema = z.object({
	name: z.string().min(1).max(200),
	ruleType: ReconciliationRuleTypeSchema,
	conditions: z.object({}).passthrough(),
	priority: z.number().int().positive(),
	isActive: z.boolean().optional().default(true),
});

/**
 * Request body for updating a reconciliation rule.
 */
export const UpdateReconciliationRuleSchema = z.object({
	name: z.string().min(1).max(200).optional(),
	conditions: z.object({}).passthrough().optional(),
	priority: z.number().int().positive().optional(),
	isActive: z.boolean().optional(),
});
