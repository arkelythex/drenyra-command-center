import type { Retencion, RetentionStatus } from "../entities/retencion.entity";

/**
 * Persistence contract for retention aggregates.
 *
 * @example
 * ```ts
 * const result = await repo.findByStatus(companyId, 'PENDING');
 * ```
 */
export interface IRetencionRepository {
	save(retencion: Retencion): Promise<void>;
	update(retencion: Retencion): Promise<void>;
	findById(id: string): Promise<Retencion | null>;
	findByBillId(billId: string): Promise<Retencion | null>;
	findByStatus(
		companyId: string,
		status: RetentionStatus,
	): Promise<Retencion[]>;
	findByDeclarationPeriod(
		companyId: string,
		declarationPeriod: string,
	): Promise<Retencion[]>;
}
