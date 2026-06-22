/**
 * DocumentProcessingJobPayload interface.
 *
 * @example
 * ```ts
 * const value: DocumentProcessingJobPayload = {} as DocumentProcessingJobPayload;
 * console.log(value);
 * ```
 */
export interface DocumentProcessingJobPayload {
	companyId: string;
	documentId: string;
	fileUrl: string;
	fileType: "PDF" | "IMAGE" | "XML";
	fileName: string;
	clientId: string;
	userId: string;
}

/**
 * Dispatches background processing for an uploaded document.
 *
 * Current default: return `null` so callers can fall back to synchronous
 * processing when no queue is configured.
 * @param _payload - Input for _payload.
 * @returns Result of dispatchDocumentProcessing.
 * @example
 * ```ts
 * const result = await dispatchDocumentProcessing({} as DocumentProcessingJobPayload);
 * console.log(result);
 * ```
 */

export async function dispatchDocumentProcessing(
	_payload: DocumentProcessingJobPayload,
): Promise<string | null> {
	return null;
}
