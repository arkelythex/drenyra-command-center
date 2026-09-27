import { CPELog, type SunatStatus } from "@drenyra/domain/accounting/cpe-log";
import type { CpeLogRepository } from "@drenyra/domain/repositories/cpe-log.repository";
import type { TenantScope } from "@drenyra/domain/scope";
export declare class PostgresCpeLogRepository implements CpeLogRepository {
    save(log: CPELog, companyId: string): Promise<void>;
    findById(scope: TenantScope, id: string): Promise<CPELog | null>;
    findByInvoiceId(invoiceId: string): Promise<CPELog | null>;
    findByCompanyAndPeriod(companyId: string, year: number, month: number): Promise<CPELog[]>;
    findByStatus(companyId: string, status: SunatStatus): Promise<CPELog[]>;
    findByTicket(ticket: string): Promise<CPELog | null>;
    updateStatus(id: string, newStatus: SunatStatus, metadata?: {
        sunatTicket?: string;
        cdrData?: Record<string, unknown>;
        errorMessage?: string;
        errorCode?: string;
        hashValue?: string;
        hashAlgorithm?: string;
        submittedAt?: Date;
        acceptedAt?: Date;
        rejectedAt?: Date;
        observedAt?: Date;
        cancelledAt?: Date;
    }): Promise<void>;
    verifyHash(id: string, xmlHash: string): Promise<boolean>;
    private mapToDomain;
}
//# sourceMappingURL=postgres-cpe-log.repository.d.ts.map