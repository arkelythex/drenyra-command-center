import type { ProviderResponse } from "./provider-adapter.types";

export interface QualityGateResult {
	passed: boolean;
	score: number;
	reason?: string;
}

export interface QualityGate {
	name: string;
	check(
		response: ProviderResponse,
	): Promise<QualityGateResult> | QualityGateResult;
}

export class ResponseValidator implements QualityGate {
	readonly name = "response_validator";

	check(response: ProviderResponse): QualityGateResult {
		if (!response.content || response.content.length === 0) {
			return { passed: false, score: 0, reason: "Empty response content" };
		}
		if (response.latencyMs > 60_000) {
			return {
				passed: false,
				score: 0,
				reason: "Response exceeded 60s timeout",
			};
		}
		return { passed: true, score: 1 };
	}
}

export class CostCapEnforcer implements QualityGate {
	readonly name = "cost_cap_enforcer";

	constructor(private readonly maxCostCents: number) {}

	check(response: ProviderResponse): QualityGateResult {
		if (response.costCents > this.maxCostCents) {
			return {
				passed: false,
				score: Math.max(0, 1 - response.costCents / this.maxCostCents),
				reason: `Cost ${response.costCents}c exceeds cap ${this.maxCostCents}c`,
			};
		}
		return { passed: true, score: 1 };
	}
}

export class ReputationGate implements QualityGate {
	readonly name = "reputation_gate";

	constructor(private readonly minReliability: number = 0.7) {}

	check(response: ProviderResponse): QualityGateResult {
		const reliability = 1 - (response.costCents > 0 ? 0.1 : 0);
		if (reliability < this.minReliability) {
			return {
				passed: false,
				score: reliability,
				reason: `Reliability ${reliability} below threshold ${this.minReliability}`,
			};
		}
		return { passed: true, score: reliability };
	}
}

export async function runQualityGates(
	gates: QualityGate[],
	response: ProviderResponse,
): Promise<{ passed: boolean; results: QualityGateResult[] }> {
	const results = await Promise.all(gates.map((gate) => gate.check(response)));
	const passed = results.every((r) => r.passed);
	return { passed, results };
}
