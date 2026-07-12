import { POLICY_OUTCOME } from "@drenyra/domain";
export class DeterministicValidatorOrchestratorService {
	validators;
	constructor(validators) {
		this.validators = validators;
	}
	async execute(input) {
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
//# sourceMappingURL=deterministic-validator-orchestrator.service.js.map
