/**
 * UploadDocument — Uploads a single document for OCR processing.
 *
 * @module documents/application/commands
 */

import {
	detectFileType,
	generateDocumentId,
	isValidFileType,
	validateFileContent,
} from "../../file-processing.service";
import type { QueueOcrJobFn } from "../../handlers/shared";
import {
	persistIncomingDocument,
	processXmlDocument,
} from "../../handlers/shared";
import type { ResolvedTenantScope } from "../../handlers/tenant-scope";
import type { DocumentStorePort } from "../../ports/document-store.port";
import { markDocumentAsError } from "./_shared";

export interface UploadDocumentInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	actorId: string;
	file: File;
	queueOcrJob: QueueOcrJobFn;
}

export interface UploadDocumentResult {
	id: string;
	status: string;
	storageUrl: string;
	createdAt: string;
}

/**
 * Uploads a single document. Validates the file, persists it,
 * and queues OCR processing for non-XML files.
 *
 * @param input - Upload input with store, tenant scope, actor, and file
 * @returns The created document info
 * @throws Error if file validation fails
 */
export async function uploadDocument(
	input: UploadDocumentInput,
): Promise<UploadDocumentResult> {
	const { store, tenantScope, actorId, file, queueOcrJob } = input;

	if (!file?.name) {
		throw new Error("No file provided");
	}

	if (!isValidFileType(file.name)) {
		throw new Error("Invalid file type. Supported: PDF, XML, JPG, PNG");
	}

	const isValidContent = await validateFileContent(file);
	if (!isValidContent) {
		throw new Error(
			"File content validation failed. File may be corrupted or spoofed.",
		);
	}

	const documentId = generateDocumentId();
	const fileType = detectFileType(file.name);
	const storageUrl = await persistIncomingDocument({
		documentStore: store,
		documentId,
		...(tenantScope.organizationId !== undefined
			? { organizationId: tenantScope.organizationId }
			: {}),
		...(tenantScope.companyId !== undefined
			? { companyId: tenantScope.companyId }
			: {}),
		file,
		fileType,
	});

	if (fileType === "XML") {
		try {
			await processXmlDocument(store, documentId, file);
			return {
				id: documentId,
				status: "processed",
				storageUrl,
				createdAt: new Date().toISOString(),
			};
		} catch (_xmlError: unknown) {
			const message = "Invalid XML payload";
			await markDocumentAsError(store, documentId, message);
			throw new Error(message);
		}
	}

	await queueOcrJob({
		documentId,
		storageUrl,
		...(tenantScope.organizationId !== undefined
			? { organizationId: tenantScope.organizationId }
			: {}),
		...(tenantScope.companyId !== undefined
			? { companyId: tenantScope.companyId }
			: {}),
		actorId,
	});

	return {
		id: documentId,
		status: "queued_for_ocr",
		storageUrl,
		createdAt: new Date().toISOString(),
	};
}
