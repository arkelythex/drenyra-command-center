/**
 * Get Detraction Audit — Query Handler
 *
 * Returns a paginated, filterable, sortable audit trail
 * for SPOT detraction compliance analysis.
 */

import type {
	AuditPage,
	InterCompanyDetractionAuditFilters,
} from "../../domain/inter-company-transaction.entity";
import type { IInterCompanyTransactionRepository } from "../../domain/inter-company-transaction.repository";

/**
 * GetDetractionAuditHandler class.
 *
 * @example
 * ```ts
 * const value = new GetDetractionAuditHandler();
 * console.log(value);
 * ```
 */
export class GetDetractionAuditHandler {
	constructor(
		private readonly repository: IInterCompanyTransactionRepository,
	) {}

	async execute(
		filters: InterCompanyDetractionAuditFilters,
	): Promise<AuditPage> {
		return this.repository.findAuditPage(filters);
	}
}
