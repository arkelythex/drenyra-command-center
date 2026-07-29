import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const EVIDENCE_TYPES = {
	INVOICE: "INVOICE",
	RECEIPT: "RECEIPT",
	CONTRACT: "CONTRACT",
	BANK_STATEMENT: "BANK_STATEMENT",
	EMAIL: "EMAIL",
	XML: "XML",
	CDR: "CDR",
	PDF: "PDF",
	OTHER: "OTHER",
} as const;

const EVIDENCE_SOURCES = {
	UPLOAD: "UPLOAD",
	EMAIL: "EMAIL",
	API: "API",
	SYNC: "SYNC",
	SUNAT: "SUNAT",
} as const;

const EVIDENCE_STATUSES = {
	UPLOADED: "UPLOADED",
	EXTRACTING: "EXTRACTING",
	CLASSIFIED: "CLASSIFIED",
	VALIDATED: "VALIDATED",
	REJECTED: "REJECTED",
	ERROR: "ERROR",
} as const;

const EVIDENCE_RELATIONSHIPS = {
	SOURCE: "source",
	SUPPORTING: "supporting",
	OUTPUT: "output",
	AUDIT_TRAIL: "audit_trail",
} as const;

export type EvidenceType = (typeof EVIDENCE_TYPES)[keyof typeof EVIDENCE_TYPES];
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[keyof typeof EVIDENCE_SOURCES];
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[keyof typeof EVIDENCE_STATUSES];
export type EvidenceRelationship =
	(typeof EVIDENCE_RELATIONSHIPS)[keyof typeof EVIDENCE_RELATIONSHIPS];

export interface EvidenceFilters {
	companyId?: string;
	type?: EvidenceType;
	source?: EvidenceSource;
	status?: EvidenceStatus;
	period?: string;
	q?: string;
	limit?: number;
	offset?: number;
}

export interface EvidenceItem {
	id: string;
	filename: string;
	mimeType: string;
	sizeBytes: number;
	hash: string;
	evidenceType: EvidenceType;
	source: EvidenceSource;
	status: EvidenceStatus;
	organizationId: string;
	companyId: string | null;
	validations: unknown[] | null;
	metadata: Record<string, unknown> | null;
	tags: string[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface EvidenceLink {
	id: string;
	entityType: string;
	entityId: string;
	relationship: EvidenceRelationship;
	linkedBy: string;
	linkedAt: string;
}

export interface EvidenceDetail extends EvidenceItem {
	links: EvidenceLink[];
}

export interface EvidenceSearchResult {
	data: EvidenceItem[];
	total: number;
}

export interface LinkEvidenceInput {
	evidenceId: string;
	entityType: string;
	entityId: string;
	relationship?: EvidenceRelationship;
}

interface ApiEnvelope<T> {
	success: boolean;
	data?: T;
	error?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		credentials: "include",
		...init,
		headers: {
			"Content-Type": "application/json",
			...init?.headers,
		},
	});
	const envelope = (await response.json()) as ApiEnvelope<T>;
	if (!response.ok || !envelope.success || envelope.data === undefined) {
		throw new Error(envelope.error ?? "No se pudo completar la solicitud de evidencia.");
	}
	return envelope.data;
}

function searchParams(filters: EvidenceFilters): string {
	const params = new URLSearchParams();
	for (const [key, value] of Object.entries(filters)) {
		if (value !== undefined && value !== "") params.set(key, String(value));
	}
	return params.toString();
}

export const evidenceKeys = {
	all: ["evidence-v2"] as const,
	list: (filters: EvidenceFilters) => ["evidence-v2", "list", filters] as const,
	detail: (id: string) => ["evidence-v2", "detail", id] as const,
	lineage: (entityType: string, entityId: string) =>
		["evidence-v2", "lineage", entityType, entityId] as const,
};

export function useEvidenceList(filters: EvidenceFilters) {
	return useQuery({
		queryKey: evidenceKeys.list(filters),
		queryFn: () => request<EvidenceSearchResult>(`/api/v2/evidence/search?${searchParams(filters)}`),
	});
}

export function useEvidenceDetail(id: string) {
	return useQuery({
		queryKey: evidenceKeys.detail(id),
		queryFn: () => request<{ data: EvidenceDetail }>(`/api/v2/evidence/${id}`).then((result) => result.data),
		enabled: Boolean(id),
	});
}

export function useValidateEvidence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => request(`/api/v2/evidence/${id}/validate`, { method: "POST" }),
		onSuccess: (_, id) => queryClient.invalidateQueries({ queryKey: evidenceKeys.detail(id) }),
	});
}

export function useBatchValidate() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (ids: string[]) => request("/api/v2/evidence/batch-validate", { method: "POST", body: JSON.stringify({ ids }) }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: evidenceKeys.all }),
	});
}

export function useLinkEvidence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: LinkEvidenceInput) => request("/api/v2/evidence/link", { method: "POST", body: JSON.stringify(input) }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: evidenceKeys.all }),
	});
}

export function useUnlinkEvidence() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (linkId: string) => request("/api/v2/evidence/unlink", { method: "POST", body: JSON.stringify({ linkId }) }),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: evidenceKeys.all }),
	});
}

export function useEvidenceLineage(entityType: string, entityId: string) {
	return useQuery({
		queryKey: evidenceKeys.lineage(entityType, entityId),
		queryFn: () => request(`/api/v2/evidence/lineage/${entityType}/${entityId}`),
		enabled: Boolean(entityType && entityId),
	});
}
