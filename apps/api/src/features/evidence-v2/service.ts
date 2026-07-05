import { and, desc, eq, inArray, like, or, sql } from "@drenyra/persistence/query";
import { evidence, evidenceLinks } from "@drenyra/persistence/schema";
import { db } from "../../lib/db";

// ─── Evidence Search ───

export interface SearchFilters {
	companyId?: string;
	type?: string;
	source?: string;
	status?: string;
	period?: string;
	q?: string;
	limit?: number;
	offset?: number;
}

export async function searchEvidence(filters: SearchFilters) {
	const conditions: ReturnType<typeof eq>[] = [];

	if (filters.companyId) {
		conditions.push(eq(evidence.companyId, filters.companyId));
	}
	if (filters.type) {
		conditions.push(eq(evidence.evidenceType, filters.type as any));
	}
	if (filters.source) {
		conditions.push(eq(evidence.source, filters.source as any));
	}
	if (filters.status) {
		conditions.push(eq(evidence.status, filters.status as any));
	}
	if (filters.q) {
		conditions.push(
			or(
				like(evidence.filename, `%${filters.q}%`),
				sql`${evidence.metadata}::text ILIKE ${`%${filters.q}%`}`,
			) as any,
		);
	}

	const where = conditions.length > 0 ? and(...conditions) : undefined;

	const [rows, countResult] = await Promise.all([
		db
			.select()
			.from(evidence)
			.where(where)
			.orderBy(desc(evidence.createdAt))
			.limit(filters.limit ?? 50)
			.offset(filters.offset ?? 0),
		db
			.select({ count: sql<number>`count(*)` })
			.from(evidence)
			.where(where),
	]);

	return {
		data: rows.map(toDTO),
		total: Number(countResult[0]?.count ?? 0),
	};
}

export async function getEvidenceDetail(id: string) {
	const [row] = await db
		.select()
		.from(evidence)
		.where(eq(evidence.id, id))
		.limit(1);

	if (!row) return null;

	const links = await db
		.select()
		.from(evidenceLinks)
		.where(eq(evidenceLinks.evidenceId, id));

	return {
		...toDTO(row),
		links: links.map((l) => ({
			id: l.id,
			entityType: l.entityType,
			entityId: l.entityId,
			relationship: l.relationship,
			linkedBy: l.linkedBy,
			linkedAt: l.linkedAt.toISOString(),
		})),
	};
}

// ─── Evidence Links ───

export async function createLink(data: {
	evidenceId: string;
	entityType: string;
	entityId: string;
	relationship: string;
	linkedBy: string;
}) {
	const [link] = await db
		.insert(evidenceLinks)
		.values({
			evidenceId: data.evidenceId,
			entityType: data.entityType,
			entityId: data.entityId,
			relationship: data.relationship,
			linkedBy: data.linkedBy,
		})
		.onConflictDoNothing()
		.returning();
	return link ?? null;
}

export async function deleteLink(linkId: string) {
	const [deleted] = await db
		.delete(evidenceLinks)
		.where(eq(evidenceLinks.id, linkId))
		.returning();
	return deleted ?? null;
}

// ─── Lineage ───

export async function getLineage(entityType: string, entityId: string) {
	const links = await db
		.select()
		.from(evidenceLinks)
		.where(
			and(
				eq(evidenceLinks.entityType, entityType),
				eq(evidenceLinks.entityId, entityId),
			),
		);

	if (links.length === 0) {
		return { entity: { type: entityType, id: entityId }, evidence: [] };
	}

	const evidenceIds = links.map((l) => l.evidenceId);
	const rows = await db
		.select()
		.from(evidence)
		.where(inArray(evidence.id, evidenceIds));

	const evidenceMap = new Map(rows.map((r) => [r.id, toDTO(r)]));

	const result = links.map((link) => ({
		...link,
		evidence: evidenceMap.get(link.evidenceId) ?? null,
	}));

	return {
		entity: { type: entityType, id: entityId },
		evidence: result,
	};
}

// ─── Validate ───

export async function validateSingle(id: string) {
	const [row] = await db
		.select()
		.from(evidence)
		.where(eq(evidence.id, id))
		.limit(1);

	if (!row) return { id, status: "NOT_FOUND" };

	// Simulated validation — in production, actual SUNAT validation
	const validationResult = {
		timestamp: new Date().toISOString(),
		hashValid: true,
		fileExists: true,
		status: "VALIDATED",
	};

	const existingValidations = (row.validations as Array<unknown>) ?? [];
	const updatedValidations = [...existingValidations, validationResult];

	await db
		.update(evidence)
		.set({
			status: "VALIDATED",
			validatedAt: new Date(),
			validations: updatedValidations as any,
		})
		.where(eq(evidence.id, id));

	return { id, validated: true, result: validationResult };
}

export async function batchValidate(ids: string[]) {
	const results = await Promise.allSettled(ids.map((id) => validateSingle(id)));

	const succeeded = results.filter(
		(r) => r.status === "fulfilled" && r.value.validated,
	).length;
	const failed = results.filter(
		(r) => r.status === "rejected" || (r.status === "fulfilled" && !r.value.validated),
	).length;

	const outcomes = results.map((r) =>
		r.status === "fulfilled" ? r.value : { id: "unknown", validated: false, error: r.reason },
	);

	return { validated: succeeded, failed, results: outcomes };
}

// ─── DTO ───

function toDTO(row: typeof evidence.$inferSelect) {
	return {
		id: row.id,
		filename: row.filename,
		mimeType: row.mimeType,
		sizeBytes: row.sizeBytes,
		hash: row.hash,
		evidenceType: row.evidenceType,
		source: row.source,
		status: row.status,
		organizationId: row.organizationId,
		companyId: row.companyId,
		validations: row.validations,
		metadata: row.metadata,
		tags: row.tags,
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt.toISOString(),
	};
}
