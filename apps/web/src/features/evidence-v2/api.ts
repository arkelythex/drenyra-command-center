import { api } from "@/lib/api";
import { unwrap } from "@/lib/api-helpers";

export interface EvidenceDTO {
	id: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	evidenceType: string;
	source: string;
	status: string;
	organizationId: string;
	companyId: string | null;
	validations: unknown;
	metadata: unknown;
	tags: unknown;
	createdAt: string;
	updatedAt: string;
}

export interface EvidenceLinkDTO {
	id: string;
	entityType: string;
	entityId: string;
	relationship: string;
	linkedBy: string;
	linkedAt: string;
}

export interface EvidenceDetailDTO extends EvidenceDTO {
	links: EvidenceLinkDTO[];
}

export interface EvidenceSearchFilters {
	companyId?: string;
	type?: string;
	source?: string;
	status?: string;
	period?: string;
	q?: string;
	limit?: number;
	offset?: number;
}

export interface LineageResult {
	entity: { type: string; id: string };
	evidence: Array<{
		id: string;
		evidenceId: string;
		entityType: string;
		entityId: string;
		relationship: string;
		linkedBy: string;
		linkedAt: string;
		evidence: EvidenceDTO | null;
	}>;
}

export async function searchEvidence(
	filters: EvidenceSearchFilters,
): Promise<{ data: EvidenceDTO[]; total: number }> {
	return unwrap(
		api.api["evidence-v2"].search.get({ query: filters as any }),
	) as Promise<{ data: EvidenceDTO[]; total: number }>;
}

export async function getEvidenceDetail(
	id: string,
): Promise<{ data: EvidenceDetailDTO }> {
	return unwrap(
		api.api["evidence-v2"]({ id }).get(),
	) as Promise<{ data: EvidenceDetailDTO }>;
}

export async function validateEvidence(
	id: string,
): Promise<{ data: { id: string; validated: boolean } }> {
	return unwrap(
		api.api["evidence-v2"]({ id }).validate.post(),
	) as Promise<{ data: { id: string; validated: boolean } }>;
}

export async function batchValidate(
	ids: string[],
): Promise<{ data: { validated: number; failed: number } }> {
	return unwrap(
		api.api["evidence-v2"]["batch-validate"].post({ ids }),
	) as Promise<{ data: { validated: number; failed: number } }>;
}

export async function linkEvidence(body: {
	evidenceId: string;
	entityType: string;
	entityId: string;
	relationship?: string;
}): Promise<{ data: EvidenceLinkDTO }> {
	return unwrap(
		api.api["evidence-v2"].link.post(body),
	) as Promise<{ data: EvidenceLinkDTO }>;
}

export async function unlinkEvidence(
	linkId: string,
): Promise<{ data: { unlinked: boolean } }> {
	return unwrap(
		api.api["evidence-v2"].unlink.post({ linkId }),
	) as Promise<{ data: { unlinked: boolean } }>;
}

export async function getLineage(
	entityType: string,
	entityId: string,
): Promise<{ data: LineageResult }> {
	return unwrap(
		api.api["evidence-v2"].lineage({ entityType, entityId }).get(),
	) as Promise<{ data: LineageResult }>;
}

export const evidenceKeys = {
	all: ["evidence-v2"] as const,
	lists: () => [...evidenceKeys.all, "list"] as const,
	list: (filters?: EvidenceSearchFilters) =>
		[...evidenceKeys.lists(), filters] as const,
	details: () => [...evidenceKeys.all, "detail"] as const,
	detail: (id: string) => [...evidenceKeys.details(), id] as const,
	lineage: (entityType: string, entityId: string) =>
		[...evidenceKeys.all, "lineage", entityType, entityId] as const,
};
