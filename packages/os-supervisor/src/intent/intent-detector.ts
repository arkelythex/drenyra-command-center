import type { OSIntent } from "../types/agent.types.js";
import { VerticalType } from "../types/vertical.types.js";

export interface IntentRule {
	pattern: RegExp;
	action: string;
	priority: number;
}

interface ScoredRule {
	rule: IntentRule;
	vertical: VerticalType;
}

export class GeneralizedIntentDetector {
	private rules: ScoredRule[] = [];

	registerVerticalRules(vertical: VerticalType, rules: IntentRule[]): void {
		for (const rule of rules) {
			this.rules.push({ rule, vertical });
		}
		this.rules.sort((a, b) => b.rule.priority - a.rule.priority);
	}

	async detectIntent(input: string): Promise<OSIntent> {
		const normalized = input.toLowerCase().trim();

		for (const scored of this.rules) {
			if (scored.rule.pattern.test(normalized)) {
				return {
					vertical: scored.vertical,
					action: scored.rule.action,
					confidence: 0.9,
					originalInput: input,
				};
			}
		}

		return {
			vertical: VerticalType.DRENYRA,
			action: "general",
			confidence: 0.3,
			originalInput: input,
		};
	}

	clear(): void {
		this.rules = [];
	}
}
