/**
 * Confidence gate configuration and evaluation for fiscal phase transitions.
 * Reads shared YAML thresholds — LLM confidence must meet phase minimum.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";
import type {
	FiscalPeriodState,
	FiscalPhaseId,
	GateDefinition,
	GateResult,
	PhaseGateContext,
} from "./types";

const CONFIG_PATH = join(
	dirname(fileURLToPath(import.meta.url)),
	"../../config/fiscal-confidence-gates.yaml",
);

export interface PhaseConfidenceConfig {
	confidence_min: number;
	auto_advance: boolean;
	amount_gate_pen?: number;
	variance_max_pen?: number;
	human_required?: boolean;
	opa_action?: string;
}

export interface FiscalConfidenceGatesConfig {
	phases: Record<FiscalPhaseId, PhaseConfidenceConfig>;
}

let cachedConfig: FiscalConfidenceGatesConfig | null = null;

export function loadConfidenceGateConfig(): FiscalConfidenceGatesConfig {
	if (cachedConfig) return cachedConfig;
	const raw = readFileSync(CONFIG_PATH, "utf-8");
	cachedConfig = parseYaml(raw) as FiscalConfidenceGatesConfig;
	return cachedConfig;
}

export function getPhaseConfidenceThreshold(phaseId: FiscalPhaseId): number {
	const config = loadConfidenceGateConfig();
	return config.phases[phaseId]?.confidence_min ?? 0.7;
}

function getPhaseConfidenceScore(state: FiscalPeriodState): number | null {
	const phaseMeta = state.metadata?.[state.currentPhase] as
		| Record<string, unknown>
		| undefined;
	const score =
		(phaseMeta?.confidence as number | undefined) ??
		(state.metadata?.confidence as number | undefined);
	return typeof score === "number" ? score : null;
}

/**
 * Creates a confidence gate for a fiscal phase.
 * Blocks transition when agent confidence is below configured threshold.
 */
export function confidenceGate(phaseId: FiscalPhaseId): GateDefinition {
	const threshold = getPhaseConfidenceThreshold(phaseId);

	return {
		id: `confidence-${phaseId}`,
		name: `Confianza — ${phaseId}`,
		description: `Requiere confianza del agente >= ${threshold} para avanzar`,
		phaseId,
		position: "exit",
		evaluate: async (
			state: FiscalPeriodState,
			_ctx: PhaseGateContext,
		): Promise<GateResult> => {
			const confidence = getPhaseConfidenceScore(state);

			if (confidence === null) {
				return {
					gateId: `confidence-${phaseId}`,
					gateName: `Confianza — ${phaseId}`,
					passed: true,
					severity: "warning",
					reason: `Confianza no reportada para fase ${phaseId} — permitido en modo stub`,
					evidence: { threshold, confidence: null, deferred: true },
					evaluatedAt: new Date(),
				};
			}

			const passed = confidence >= threshold;

			return {
				gateId: `confidence-${phaseId}`,
				gateName: `Confianza — ${phaseId}`,
				passed,
				severity: passed ? "info" : "error",
				reason: passed
					? undefined
					: `Confianza ${confidence.toFixed(2)} < umbral ${threshold} (fase ${phaseId})`,
				evidence: { threshold, confidence },
				evaluatedAt: new Date(),
			};
		},
	};
}

/** Register confidence gates for all configured phases. */
export function registerConfidenceGates(
	register: (gate: GateDefinition) => void,
): void {
	const config = loadConfidenceGateConfig();
	for (const phaseId of Object.keys(config.phases) as FiscalPhaseId[]) {
		register(confidenceGate(phaseId));
	}
}

export function resetConfidenceGateConfigCache(): void {
	cachedConfig = null;
}
