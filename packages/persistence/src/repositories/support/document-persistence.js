import { Document } from "@drenyra/domain/entities/Document";

function serializeExtractedData(extractedData) {
	if (!extractedData) {
		return null;
	}
	return {
		...extractedData,
		issueDate: extractedData.issueDate?.toISOString(),
	};
}
function deserializeExtractedData(value) {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}
	const raw = value;
	return {
		...raw,
		issueDate: raw.issueDate ? new Date(raw.issueDate) : undefined,
	};
}
export function mapDocumentToInsert(document) {
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
export function mapDocumentToUpdate(document) {
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
export function mapDocumentRowToEntity(row) {
	return Document.create({
		id: row.id,
		clientId: row.clientId ?? "",
		clientName: row.clientName,
		fileName: row.fileName,
		fileUrl: row.fileUrl,
		fileType: row.fileType,
		fileSize: row.fileSize,
		status: row.status,
		extractedData: deserializeExtractedData(row.extractedData),
		confidenceLevel: row.confidenceLevel ?? undefined,
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
//# sourceMappingURL=document-persistence.js.map
