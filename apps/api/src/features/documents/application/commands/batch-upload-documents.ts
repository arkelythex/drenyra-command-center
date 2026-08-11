/**
 * BatchUploadDocuments — Uploads multiple documents with Smart Ingest.
 *
 * XML files are processed immediately; PDF/images are queued for OCR.
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

export interface BatchUploadDocumentsInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	actorId: string;
	files: File[];
	queueOcrJob: QueueOcrJobFn;
}

export interface BatchUploadDocumentsResult {
	total: number;
	processed: { xml: number; pdf: number };
	documents: Array<Record<string, unknown>>;
}

/**
 * Uploads multiple documents with Smart Ingest.
 *
 * @param input - Batch upload input with store, tenant scope, actor, and files
 * @returns Summary of all uploaded documents
 */
export async function batchUploadDocuments(
	input: BatchUploadDocumentsInput,
): Promise<BatchUploadDocumentsResult> {
	const { store, tenantScope, actorId, files, queueOcrJob } = input;

	if (!files || files.length === 0) {
		throw new Error("No files provided");
	}

	const results: Array<Record<string, unknown>> = [];
	let xmlCount = 0;
	let nonXmlCount = 0;

	for (const file of files) {
		const documentId = generateDocumentId();
		const fileType = detectFileType(file.name);

		if (!isValidFileType(file.name)) {
			results.push({
				id: documentId,
				filename: file.name,
				type: fileType.toLowerCase(),
				status: "error",
				error: "Invalid file type",
			});
			continue;
		}

		const isValidContent = await validateFileContent(file);
		if (!isValidContent) {
			results.push({
				id: documentId,
				filename: file.name,
				type: fileType.toLowerCase(),
				status: "error",
				error: "File content validation failed",
			});
			continue;
		}

		try {
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
				xmlCount++;
				await processXmlDocument(store, documentId, file);
				results.push({
					id: documentId,
					filename: file.name,
					type: "xml",
					status: "processed",
				});
				continue;
			}

			nonXmlCount++;
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
			results.push({
				id: documentId,
				filename: file.name,
				type: fileType.toLowerCase(),
				status: "queued_for_ocr",
			});
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "Batch upload failed";
			const errorStateFailure = await markDocumentAsError(
				store,
				documentId,
				message,
			);
			results.push({
				id: documentId,
				filename: file.name,
				type: fileType.toLowerCase(),
				status: "error",
				error: errorStateFailure ? `${message}; ${errorStateFailure}` : message,
			});
		}
	}

	return {
		total: files.length,
		processed: { xml: xmlCount, pdf: nonXmlCount },
		documents: results,
	};
}
