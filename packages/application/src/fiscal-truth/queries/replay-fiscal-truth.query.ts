import type { FiscalTruthScope, ReplayResult } from "@drenyra/domain";
import { ReplayFiscalTruthService } from "../services/replay-fiscal-truth.service";

export interface ReplayFiscalTruthQueryInput {
	aggregateId: string;
	scope: FiscalTruthScope;
}

/**
 * Query wrapper over replay orchestration service.
 */
export class ReplayFiscalTruthQuery {
	constructor(private readonly replayService: ReplayFiscalTruthService) {}

	execute(input: ReplayFiscalTruthQueryInput): Promise<ReplayResult> {
		return this.replayService.execute(input);
	}
}
