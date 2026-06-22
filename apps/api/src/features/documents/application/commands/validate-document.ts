/**
 * ValidateDocument — Validates/corrects OCR results for a document.
 *
 * @module documents/application/commands
 */

import type { ResolvedTenantScope } from "../../handlers/tenant-scope";
import type { DocumentStorePort } from "../../ports/document-store.port";

export interface ValidateDocumentInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	id: string;
	actorId: string;
	correctedData?: Record<string, unknown>;
	status: "approved" | "needs_review";
	parseStoredExtractedData: (raw: unknown) => Record<string, unknown>;
}

export interface ValidateDocumentResult {
	id: string;
	status: string;
	updatedFields: string[];
	confidence: number;
}

/**
 * Validates or corrects OCR results for a document.
 *
 * @param input - Validation input with store, tenant scope, actor, and corrections
 * @returns The validation result with updated status
 * @throws Error if document not found
 */
export async function validateDocument(
	input: ValidateDocumentInput,
): Promise<ValidateDocumentResult> {
	const {
		store,
		tenantScope,
		id,
		actorId,
		correctedData,
		status,
		parseStoredExtractedData,
	} = input;

	const doc = await store.getById(id, tenantScope);
	if (!doc) {
		throw new Error("Document not found");
	}

	const existingData = parseStoredExtractedData(doc.extractedData);
	const updatedData = correctedData
		? { ...existingData, ...correctedData }
		: existingData;
	const newStatus =
		status === "approved" ? "listo_para_sire" : "revision_humana";

	await store.update(
		id,
		{
			extracted_data: updatedData,
			status: newStatus,
			validated_by: actorId,
			validated_at: new Date(),
			updated_at: new Date(),
		},
		tenantScope,
	);

	return {
		id,
		status: newStatus,
		updatedFields: correctedData ? Object.keys(correctedData) : [],
		confidence:
			typeof updatedData.confidenceScore === "number"
				? updatedData.confidenceScore
				: 0.9,
	};
}
