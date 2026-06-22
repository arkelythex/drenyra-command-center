import { DomainEvent } from "@arkelythex/domain/events/DomainEvent";

/**
 * Domain event emitted when a percepción IGV is cancelled.
 *
 * @example
 * ```ts
 * const event = new PercepcionCancelled('c1', 'p1', 'Invoice was voided', new Date());
 * ```
 */
export class PercepcionCancelled extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly percepcionId: string,
		public readonly reason: string,
		public readonly cancelledAt: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.percepcion.cancelled";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			percepcionId: this.percepcionId,
			reason: this.reason,
			cancelledAt: this.cancelledAt.toISOString(),
		};
	}
}
