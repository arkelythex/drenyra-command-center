// ─── Materiality Calculator ─────────────────────────────────────────────────

import {
	ATTENTION_STATE,
	PROJECTED_RISK_TIER,
} from "@drenyra/workspace-domain";
import type { AttentionState } from "@drenyra/workspace-domain";
import type { MaterialityLevel, MaterialityInput } from "./types";

// ─── Level ordering for bumps ───────────────────────────────────────────────

const LEVEL_ORDER: Record<MaterialityLevel, number> = {
	low: 0,
	medium: 1,
	high: 2,
	critical: 3,
};

function bumpLevel(current: MaterialityLevel): MaterialityLevel {
	const next = LEVEL_ORDER[current] + 1;
	if (next >= 3) return "critical";
	if (next === 2) return "high";
	return "medium";
}

// ─── Base materiality from severity ─────────────────────────────────────────

function baseMateriality(
	severity: AttentionState,
	affectedCompanies: number,
): MaterialityLevel {
	switch (severity) {
		case ATTENTION_STATE.CRITICAL:
			return "critical";
		case ATTENTION_STATE.BLOCKED:
			return affectedCompanies > 5 ? "high" : "medium";
		case ATTENTION_STATE.APPROVAL_REQUIRED:
			return "medium";
		case ATTENTION_STATE.EVIDENCE_REQUIRED:
			return "medium";
		case ATTENTION_STATE.INFORMATIONAL:
			return "low";
		case ATTENTION_STATE.INPUT_REQUIRED:
			return "low";
		case ATTENTION_STATE.NONE:
			return "low";
		default:
			return "low";
	}
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function calculateMateriality(
	input: MaterialityInput,
): MaterialityLevel {
	let level = baseMateriality(input.severity, input.affectedCompanies);

	// APPROVAL_REQUIRED + regulatory deadline → "high"
	if (
		input.severity === ATTENTION_STATE.APPROVAL_REQUIRED &&
		input.isRegulatoryDeadline
	) {
		level = "high";
	}

	// R3 risk → bump one level
	if (input.riskTier === PROJECTED_RISK_TIER.R3) {
		level = bumpLevel(level);
	}

	// Large monetary exposure → bump one level
	if (
		input.estimatedExposure !== undefined &&
		input.estimatedExposure > 100_000
	) {
		level = bumpLevel(level);
	}

	// Regulatory deadline → minimum "high"
	if (input.isRegulatoryDeadline) {
		if (LEVEL_ORDER[level] < LEVEL_ORDER.high) {
			level = "high";
		}
	}

	return level;
}
