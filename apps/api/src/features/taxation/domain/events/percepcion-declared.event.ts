import { DomainEvent } from "@arkelythex/domain/events/DomainEvent";

/**
 * Domain event emitted when a percepción IGV is declared to SUNAT via PDT.
 *
 * @example
 * ```ts
 * const event = new PercepcionDeclared('c1', 'p1', '2026-03', 'PDT-621-2026-03', 2000, new Date());
 * ```
 */
export class PercepcionDeclared extends DomainEvent {
	constructor(
		public readonly companyId: string,
		public readonly percepcionId: string,
		public readonly declarationPeriod: string,
		public readonly pdtReference: string,
		public readonly percepcionAmountCents: number,
		public readonly declaredAt: Date,
	) {
		super();
	}

	get eventName(): string {
		return "taxation.percepcion.declared";
	}

	protected getPayload(): Record<string, unknown> {
		return this.toPayload();
	}

	toPayload(): Record<string, unknown> {
		return {
			companyId: this.companyId,
			percepcionId: this.percepcionId,
			declarationPeriod: this.declarationPeriod,
			pdtReference: this.pdtReference,
			percepcionAmountCents: this.percepcionAmountCents,
			declaredAt: this.declaredAt.toISOString(),
		};
	}
}
