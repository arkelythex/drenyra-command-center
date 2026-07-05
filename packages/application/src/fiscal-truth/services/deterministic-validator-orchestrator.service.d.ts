import type {
	DeterministicValidatorResultRecord,
	PolicyDecisionRecord,
} from "@drenyra/domain";
import type { DeterministicFiscalValidatorPort } from "../ports/deterministic-fiscal-validator.port";
export interface DeterministicValidatorOrchestratorInput {
	validatorPayload: unknown;
}
export interface DeterministicValidatorOrchestratorOutput {
	results: DeterministicValidatorResultRecord[];
	policyOutcome: PolicyDecisionRecord["outcome"];
}
export declare class DeterministicValidatorOrchestratorService {
	private readonly validators;
	constructor(validators: DeterministicFiscalValidatorPort[]);
	execute(
		input: DeterministicValidatorOrchestratorInput,
	): Promise<DeterministicValidatorOrchestratorOutput>;
}
//# sourceMappingURL=deterministic-validator-orchestrator.service.d.ts.map
