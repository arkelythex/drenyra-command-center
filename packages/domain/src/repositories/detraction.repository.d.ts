import type { Detraccion, DetraccionStatus } from "../accounting/detraccion";
import type { TenantScope } from "../scope";
export interface DetractionRepository {
    save(detraction: Detraccion, companyId: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<Detraccion | null>;
    findByReference(referenceType: string, referenceId: string): Promise<Detraccion[]>;
    findByCompanyAndPeriod(companyId: string, year: number, month: number): Promise<Detraccion[]>;
    findByStatus(companyId: string, status: DetraccionStatus): Promise<Detraccion[]>;
    findPendingByCompany(companyId: string): Promise<Detraccion[]>;
    delete(id: string): Promise<void>;
    count(companyId: string): Promise<number>;
}
//# sourceMappingURL=detraction.repository.d.ts.map