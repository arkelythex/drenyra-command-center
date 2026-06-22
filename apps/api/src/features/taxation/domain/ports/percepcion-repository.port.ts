import type {
	Percepcion,
	PercepcionStatus,
} from "../entities/percepcion.entity";

/**
 * Persistence contract for percepción IGV aggregates.
 *
 * @example
 * ```ts
 * const result = await repo.findByStatus(companyId, 'PENDING');
 * ```
 */
export interface IPercepcionRepository {
	save(percepcion: Percepcion): Promise<void>;
	update(percepcion: Percepcion): Promise<void>;
	findById(id: string): Promise<Percepcion | null>;
	findByBillId(billId: string): Promise<Percepcion | null>;
	findByStatus(
		companyId: string,
		status: PercepcionStatus,
	): Promise<Percepcion[]>;
	findByDeclarationPeriod(
		companyId: string,
		declarationPeriod: string,
	): Promise<Percepcion[]>;
}
