/**
 * UploadDocumentCommand — Uploads an XML/PDF document to the inbox.
 *
 * Extracted from inline route handler for CQRS compliance.
 *
 * @module inbox/application/commands
 */

export interface UploadDocumentInput {
	file: File;
	companyId: string;
}

/**
 * Uploads a document to the inbox via InboxService.
 *
 * @param input - The file and company context
 * @returns The upload result from InboxService
 *
 * @example
 * ```ts
 * const result = await uploadDocument({ file: xmlFile, companyId: 'cmp-123' });
 * ```
 */
export async function uploadDocument(
	input: UploadDocumentInput,
): Promise<unknown> {
	const { InboxService } = await import("../../../../services/inbox.service");
	return InboxService.processUpload(input.file, input.companyId);
}
