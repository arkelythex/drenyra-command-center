/**
 * CPELog Repository Interface
 *
 * Port for SUNAT communication log persistence.
 * Following dependency inversion — domain defines the contract.
 */

import type { CPELog, SunatStatus } from "../accounting/cpe-log";
import type { TenantScope } from "../scope";

export interface CpeLogRepository {
	save(log: CPELog, companyId: string): Promise<void>;

	/**
	 * Find a CPE log by ID within the given tenant scope.
	 * Enforces tenant isolation by filtering on companyId from the scope.
	 */
	findById(scope: TenantScope, id: string): Promise<CPELog | null>;
	findByInvoiceId(invoiceId: string): Promise<CPELog | null>;
	findByCompanyAndPeriod(
		companyId: string,
		year: number,
		month: number,
	): Promise<CPELog[]>;
	findByStatus(companyId: string, status: SunatStatus): Promise<CPELog[]>;
	findByTicket(ticket: string): Promise<CPELog | null>;
	updateStatus(
		id: string,
		newStatus: SunatStatus,
		metadata?: {
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
		},
	): Promise<void>;
	verifyHash(id: string, xmlHash: string): Promise<boolean>;
}
