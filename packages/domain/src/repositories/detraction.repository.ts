/**
 * Detraction Repository Interface
 *
 * Port for SPOT detraction persistence.
 * Following dependency inversion — domain defines the contract.
 */

import type { Detraccion, DetraccionStatus } from "../accounting/detraccion";

export interface DetractionRepository {
	save(detraction: Detraccion, companyId: string): Promise<void>;
	findById(id: string): Promise<Detraccion | null>;
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
