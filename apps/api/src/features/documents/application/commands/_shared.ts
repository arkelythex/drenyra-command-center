/**
 * Shared utilities for documents application commands.
 *
 * @module documents/application/commands
 */

import { toErrorMessage } from "../../handlers/shared";
import type { DocumentStorePort } from "../../ports/document-store.port";

/**
 * Marks a document as errored.
 *
 * @param store - Document store
 * @param documentId - The document ID
 * @param error - Error description
 * @returns Error message if the update failed, null on success
 */
export async function markDocumentAsError(
	store: DocumentStorePort,
	documentId: string,
	error: string,
): Promise<string | null> {
	try {
		await store.update(documentId, {
			status: "error",
			rejection_reason: error,
		});
		return null;
	} catch (updateError: unknown) {
		return toErrorMessage(
			updateError,
			"Failed to persist document error state",
		);
	}
}
