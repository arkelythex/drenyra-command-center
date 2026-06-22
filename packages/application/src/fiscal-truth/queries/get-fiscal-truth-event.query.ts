import type {
	FiscalTruthEvent,
	FiscalTruthRepository,
	FiscalTruthScope,
} from "@arkelythex/domain";

export interface GetFiscalTruthEventQueryInput {
	eventId: string;
	scope: FiscalTruthScope;
}

/**
 * Scoped query for one authoritative fiscal truth event.
 */
export class GetFiscalTruthEventQuery {
	constructor(private readonly repository: FiscalTruthRepository) {}

	execute(
		input: GetFiscalTruthEventQueryInput,
	): Promise<FiscalTruthEvent | null> {
		return this.repository.findByEventId(input.eventId, input.scope);
	}
}
