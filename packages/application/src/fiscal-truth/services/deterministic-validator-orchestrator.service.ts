import type {
	DeterministicValidatorResultRecord,
	PolicyDecisionRecord,
} from "@drenyra/domain";
import { POLICY_OUTCOME } from "@drenyra/domain";
import type { DeterministicFiscalValidatorPort } from "../ports/deterministic-fiscal-validator.port";

export interface DeterministicValidatorOrchestratorInput {
	validatorPayload: unknown;
}

export interface DeterministicValidatorOrchestratorOutput {
	results: DeterministicValidatorResultRecord[];
	policyOutcome: PolicyDecisionRecord["outcome"];
}

/**
 * Runs deterministic validators and projects a coarse policy outcome.
 */
export class DeterministicValidatorOrchestratorService {
	constructor(
		private readonly validators: DeterministicFiscalValidatorPort[],
	) {}

	async execute(
		input: DeterministicValidatorOrchestratorInput,
	): Promise<DeterministicValidatorOrchestratorOutput> {
		const results = await Promise.all(
			this.validators.map((validator) =>
				validator.validate(input.validatorPayload),
			),
		);

		const hasBlockingFailures = results.some(
			(result) => !result.isValid || result.severity === "blocking",
		);

		return {
			results,
			policyOutcome: hasBlockingFailures
				? POLICY_OUTCOME.BLOCKED
				: POLICY_OUTCOME.PROMOTABLE,
		};
	}
}
