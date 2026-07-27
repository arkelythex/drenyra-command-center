/**
 * Reconciliation Batch Handlers
 * API handlers for reconciliation batch lifecycle management.
 */

import type { z } from "zod";
import { Money } from "@drenyra/domain/value-objects/Money";
import { ReconciliationBatch } from "@drenyra/domain/entities/ReconciliationBatch";
import { db } from "@drenyra/persistence/client";
import { eq, and, desc, sql } from "@drenyra/persistence/query";
import {
	bankReconciliations,
	bankTransactions,
} from "@drenyra/persistence/schema";
import type { CompanyContext } from "../../../shared/plugins/company-scope-guard";
import { fail, ok } from "../../shared/api-response";
import type {
	CloseReconciliationBatchSchema,
	CreateBatchMatchSchema,
	CreateReconciliationBatchSchema,
	ListBatchesQuerySchema,
} from "./banking-reconciliation.schemas";

// ── Context Types ──────────────────────────────────────────────────────────

type IdParams = {
	params: { id: string };
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

type CreateBatchCtx = {
	body: z.infer<typeof CreateReconciliationBatchSchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

type CloseBatchCtx = {
	params: { id: string };
	body: z.infer<typeof CloseReconciliationBatchSchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

type CreateMatchCtx = {
	params: { id: string };
	body: z.infer<typeof CreateBatchMatchSchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

type ListBatchesCtx = {
	query: z.infer<typeof ListBatchesQuerySchema>;
	companyContext?: CompanyContext;
	set: { status?: number | string };
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Assert the company context is present and return it.
 */
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

/**
 * Assert the batch exists and belongs to the company.
 */
async function loadScopedBatch(
	batchId: string,
	companyId: string,
	set: { status?: number | string },
): Promise<typeof bankReconciliations.$inferSelect | null> {
	const batch = await db.query.bankReconciliations.findFirst({
		where: and(
			eq(bankReconciliations.id, batchId),
			eq(bankReconciliations.companyId, companyId),
		),
	});

	if (!batch) {
		set.status = 404;
		return null;
	}
	return batch;
}

// ── Handlers ───────────────────────────────────────────────────────────────

export const reconciliationBatchHandlers = {
	/**
	 * Create a new reconciliation batch.
	 */
	createBatch: async ({ body, companyContext, set }: CreateBatchCtx) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx) return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		try {
			const openingBalance = Money.fromAmount(body.openingBalance, body.currency as "PEN" | "USD");

			// Validate via domain entity (thows if invalid)
			const domainBatch = ReconciliationBatch.createNew({
				companyId: ctx.companyId,
				bankAccountId: body.bankAccountId,
				periodStart: body.periodStart,
				periodEnd: body.periodEnd,
				openingBalance,
				mode: body.mode,
			});

			// Persist to DB
			const [saved] = await db
				.insert(bankReconciliations)
				.values({
					id: domainBatch.id,
					companyId: ctx.companyId,
					accountId: body.bankAccountId,
					startDate: body.periodStart.toISOString().slice(0, 10),
					endDate: body.periodEnd.toISOString().slice(0, 10),
					openingBalance: body.openingBalance.toFixed(4),
					closingBalance: "0",
					status: "IN_PROGRESS",
					mode: body.mode,
					batchReference: `BATCH-${body.periodStart.toISOString().slice(0, 7)}-${body.bankAccountId.slice(0, 8)}`,
					matchedCount: 0,
					unmatchedCount: 0,
				})
				.returning();

			return ok({ ...saved, domainBatch: domainBatch.toJSON() });
		} catch (error) {
			set.status = 400;
			return fail(
				error instanceof Error ? error.message : "Error creating batch",
				"BATCH_CREATION_ERROR",
			);
		}
	},

	/**
	 * Get a reconciliation batch by ID.
	 */
	getBatch: async ({ params, companyContext, set }: IdParams) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx) return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const batch = await loadScopedBatch(params.id, ctx.companyId, set);
		if (!batch) return fail("Lote de conciliación no encontrado", "BATCH_NOT_FOUND");

		return ok(batch);
	},

	/**
	 * List reconciliation batches with optional filters.
	 */
	listBatches: async ({ query, companyContext, set }: ListBatchesCtx) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx) return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const conditions = [eq(bankReconciliations.companyId, ctx.companyId)];

		if (query.bankAccountId) {
			conditions.push(eq(bankReconciliations.accountId, query.bankAccountId));
		}
		if (query.status) {
			conditions.push(eq(bankReconciliations.status, query.status));
		}

		const batches = await db.query.bankReconciliations.findMany({
			where: and(...conditions),
			orderBy: [desc(bankReconciliations.createdAt)],
			limit: query.limit,
			offset: query.offset,
		});

		return ok({ batches, total: batches.length });
	},

	/**
	 * Close a reconciliation batch.
	 */
	closeBatch: async ({ params, body, companyContext, set }: CloseBatchCtx) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx) return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const record = await loadScopedBatch(params.id, ctx.companyId, set);
		if (!record) return fail("Lote de conciliación no encontrado", "BATCH_NOT_FOUND");

		if (record.status === "COMPLETED" || record.closedAt) {
			set.status = 409;
			return fail("El lote ya está cerrado", "BATCH_ALREADY_CLOSED");
		}

		// Count matched and unmatched transactions
		const allTx = await db.query.bankTransactions.findMany({
			where: and(
				eq(bankTransactions.accountId, record.accountId),
				sql`${bankTransactions.transactionDate} >= ${record.startDate}`,
				sql`${bankTransactions.transactionDate} <= ${record.endDate}`,
			),
		});

		const matchedCount = allTx.filter((tx) => tx.isReconciled).length;
		const unmatchedCount = allTx.length - matchedCount;
		const discrepancy = body.closingBalance - parseFloat(record.openingBalance);

		const [updated] = await db
			.update(bankReconciliations)
			.set({
				status: unmatchedCount > 0 || Math.abs(discrepancy) > 0.01
					? "CLOSED_WITH_DISCREPANCY"
					: "COMPLETED",
				matchedCount,
				unmatchedCount,
				discrepancyAmount: discrepancy.toFixed(4),
				closingBalance: body.closingBalance.toFixed(4),
				closedAt: new Date(),
			})
			.where(eq(bankReconciliations.id, params.id))
			.returning();

		return ok(updated);
	},

	/**
	 * Create a manual match (suggested match) in the batch.
	 */
	createMatch: async ({ params, body, companyContext, set }: CreateMatchCtx) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx) return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const record = await loadScopedBatch(params.id, ctx.companyId, set);
		if (!record) return fail("Lote de conciliación no encontrado", "BATCH_NOT_FOUND");

		if (record.closedAt) {
			set.status = 409;
			return fail("No se puede agregar coincidencias a un lote cerrado", "BATCH_CLOSED");
		}

		// Verify transaction belongs to the batch's account
		const tx = await db.query.bankTransactions.findFirst({
			where: and(
				eq(bankTransactions.id, body.bankTransactionId),
				eq(bankTransactions.accountId, record.accountId),
			),
		});

		if (!tx) {
			set.status = 404;
			return fail("Transacción no encontrada en esta cuenta", "TRANSACTION_NOT_FOUND");
		}

		// Insert match record
		const matchTable = (await import("@drenyra/persistence/schema"))
			.transactionReconciliationMatches;
		const [match] = await db
			.insert(matchTable)
			.values({
				transactionId: body.bankTransactionId,
				documentId: body.documentId,
				documentType: body.documentType,
				matchScore: body.matchScore,
				matchCriteria: body.matchCriteria,
				isConfirmed: false,
			})
			.returning();

		return ok(match);
	},

	/**
	 * Get batch matches.
	 */
	getBatchMatches: async ({ params, companyContext, set }: IdParams) => {
		const ctx = requireCompanyContext(companyContext, set);
		if (!ctx) return fail("Company context is required", "COMPANY_CONTEXT_REQUIRED");

		const record = await loadScopedBatch(params.id, ctx.companyId, set);
		if (!record) return fail("Lote de conciliación no encontrado", "BATCH_NOT_FOUND");

		const matchTable = (await import("@drenyra/persistence/schema"))
			.transactionReconciliationMatches;
		const matches = await db.query.transactionReconciliationMatches.findMany({
			where: eq(matchTable.transactionId, sql`${bankTransactions.accountId} = ${record.accountId}`),
			limit: 200,
		});

		return ok(matches);
	},
};
