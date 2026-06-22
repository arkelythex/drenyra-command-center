import {
	Document,
	type ExtractedData,
	type DocumentStatus,
	type DocumentType,
	type ConfidenceLevel,
} from "@arkelythex/domain/entities/Document";
import { documents } from "../../schema/documents.schema";

type PersistedExtractedData = Omit<ExtractedData, "issueDate"> & {
	issueDate?: string | Date | null;
};

function serializeExtractedData(
	extractedData?: ExtractedData,
): typeof documents.$inferInsert.extractedData {
	if (!extractedData) {
		return null;
	}

	return {
		...extractedData,
		issueDate: extractedData.issueDate?.toISOString(),
	};
}

function deserializeExtractedData(
	value: typeof documents.$inferSelect.extractedData,
): ExtractedData | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}

	const raw = value as PersistedExtractedData;

	return {
		...raw,
		issueDate: raw.issueDate ? new Date(raw.issueDate) : undefined,
	};
}

/**
 * mapDocumentToInsert operation.
 *
 * @param document - Input for document.
 * @returns Result of mapDocumentToInsert.
 * @example
 * ```ts
 * const result = mapDocumentToInsert({} as Document);
 * console.log(result);
 * ```
 */
export function mapDocumentToInsert(
	document: Document,
): typeof documents.$inferInsert {
	return {
		id: document.id,
		clientId: document.clientId,
		clientName: document.clientName,
		fileName: document.fileName,
		fileUrl: document.fileUrl,
		fileType: document.fileType,
		fileSize: document.fileSize,
		status: document.status,
		extractedData: serializeExtractedData(document.extractedData),
		confidenceLevel: document.confidenceLevel,
		validatedBy: document.validatedBy,
		validatedAt: document.validatedAt,
		validationNotes: document.validationNotes,
		accountingEntryId: document.accountingEntryId,
		uploadedAt: document.uploadedAt,
		processedAt: document.processedAt,
		createdAt: document.createdAt,
		updatedAt: document.updatedAt,
	};
}

/**
 * mapDocumentToUpdate operation.
 *
 * @param document - Input for document.
 * @returns Result of mapDocumentToUpdate.
 * @example
 * ```ts
 * const result = mapDocumentToUpdate({} as Document);
 * console.log(result);
 * ```
 */
export function mapDocumentToUpdate(
	document: Document,
): Partial<typeof documents.$inferInsert> {
	return {
		clientId: document.clientId,
		clientName: document.clientName,
		fileName: document.fileName,
		fileUrl: document.fileUrl,
		fileType: document.fileType,
		fileSize: document.fileSize,
		status: document.status,
		extractedData: serializeExtractedData(document.extractedData),
		confidenceLevel: document.confidenceLevel,
		validatedBy: document.validatedBy,
		validatedAt: document.validatedAt,
		validationNotes: document.validationNotes,
		accountingEntryId: document.accountingEntryId,
		uploadedAt: document.uploadedAt,
		processedAt: document.processedAt,
		updatedAt: document.updatedAt,
	};
}

/**
 * mapDocumentRowToEntity operation.
 *
 * @param row - Input for row.
 * @returns Result of mapDocumentRowToEntity.
 * @example
 * ```ts
 * const result = mapDocumentRowToEntity(undefined);
 * console.log(result);
 * ```
 */
export function mapDocumentRowToEntity(
	row: typeof documents.$inferSelect,
): Document {
	return Document.create({
		id: row.id,
		clientId: row.clientId ?? "",
		clientName: row.clientName,
		fileName: row.fileName,
		fileUrl: row.fileUrl,
		fileType: row.fileType as DocumentType,
		fileSize: row.fileSize,
		status: row.status as DocumentStatus,
		extractedData: deserializeExtractedData(row.extractedData),
		confidenceLevel: (row.confidenceLevel as ConfidenceLevel) ?? undefined,
		validatedBy: row.validatedBy ?? undefined,
		validatedAt: row.validatedAt ? new Date(row.validatedAt) : undefined,
		validationNotes: row.validationNotes ?? undefined,
		accountingEntryId: row.accountingEntryId ?? undefined,
		uploadedAt: new Date(row.uploadedAt),
		processedAt: row.processedAt ? new Date(row.processedAt) : undefined,
		createdAt: new Date(row.createdAt),
		updatedAt: new Date(row.updatedAt),
	});
}
