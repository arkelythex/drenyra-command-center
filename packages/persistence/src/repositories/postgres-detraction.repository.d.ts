import { Detraccion, type DetraccionStatus } from "@drenyra/domain/accounting/detraccion";
import type { DetractionRepository } from "@drenyra/domain/repositories/detraction.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresDetractionRepository implements DetractionRepository {
    save(detraction: Detraccion, companyId: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Detraccion | null>;
    findByReference(referenceType: string, referenceId: string): Promise<Detraccion[]>;
    findByCompanyAndPeriod(companyId: string, year: number, month: number): Promise<Detraccion[]>;
    findByStatus(companyId: string, status: DetraccionStatus): Promise<Detraccion[]>;
    findPendingByCompany(companyId: string): Promise<Detraccion[]>;
    delete(id: string): Promise<void>;
    count(companyId: string): Promise<number>;
    private mapToDomain;
}
//# sourceMappingURL=postgres-detraction.repository.d.ts.map