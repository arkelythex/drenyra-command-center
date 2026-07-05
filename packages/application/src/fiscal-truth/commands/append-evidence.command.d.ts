import type {
	DeterministicValidatorResultRecord,
	EvidenceGraphRepository,
	EvidenceNode,
	FiscalTruthScope,
	PolicyDecisionRecord,
} from "@drenyra/domain";
export interface AppendEvidenceCommandInput {
	expectedScope: FiscalTruthScope;
	evidence: EvidenceNode;
	validatorResults?: DeterministicValidatorResultRecord[];
	policyDecision?: PolicyDecisionRecord;
	hasRequiredApproval?: boolean;
	approvalId?: string;
}
export interface AppendEvidenceCommandDependencies {
	appendNode: EvidenceGraphRepository["appendNode"];
	appendEdge: EvidenceGraphRepository["appendEdge"];
}
export declare class AppendEvidenceCommand {
	private readonly deps;
	constructor(deps: AppendEvidenceCommandDependencies);
	execute(input: AppendEvidenceCommandInput): Promise<void>;
}
//# sourceMappingURL=append-evidence.command.d.ts.map
