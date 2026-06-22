/**
 * UpdateDocumentStatus — Updates a document's status (approve/reject batch).
 *
 * @module documents/application/commands
 */

import type { ResolvedTenantScope } from "../../handlers/tenant-scope";
import type { DocumentStorePort } from "../../ports/document-store.port";

export interface UpdateDocumentStatusInput {
	store: DocumentStorePort;
	tenantScope: ResolvedTenantScope;
	id: string;
	actorId: string;
	status: "listo_para_sire" | "rechazado_por_sire";
	reason?: string;
}

export type UpdateDocumentStatusResult = {
	success: true;
	data: ReturnType<DocumentStorePort["toResponseDTO"]>;
};

/**
 * Updates a document's status. If rejecting, a reason is required.
 *
 * @param input - Status update input with store, tenant scope, actor, and new status
 * @returns The updated document as response DTO
 * @throws Error if document not found or missing required fields
 */
export async function updateDocumentStatus(
	input: UpdateDocumentStatusInput,
): Promise<UpdateDocumentStatusResult> {
	const { store, tenantScope, id, actorId, status, reason } = input;

	const doc = await store.getById(id, tenantScope);
	if (!doc) {
		throw new Error("Document not found");
	}

	if (status === "rechazado_por_sire" && !reason) {
		throw new Error("Reason is required when rejecting");
	}

	const updates: Record<string, unknown> = {
		status,
		updated_at: new Date(),
	};

	if (status === "rechazado_por_sire") {
		updates.rejection_reason = reason;
		updates.rejected_by = actorId;
		updates.rejected_at = new Date();
	}

	if (status === "listo_para_sire") {
		updates.validated_by = actorId;
		updates.validated_at = new Date();
	}

	await store.update(id, updates, tenantScope);
	const updatedDoc = await store.getById(id, tenantScope);
	if (!updatedDoc) {
		throw new Error("Document not found after update");
	}

	return {
		success: true,
		data: store.toResponseDTO(updatedDoc),
	};
}
