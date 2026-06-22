/**
 * AccountingPeriod Repository Interface
 *
 * Port for accounting period persistence.
 * Following dependency inversion — domain defines the contract.
 */

import type { AccountingPeriod } from "../accounting/accounting-period";

export interface AccountingPeriodRepository {
	save(period: AccountingPeriod, companyId: string): Promise<void>;
	findById(id: string): Promise<AccountingPeriod | null>;
	findByCompanyAndPeriod(
		companyId: string,
		year: number,
		month: number,
	): Promise<AccountingPeriod | null>;
	findAllByCompany(companyId: string): Promise<AccountingPeriod[]>;
	findByYear(companyId: string, year: number): Promise<AccountingPeriod[]>;
	getCurrentPeriod(companyId: string): Promise<AccountingPeriod | null>;
	delete(id: string): Promise<void>;
	count(companyId: string): Promise<number>;
}
