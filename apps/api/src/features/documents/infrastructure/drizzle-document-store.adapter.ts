import { documents } from "@drenyra/persistence/schema";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../lib/db";
import type { TenantScopeInput } from "../handlers/tenant-scope";
import type {
	DocumentFilters,
	DocumentResponseDTO,
	DocumentRow,
	DocumentStorePort,
	SaveDocumentInput,
} from "../ports/document-store.port";

function escapeLikePattern(value: string): string {
	return value.replace(/[\\%_]/g, "\\$&");
}

function normalizeSearchInput(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const normalized = value.trim();
	if (!normalized) return null;
	return normalized.slice(0, 120);
}

/**
 * DrizzleDocumentStoreAdapter class.
 *
 * @example
 * ```ts
 * const value = new DrizzleDocumentStoreAdapter();
 * console.log(value);
 * ```
 */
export class DrizzleDocumentStoreAdapter implements DocumentStorePort {
	private buildTenantScopeConditions(scope?: TenantScopeInput) {
		const conditions = [];

		if (scope?.companyId) {
			conditions.push(eq(documents.companyId, scope.companyId));
		} else if (scope?.organizationId !== undefined) {
			conditions.push(eq(documents.organizationId, scope.organizationId));
		}

		return conditions;
	}

	async save(doc: SaveDocumentInput): Promise<void> {
		await db.insert(documents).values({
			id: doc.id,
			organizationId: doc.organization_id ?? null,
			companyId: doc.company_id ?? null,
			clientId: doc.client_id || null,
			clientName: doc.client_name || "Unknown",
			fileName: doc.file_name,
			fileUrl: doc.file_url,
			fileType: doc.file_type.toUpperCase(),
			fileSize: doc.file_size || 0,
			status: doc.status || "UPLOADED",
			uploadedAt: doc.created_at || new Date(),
			createdAt: doc.created_at || new Date(),
			updatedAt: doc.updated_at || new Date(),
		});
	}

	async update(
		id: string,
		updates: Record<string, unknown>,
		scope?: TenantScopeInput,
	): Promise<void> {
		const updateData: Record<string, unknown> = {};
		const fieldMap: Record<string, string> = {
			extracted_data: "extractedData",
			validated_by: "validatedBy",
			validated_at: "validatedAt",
			rejection_reason: "validationNotes",
			rejected_by: "validatedBy",
			rejected_at: "validatedAt",
			processed_at: "processedAt",
			updated_at: "updatedAt",
		};

		for (const [key, value] of Object.entries(updates)) {
			const mappedKey = fieldMap[key] || key;
			updateData[mappedKey] = value;
		}

		updateData.updatedAt = updates.updated_at || new Date();

		await db
			.update(documents)
			.set(updateData)
			.where(
				and(eq(documents.id, id), ...this.buildTenantScopeConditions(scope)),
			);
	}

	async getById(
		id: string,
		scope?: TenantScopeInput,
	): Promise<DocumentRow | undefined> {
		return await db.query.documents.findFirst({
			where:
				this.buildTenantScopeConditions(scope).length > 0
					? and(eq(documents.id, id), ...this.buildTenantScopeConditions(scope))
					: eq(documents.id, id),
		});
	}

	async list(filters: DocumentFilters): Promise<DocumentRow[]> {
		const conditions = [];

		if (filters.companyId) {
			conditions.push(eq(documents.companyId, filters.companyId));
		} else if (filters.organizationId) {
			conditions.push(eq(documents.organizationId, filters.organizationId));
		}

		if (filters.status) {
			conditions.push(eq(documents.status, filters.status));
		}

		const safeSearch = normalizeSearchInput(filters.search);
		if (safeSearch) {
			const pattern = `%${escapeLikePattern(safeSearch)}%`;
			conditions.push(
				sql`(${documents.fileName} ILIKE ${pattern} ESCAPE '\\' OR ${documents.clientName} ILIKE ${pattern} ESCAPE '\\')`,
			);
		}

		return await db.query.documents.findMany({
			where: conditions.length > 0 ? and(...conditions) : undefined,
			limit: filters.limit || 100,
			offset: filters.offset || 0,
			orderBy: (table, { desc }) => [desc(table.createdAt)],
		});
	}

	toResponseDTO(dbDoc: DocumentRow): DocumentResponseDTO {
		const isRejected = dbDoc.status === "rechazado_por_sire";

		return {
			id: dbDoc.id,
			companyId: dbDoc.companyId ?? null,
			clientId: dbDoc.organizationId?.toString() || dbDoc.clientId || "",
			clientName: dbDoc.clientName || "Unknown",
			fileName: dbDoc.fileName,
			fileUrl: dbDoc.fileUrl,
			fileType: dbDoc.fileType,
			fileSize: dbDoc.fileSize || 0,
			status: dbDoc.status,
			confidenceLevel: dbDoc.confidenceLevel,
			extractedData: dbDoc.extractedData,
			validatedBy: dbDoc.validatedBy,
			...(dbDoc.validatedAt !== null && dbDoc.validatedAt !== undefined
				? { validatedAt: dbDoc.validatedAt.toISOString() }
				: {}),
			validationNotes: dbDoc.validationNotes,
			rejectionReason: isRejected ? dbDoc.validationNotes : null,
			rejectedBy: isRejected ? dbDoc.validatedBy : null,
			...(isRejected && dbDoc.validatedAt !== null && dbDoc.validatedAt !== undefined
				? { rejectedAt: dbDoc.validatedAt.toISOString() }
				: {}),
			uploadedAt:
				dbDoc.uploadedAt?.toISOString() || dbDoc.createdAt?.toISOString(),
			...(dbDoc.processedAt !== null && dbDoc.processedAt !== undefined
				? { processedAt: dbDoc.processedAt.toISOString() }
				: {}),
		};
	}
}

/**
 * drizzleDocumentStore const.
 *
 * @example
 * ```ts
 * console.log(drizzleDocumentStore);
 * ```
 */
export const drizzleDocumentStore = new DrizzleDocumentStoreAdapter();
