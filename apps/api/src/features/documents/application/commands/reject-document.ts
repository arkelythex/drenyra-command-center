/**
 * RejectDocument — Rejects a document with a reason.
 *
 * @module documents/application/commands
 */

import type { ResolvedTenantScope } from "../../handlers/tenant-scope";
import type { DocumentStorePort } from "../../ports/document-store.port";

export interface RejectDocumentInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	id: string;
	actorId: string;
	reason: string;
}

export interface RejectDocumentResult {
	id: string;
	status: string;
	rejectedAt: string;
	rejectedBy: string;
}

/**
 * Rejects a document with the given reason.
 *
 * @param input - Rejection input with store, tenant scope, actor, ID, and reason
 * @returns The rejection result
 * @throws Error if document not found
 */
export async function rejectDocument(
	input: RejectDocumentInput,
): Promise<RejectDocumentResult> {
	const { store, tenantScope, id, actorId, reason } = input;

	const doc = await store.getById(id, tenantScope);
	if (!doc) {
		throw new Error("Document not found");
	}

	await store.update(
		id,
		{
			status: "rechazado_por_sire",
			rejection_reason: reason,
			rejected_by: actorId,
			rejected_at: new Date(),
			updated_at: new Date(),
		},
		tenantScope,
	);

	return {
		id,
		status: "rechazado_por_sire",
		rejectedAt: new Date().toISOString(),
		rejectedBy: actorId,
	};
}
