import { DomainEvent } from "@arkelythex/domain/events/DomainEvent";
import type { Money } from "@arkelythex/domain/value-objects/Money";

/**
 * Domain event emitted when a percepción IGV is applied from a purchase bill.
 *
 * @example
 * ```ts
 * const event = new PercepcionApplied('c1', 'p1', 'b1', '20100070970', 'VENTA_INTERNA', total, amount, '2026-03', new Date());
 * ```
 */
export class PercepcionApplied extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly percepcionId: string,
		public readonly billId: string,
		public readonly agentRuc: string,
		public readonly percepcionType: string,
		public readonly totalAmount: Money,
		public readonly percepcionAmount: Money,
		public readonly declarationPeriod: string,
		public readonly sunatDueDate: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.percepcion.applied";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	/**
	 * Public serialization for EventBus publishing.
	 */
	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			percepcionId: this.percepcionId,
			billId: this.billId,
			agentRuc: this.agentRuc,
			percepcionType: this.percepcionType,
			totalAmountCents: this.totalAmount.getCents(),
			percepcionAmountCents: this.percepcionAmount.getCents(),
			currency: this.totalAmount.getCurrency(),
			declarationPeriod: this.declarationPeriod,
			sunatDueDate: this.sunatDueDate.toISOString(),
		};
	}
}
