import type {
	DeterministicValidatorResultRecord,
	EvidenceNode,
	FiscalTruthEvent,
	FiscalTruthRepository,
	PolicyDecisionRecord,
} from "@drenyra/domain";
export interface PromoteFiscalTruthCommandInput {
	event: FiscalTruthEvent;
	validatorResults: DeterministicValidatorResultRecord[];
	policyDecision: PolicyDecisionRecord;
	hasRequiredApproval: boolean;
}
export interface PromoteFiscalTruthCommandDependencies {
	append: FiscalTruthRepository["append"];
	findEvidenceNodeById?: (
		nodeId: string,
		scope: FiscalTruthEvent["scope"],
	) => Promise<EvidenceNode | null>;
}
export declare class PromoteFiscalTruthCommand {
	private readonly deps;
	constructor(deps: PromoteFiscalTruthCommandDependencies);
	execute(input: PromoteFiscalTruthCommandInput): Promise<void>;
}
//# sourceMappingURL=promote-fiscal-truth.command.d.ts.map
