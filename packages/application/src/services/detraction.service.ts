/**
 * Detraction Service
 *
 * Orchestrates SPOT detraction business rules with persistence.
 */

import {
	Detraccion,
	InvalidDetraccionError,
} from "@arkelythex/domain/accounting/detraccion";
import type { DetractionRepository } from "@arkelythex/domain/repositories/detraction.repository";
import { Money } from "@arkelythex/domain/value-objects/Money";
import type { Currency } from "@arkelythex/domain/types/currency";

/**
 * DTO used to register a SPOT detraction using explicit minor units.
 *
 * @remarks amountCents prevents decimal-float fiscal money at the application boundary.
 * @example
 * const dto: RegisterDetractionDTO = { id, companyId, spotCode: "001", percentage: 10, amountCents: 100_00, currency: "PEN", reference };
 */
export interface RegisterDetractionDTO {
	id: string;
	companyId: string;
	spotCode: string;
	percentage: number;
	amountCents: number;
	currency: Currency;
	reference: string;
}

/**
 * Deposit confirmation data for a pending detraction.
 *
 * @remarks Deposit amounts use cents for deterministic money handling.
 * @example
 * const deposit: DepositInfo = { fechaDeposito: new Date(), bancoOrigen: "BCP", constanciaNumero: "CONST-1", amountCents: 100_00 };
 */
export interface DepositInfo {
	fechaDeposito: Date;
	bancoOrigen: string;
	constanciaNumero: string;
	amountCents: number;
}

/**
 * Application service for deterministic SPOT detraction workflows.
 *
 * @remarks The service delegates fiscal invariants to the Detraccion domain entity.
 * @example
 * const detraction = await service.registerDetraction(dto);
 */
export class DetractionService {
	constructor(
		private readonly detractionRepo: DetractionRepository,
	) {}

	/**
	 * Registers a new detraction from an invoice or other reference.
	 *
	 * @param dto - Detraction registration payload with amount in cents.
	 * @returns The persisted detraction aggregate.
	 * @throws InvalidDetraccionError when scope, SPOT code, percentage, amount, or reference is invalid.
	 */
	async registerDetraction(dto: RegisterDetractionDTO): Promise<Detraccion> {
		if (!dto.companyId || dto.companyId.trim().length === 0) {
			throw new InvalidDetraccionError("companyId", "Company ID is required");
		}

		// Create Money from explicit minor units; never pass fiscal money as floats.
		const amountMoney = Money.fromCents(dto.amountCents, dto.currency);

		// Domain entity validates all parameters
		const detraction = Detraccion.create(
			dto.id,
			dto.spotCode,
			dto.percentage,
			amountMoney,
			dto.reference,
		);

		await this.detractionRepo.save(detraction, dto.companyId);

		return detraction;
	}

	/**
	 * Records a deposit for a pending detraction.
	 *
	 * @param detractionId - Detraction identifier.
	 * @param _depositInfo - Deposit evidence metadata.
	 * @returns The detraction after its validated state transition.
	 * @throws InvalidDetraccionError when the detraction does not exist or cannot transition.
	 */
	async recordDeposit(
		detractionId: string,
		_depositInfo: DepositInfo,
	): Promise<Detraccion> {
		if (!detractionId || detractionId.trim().length === 0) {
			throw new InvalidDetraccionError("id", "Detraction ID is required");
		}

		const detraction = await this.detractionRepo.findById(detractionId);
		if (!detraction) {
			throw new InvalidDetraccionError(
				"id",
				`Detraction not found: ${detractionId}`,
			);
		}

		// State transition via domain entity
		const updated = detraction.deposit();

		// Persist
		await this.detractionRepo.save(updated, "");

		return updated;
	}

	/**
	 * Gets all pending detractions for a company.
	 *
	 * @param companyId - Company scope for the query.
	 * @returns Pending detractions in the company scope.
	 */
	async getPendingByCompany(companyId: string): Promise<Detraccion[]> {
		return this.detractionRepo.findPendingByCompany(companyId);
	}

	/**
	 * Gets detractions by status for a company.
	 *
	 * @param companyId - Company scope for the query.
	 * @param status - Detraction lifecycle status.
	 * @returns Detractions matching the requested status.
	 */
	async getByStatus(
		companyId: string,
		status: "pendiente" | "depositado" | "usado" | "liberado",
	): Promise<Detraccion[]> {
		return this.detractionRepo.findByStatus(companyId, status);
	}
}
