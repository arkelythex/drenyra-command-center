/**
 * ConflictFreeGate — validates that there are no unresolved conflicts
 * between agent outputs before proceeding.
 */

import type {
	GatekeeperCheck,
	GatekeeperContext,
	GatekeeperVerdict,
} from "../types";

export interface ConflictCheckInput {
	conflicts?: Array<{
		field: string;
		severity: "low" | "medium" | "high";
		sources?: Record<string, unknown>;
		[key: string]: unknown;
	}>;
	arbitrationDecision?: {
		decision?: "APPROVED" | "REJECTED" | "MANUAL_REVIEW";
		confidence?: number;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/**
 * Gate that checks for unresolved high-severity conflicts.
 * BLOCKING if high-severity conflicts exist without an approved arbitration.
 */
export const CONFLICT_FREE_GATE: GatekeeperCheck<ConflictCheckInput> = {
	name: "ConflictFreeGate",
	description: "Ensures no unresolved high-severity conflicts remain",

	check: (data, _ctx: GatekeeperContext): GatekeeperVerdict => {
		const conflicts = data.conflicts ?? [];
		const arbitration = data.arbitrationDecision;

		if (!Array.isArray(conflicts) || conflicts.length === 0) {
			return {
				passed: true,
				reasons: ["No conflicts detected"],
				severity: "INFO",
				details: { conflictCount: 0 },
			};
		}

		const highConflicts = conflicts.filter((c) => c.severity === "high");

		if (highConflicts.length === 0) {
			return {
				passed: true,
				reasons: [
					`${conflicts.length} low/medium conflicts present but resolved`,
				],
				severity: "WARNING",
				details: { total: conflicts.length, high: 0 },
			};
		}

		// If there's an approved arbitration for all high conflicts, non-blocking
		if (arbitration && arbitration.decision === "APPROVED") {
			return {
				passed: true,
				reasons: [
					`${highConflicts.length} high conflicts resolved by arbitration (confidence: ${arbitration.confidence ?? "N/A"})`,
				],
				severity: "INFO",
				details: {
					total: conflicts.length,
					high: highConflicts.length,
					arbitrationDecision: arbitration.decision,
					arbitrationConfidence: arbitration.confidence,
				},
			};
		}

		return {
			passed: false,
			reasons: [
				`${highConflicts.length} unresolved high-severity conflicts`,
				...highConflicts.map((c) => `  - ${c.field} (severity: ${c.severity})`),
			],
			severity: "BLOCKING",
			details: {
				total: conflicts.length,
				high: highConflicts.length,
				highFields: highConflicts.map((c) => c.field),
				hasArbitration: !!arbitration,
				arbitrationDecision: arbitration?.decision,
			},
		};
	},
};
