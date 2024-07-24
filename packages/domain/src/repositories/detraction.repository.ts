/**
 * Detraction Repository Interface
 *
 * Port for SPOT detraction persistence.
 * Following dependency inversion — domain defines the contract.
 */

import type { Detraccion, DetraccionStatus } from "../accounting/detraccion";
import type { TenantScope } from "../scope";

export interface DetractionRepository {
	save(detraction: Detraccion, companyId: string): Promise<void>;

	/**
	 * Find a detraction by ID within the given tenant scope.
	 * Enforces tenant isolation by filtering on companyId from the scope.
	 */
	findById(scope: TenantScope, id: string): Promise<Detraccion | null>;
	findByReference(
		referenceType: string,
		referenceId: string,
	): Promise<Detraccion[]>;
	findByCompanyAndPeriod(
		companyId: string,
		year: number,
		month: number,
	): Promise<Detraccion[]>;
	findByStatus(
		companyId: string,
		status: DetraccionStatus,
	): Promise<Detraccion[]>;
	findPendingByCompany(companyId: string): Promise<Detraccion[]>;
	delete(id: string): Promise<void>;
	count(companyId: string): Promise<number>;
}
