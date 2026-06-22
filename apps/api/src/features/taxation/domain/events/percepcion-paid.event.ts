import { DomainEvent } from "@arkelythex/domain/events/DomainEvent";

/**
 * Domain event emitted when a percepción IGV is paid to SUNAT.
 *
 * @example
 * ```ts
 * const event = new PercepcionPaid('c1', 'p1', 'tx-001', 2000, new Date());
 * ```
 */
export class PercepcionPaid extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly percepcionId: string,
		public readonly bankTransactionId: string,
		public readonly percepcionAmountCents: number,
		public readonly paidAt: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.percepcion.paid";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			percepcionId: this.percepcionId,
			bankTransactionId: this.bankTransactionId,
			percepcionAmountCents: this.percepcionAmountCents,
			paidAt: this.paidAt.toISOString(),
		};
	}
}
