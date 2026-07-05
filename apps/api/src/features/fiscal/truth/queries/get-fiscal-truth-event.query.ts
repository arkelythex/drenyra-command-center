import type { GetFiscalTruthEventQuery } from "@drenyra/application";
import type { FiscalTruthEvent, FiscalTruthScope } from "@drenyra/domain";

/** Scoped API query for one fiscal truth event. */
export class GetFiscalTruthEventApiQuery {
	constructor(private readonly query: GetFiscalTruthEventQuery) {}

	execute(
		eventId: string,
		scope: FiscalTruthScope,
	): Promise<FiscalTruthEvent | null> {
		return this.query.execute({ eventId, scope });
	}
}
