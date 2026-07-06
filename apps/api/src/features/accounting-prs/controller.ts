import { and, desc, eq, sql } from "@drenyra/persistence/query";
import { accountingPrs, prApprovals } from "@drenyra/persistence/schema";
import { accountingPrStatus } from "@drenyra/persistence/schema/accounting-pr.schema";
import { db } from "../../lib/db";
import type {
	AccountingPrDTO,
	CreatePrRequest,
	PrListQuery,
	PaginatedResponse,
	UpdatePrRequest,
} from "@drenyra/application/features/accounting-prs";

// ---------------------------------------------------------------------------
// Types (Drizzle internal)
// ---------------------------------------------------------------------------

export type PrRecord = typeof accountingPrs.$inferSelect;
export type PrInsert = typeof accountingPrs.$inferInsert;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

class AccountingPrController {
	// --- CREATE FROM ENTRIES ---
	async createFromEntries(
		companyId: string,
		createdById: string | undefined,
		data: {
			title: string;
			description?: string;
			entryIds: string[];
		},
	): Promise<PrRecord> {
		const prNumber = await this.nextPrNumber(companyId);

		const [record] = await db
			.insert(accountingPrs)
			.values({
				companyId,
				prNumber,
				title: data.title,
				description: data.description ?? null,
				status: "DRAFT",
				entries: data.entryIds,
				evidenceIds: [],
				totalDebitCents: 0,
				totalCreditCents: 0,
				createdById: createdById ?? null,
			})
			.returning();

		return record;
	}

	// --- CREATE ---
	async create(
		companyId: string,
		createdById: string | undefined,
		data: CreatePrRequest,
	): Promise<PrRecord> {
		const prNumber = await this.nextPrNumber(companyId);

		const [record] = await db
			.insert(accountingPrs)
			.values({
				companyId,
				prNumber,
				title: data.title,
				description: data.description ?? null,
				status: "DRAFT",
				entries: data.entries,
				evidenceIds: data.evidenceIds ?? [],
				totalDebitCents: data.totalDebitCents,
				totalCreditCents: data.totalCreditCents,
				createdById: createdById ?? null,
			})
			.returning();

		return record;
	}

	// --- LIST ---
	async list(
		companyId: string,
		query: PrListQuery,
	): Promise<PaginatedResponse<PrRecord>> {
		const conditions: ReturnType<typeof eq>[] = [
			eq(accountingPrs.companyId, companyId),
		];

		if (query.status) {
			if (accountingPrStatus.includes(query.status as any)) {
				conditions.push(
					eq(
						accountingPrs.status,
						query.status as (typeof accountingPrStatus)[number],
					),
				);
			}
		}
		if (query.reviewerId) {
			conditions.push(eq(accountingPrs.reviewerId, query.reviewerId));
		}

		const limit = query.limit ? parseInt(query.limit, 10) : 50;
		const offset = query.offset ? parseInt(query.offset, 10) : 0;

		const [records, totalResult] = await Promise.all([
			db
				.select()
				.from(accountingPrs)
				.where(and(...conditions))
				.orderBy(desc(accountingPrs.createdAt))
				.limit(limit)
				.offset(offset),
			db
				.select({ count: sql<number>`count(*)` })
				.from(accountingPrs)
				.where(and(...conditions)),
		]);

		return {
			data: records,
			total: Number(totalResult[0]?.count ?? 0),
			limit,
			offset,
		};
	}

	// --- GET BY ID ---
	async getById(id: string): Promise<PrRecord | null> {
		const [record] = await db
			.select()
			.from(accountingPrs)
			.where(eq(accountingPrs.id, id))
			.limit(1);

		return record ?? null;
	}

	// --- UPDATE ---
	async update(
		id: string,
		companyId: string,
		data: UpdatePrRequest,
	): Promise<PrRecord | null> {
		const existing = await this.getById(id);
		if (!existing) return null;

		if (existing.status !== "DRAFT") {
			throw new Error("Solo se pueden editar PRs en borrador");
		}

		const updateData: Partial<PrInsert> = {
			updatedAt: new Date(),
		};

		if (data.title !== undefined) updateData.title = data.title;
		if (data.description !== undefined)
			updateData.description = data.description;
		if (data.entries !== undefined) updateData.entries = data.entries;
		if (data.evidenceIds !== undefined)
			updateData.evidenceIds = data.evidenceIds;
		if (data.totalDebitCents !== undefined)
			updateData.totalDebitCents = data.totalDebitCents;
		if (data.totalCreditCents !== undefined)
			updateData.totalCreditCents = data.totalCreditCents;

		const [record] = await db
			.update(accountingPrs)
			.set(updateData)
			.where(
				and(eq(accountingPrs.id, id), eq(accountingPrs.companyId, companyId)),
			)
			.returning();

		return record ?? null;
	}

	// --- SUBMIT ---
	async submit(id: string, companyId: string): Promise<PrRecord | null> {
		return this.transitionStatus(id, companyId, "DRAFT", "PENDING_REVIEW");
	}

	// --- APPROVE ---
	async approve(
		id: string,
		companyId: string,
		signerId: string,
		comment?: string,
	): Promise<PrRecord | null> {
		const existing = await this.getById(id);
		if (!existing) return null;

		if (existing.status !== "PENDING_REVIEW") {
			throw new Error("Solo se pueden aprobar PRs en revisión");
		}

		const now = new Date();

		// Insert approval record
		await db.insert(prApprovals).values({
			prId: id,
			signerId,
			signedAt: now,
			comment: comment ?? null,
		});

		// Update PR
		const [record] = await db
			.update(accountingPrs)
			.set({
				status: "APPROVED",
				reviewerId: signerId,
				reviewedAt: now,
				reviewComment: comment ?? existing.reviewComment,
				approveSignerIds: [
					...new Set([...(existing.approveSignerIds ?? []), signerId]),
				],
				approveSignatures: [
					...(existing.approveSignatures ?? []),
					{ signerId, signedAt: now.toISOString(), comment },
				],
				updatedAt: now,
			})
			.where(
				and(eq(accountingPrs.id, id), eq(accountingPrs.companyId, companyId)),
			)
			.returning();

		return record ?? null;
	}

	// --- REJECT ---
	async reject(
		id: string,
		companyId: string,
		reason: string,
	): Promise<PrRecord | null> {
		const [record] = await db
			.update(accountingPrs)
			.set({
				status: "REJECTED",
				reviewComment: reason,
				reviewedAt: new Date(),
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(accountingPrs.id, id),
					eq(accountingPrs.companyId, companyId),
					eq(accountingPrs.status, "PENDING_REVIEW" as const),
				),
			)
			.returning();

		return record ?? null;
	}

	// --- MULTI-SIGNER APPROVE ---
	async addSignature(
		id: string,
		companyId: string,
		signerId: string,
		comment?: string,
	): Promise<PrRecord | null> {
		const existing = await this.getById(id);
		if (!existing) return null;

		if (existing.status !== "PENDING_REVIEW") {
			throw new Error("Solo se pueden firmar PRs en revisión");
		}

		const now = new Date();

		// Insert approval record
		await db.insert(prApprovals).values({
			prId: id,
			signerId,
			signedAt: now,
			comment: comment ?? null,
		});

		// Update PR with new signature
		const [record] = await db
			.update(accountingPrs)
			.set({
				approveSignerIds: [
					...new Set([...(existing.approveSignerIds ?? []), signerId]),
				],
				approveSignatures: [
					...(existing.approveSignatures ?? []),
					{ signerId, signedAt: now.toISOString(), comment },
				],
				updatedAt: now,
			})
			.where(
				and(eq(accountingPrs.id, id), eq(accountingPrs.companyId, companyId)),
			)
			.returning();

		return record ?? null;
	}

	// --- POST ---
	async post(id: string, companyId: string): Promise<PrRecord | null> {
		return this.transitionStatus(id, companyId, "APPROVED", "POSTED");
	}

	// --- HELPERS ---
	private async nextPrNumber(companyId: string): Promise<number> {
		const [result] = await db
			.select({ maxPrNumber: sql<number>`max(${accountingPrs.prNumber})` })
			.from(accountingPrs)
			.where(eq(accountingPrs.companyId, companyId));

		return (result?.maxPrNumber ?? 0) + 1;
	}

	private async transitionStatus(
		id: string,
		companyId: string,
		fromStatus: (typeof accountingPrStatus)[number],
		toStatus: (typeof accountingPrStatus)[number],
	): Promise<PrRecord | null> {
		const [record] = await db
			.update(accountingPrs)
			.set({
				status: toStatus,
				updatedAt: new Date(),
			})
			.where(
				and(
					eq(accountingPrs.id, id),
					eq(accountingPrs.companyId, companyId),
					eq(accountingPrs.status, fromStatus),
				),
			)
			.returning();

		return record ?? null;
	}
}

export const accountingPrController = new AccountingPrController();
