import type { CPELog, SunatStatus } from "../accounting/cpe-log";
import type { TenantScope } from "../scope";
export interface CpeLogRepository {
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
}
//# sourceMappingURL=cpe-log.repository.d.ts.map