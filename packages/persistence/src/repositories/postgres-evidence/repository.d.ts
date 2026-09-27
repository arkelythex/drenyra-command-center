import { Evidence } from "@drenyra/domain/entities/evidence";
import type { EvidenceFilters, EvidenceRepository } from "@drenyra/domain/repositories/evidence.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresEvidenceRepository implements EvidenceRepository {
    save(domain: Evidence): Promise<void>;
    saveForOrganization(domain: Evidence, organizationId: number): Promise<void>;
    update(domain: Evidence): Promise<void>;
    updateForOrganization(domain: Evidence, organizationId: number): Promise<void>;
    delete(id: string): Promise<void>;
    deleteForOrganization(id: string, organizationId: number): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Evidence | null>;
    findForOrganization(id: string, organizationId: number): Promise<Evidence | null>;
    findAll(filters?: EvidenceFilters): Promise<Evidence[]>;
    findByHash(hash: string): Promise<Evidence | null>;
    findPendingClassification(limit?: number): Promise<Evidence[]>;
    count(filters?: EvidenceFilters): Promise<number>;
}
//# sourceMappingURL=repository.d.ts.map