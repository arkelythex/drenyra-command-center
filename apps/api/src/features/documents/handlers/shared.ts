import { parseXMLInvoice, uploadToStorage } from "../file-processing.service";
import type { DocumentStorePort } from "../ports/document-store.port";
import type { HandlerSet } from "./types";

/**
 * DocumentsErrorCode type.
 *
 * @example
 * ```ts
 * const value: DocumentsErrorCode = {} as DocumentsErrorCode;
 * console.log(value);
 * ```
 */
export type DocumentsErrorCode =
	| "DOCUMENTS_BAD_REQUEST"
	| "DOCUMENTS_INVALID_FILE"
	| "DOCUMENTS_NOT_FOUND"
	| "DOCUMENTS_XML_PARSE_ERROR"
	| "DOCUMENTS_INTERNAL_ERROR"
	| "AUTH_CONTEXT_CONFLICT"
	| "AUTH_CONTEXT_MISMATCH"
	| "AUTH_REQUIRED"
	| "FORBIDDEN_ROLE"
	| "SESSION_REQUIRED"
	| "TENANT_REQUIRED"
	| "TENANT_SCOPE_VIOLATION";

/**
 * QueueOcrJobInput interface.
 *
 * @example
 * ```ts
 * const value: QueueOcrJobInput = {} as QueueOcrJobInput;
 * console.log(value);
 * ```
 */
export interface QueueOcrJobInput {
	documentId: string;
	storageUrl: string;
	organizationId?: number;
	companyId?: string;
	actorId: string;
}

/**
 * QueueOcrJobFn type.
 *
 * @example
 * ```ts
 * const value: QueueOcrJobFn = {} as QueueOcrJobFn;
 * console.log(value);
 * ```
 */
export type QueueOcrJobFn = (input: QueueOcrJobInput) => Promise<void>;

/**
 * toErrorMessage operation.
 *
 * @param error - Input for error.
 * @param fallback - Input for fallback.
 * @returns Result of toErrorMessage.
 * @example
 * ```ts
 * const result = toErrorMessage(undefined, "");
 * console.log(result);
 * ```
 */
export function toErrorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}

/**
 * fail operation.
 *
 * @param set - Input for set.
 * @param status - Input for status.
 * @param error - Input for error.
 * @param code - Input for code.
 * @returns Result of fail.
 * @example
 * ```ts
 * const result = fail({} as HandlerSet, 0, "", {} as DocumentsErrorCode);
 * console.log(result);
 * ```
 */
export function fail(
	set: HandlerSet,
	status: number,
	error: string,
	code: DocumentsErrorCode,
) {
	set.status = status;
	return { success: false, error, code };
}

/**
 * createDocumentRecord operation.
 *
 * @param input - Input for input.
 * @returns Result of createDocumentRecord.
 * @example
 * ```ts
 * const result = await createDocumentRecord({});
 * console.log(result);
 * ```
 */
export async function createDocumentRecord(input: {
	documentStore: DocumentStorePort;
	documentId: string;
	organizationId?: number;
	companyId?: string;
	file: File;
	storageUrl: string;
	status: string;
}): Promise<void> {
	await input.documentStore.save({
		id: input.documentId,
		organization_id: input.organizationId ?? null,
		company_id: input.companyId ?? null,
		client_name: "Unknown",
		file_name: input.file.name,
		file_url: input.storageUrl,
		file_type: input.file.name.split(".").pop()?.toLowerCase() ?? "bin",
		file_size: input.file.size,
		status: input.status,
		created_at: new Date(),
		updated_at: new Date(),
	});
}

/**
 * processXmlDocument operation.
 *
 * @param documentStore - Input for documentStore.
 * @param documentId - Input for documentId.
 * @param file - Input for file.
 * @returns Result of processXmlDocument.
 * @example
 * ```ts
 * const result = await processXmlDocument({} as DocumentStorePort, "", {} as File);
 * console.log(result);
 * ```
 */
export async function processXmlDocument(
	documentStore: DocumentStorePort,
	documentId: string,
	file: File,
): Promise<void> {
	const extractedData = await parseXMLInvoice(await file.text());
	await documentStore.update(documentId, {
		extracted_data: extractedData,
		status: "revision_humana",
		processed_at: new Date(),
	});
}

/**
 * queueOcrJob operation.
 *
 * @param input - Input for input.
 * @returns Result of queueOcrJob.
 * @example
 * ```ts
 * const result = await queueOcrJob({} as QueueOcrJobInput);
 * console.log(result);
 * ```
 */
export async function queueOcrJob(input: QueueOcrJobInput): Promise<void> {
	const { inngest } = await import("../../../lib/inngest.client");
	await inngest.send({
		name: "ocr/document.process",
		data: {
			documentId: input.documentId,
			fileUrl: input.storageUrl,
			...(input.organizationId !== undefined
				? { organizationId: input.organizationId }
				: {}),
			...(input.companyId ? { companyId: input.companyId } : {}),
			userId: input.actorId,
			mode: "standard",
		},
	});
}

/**
 * persistIncomingDocument operation.
 *
 * @param input - Input for input.
 * @returns Result of persistIncomingDocument.
 * @example
 * ```ts
 * const result = await persistIncomingDocument({});
 * console.log(result);
 * ```
 */
export async function persistIncomingDocument(input: {
	documentStore: DocumentStorePort;
	documentId: string;
	organizationId?: number;
	companyId?: string;
	file: File;
	fileType: "IMAGE" | "XML" | "PDF";
}): Promise<string> {
	const storageUrl = await uploadToStorage(input.file, {
		organizationId: input.organizationId,
		companyId: input.companyId,
	});
	await createDocumentRecord({
		documentStore: input.documentStore,
		documentId: input.documentId,
		organizationId: input.organizationId,
		companyId: input.companyId,
		file: input.file,
		storageUrl,
		status: input.fileType === "XML" ? "procesando" : "por_procesar",
	});
	return storageUrl;
}
