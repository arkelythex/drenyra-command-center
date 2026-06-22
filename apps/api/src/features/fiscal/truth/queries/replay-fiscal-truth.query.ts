import type { ReplayFiscalTruthQuery } from "@arkelythex/application";
import type { FiscalTruthScope, ReplayResult } from "@arkelythex/domain";

/** Scoped API query for replaying authoritative fiscal truth. */
export class ReplayFiscalTruthApiQuery {
	constructor(private readonly query: ReplayFiscalTruthQuery) {}

	execute(aggregateId: string, scope: FiscalTruthScope): Promise<ReplayResult> {
		return this.query.execute({ aggregateId, scope });
	}
}
