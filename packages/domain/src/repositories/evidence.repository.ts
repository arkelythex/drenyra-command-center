import type { Evidence } from "../entities/evidence";
import type { EvidenceFilters } from "../entities/evidence/types";

export type { EvidenceFilters };

export interface EvidenceRepository {
	save(evidence: Evidence): Promise<void>;

	saveForOrganization(
		evidence: Evidence,
		organizationId: number,
	): Promise<void>;

	update(evidence: Evidence): Promise<void>;

	updateForOrganization(
		evidence: Evidence,
		organizationId: number,
	): Promise<void>;

	delete(id: string): Promise<void>;

	deleteForOrganization(id: string, organizationId: number): Promise<void>;

	findById(
		scope: import("../scope").TenantScope,
		id: string,
	): Promise<Evidence | null>;

	findForOrganization(
		id: string,
		organizationId: number,
	): Promise<Evidence | null>;

	findAll(filters?: EvidenceFilters): Promise<Evidence[]>;

	findByHash(hash: string): Promise<Evidence | null>;

	findPendingClassification(limit?: number): Promise<Evidence[]>;

	count(filters?: EvidenceFilters): Promise<number>;
}
