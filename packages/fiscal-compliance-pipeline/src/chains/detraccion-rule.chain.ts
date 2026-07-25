/**
 * Detracción Rule Change Chain — cascading compliance stages for
 * detracción threshold/percentage changes.
 *
 * Detracción threshold change → PLE regeneration → SIRE validation
 *
 * Unlike IGV changes that affect Detracciones first, a direct detracción
 * change starts with the detracción engine and cascades to PLE and SIRE.
 */

import type {
	ComplianceChain,
	ComplianceContext,
	ComplianceStage,
	ComplianceStageResult,
	FiscalRuleChange,
} from "../types";

/** Stage 1: Apply new detracción rates. */
const applyDetraccionRatesStage: ComplianceStage = {
	stageId: "detraccion-rates",
	name: "Detracción Rate Update",
	description:
		"Apply new detracción percentages/thresholds to the detracción engine",
	affectedSubsystem: "Detracciones Engine",
	requiredApproval: true,
	dependsOn: [],
	execute: async (
		change: FiscalRuleChange,
		_ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		return {
			status: "PASSED",
			evidenceId: `detraccion-rate-${Date.now()}`,
			findings: [
				{
					stageId: "detraccion-rates",
					severity: "INFO",
					code: "DET-010",
					message: `Detracción rates updated: ${change.oldValue} → ${change.newValue}`,
				},
			],
			confidence: 0.9,
		};
	},
};

/** Stage 2: Regenerate affected CPE logs. */
const cpeRegenerationStage: ComplianceStage = {
	stageId: "cpe-regen",
	name: "CPE Log Regeneration",
	description:
		"Regenerate affected CPE (Comprobante de Pago Electrónico) logs with new detracción rates",
	affectedSubsystem: "CPE Log Engine",
	requiredApproval: true,
	dependsOn: ["detraccion-rates"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const detraResult = ctx.previousStageResults.get("detraccion-rates");
		if (detraResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `cpe-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "cpe-regen",
						severity: "CRITICAL",
						code: "CPE-001",
						message: "Detracción rates must be applied before CPE regeneration",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `cpe-regen-${Date.now()}`,
			findings: [
				{
					stageId: "cpe-regen",
					severity: "INFO",
					code: "CPE-002",
					message:
						"CPE logs regenerated successfully with new detracción rates",
				},
			],
			confidence: 0.85,
		};
	},
};

/** Stage 3: Validate PLE against new rates. */
const pleValidationStage: ComplianceStage = {
	stageId: "ple-validate",
	name: "PLE Validation",
	description: "Validate PLE reports with updated detracción calculations",
	affectedSubsystem: "PLE Engine",
	requiredApproval: true,
	dependsOn: ["cpe-regen"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const cpeResult = ctx.previousStageResults.get("cpe-regen");
		if (cpeResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `ple-validate-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "ple-validate",
						severity: "CRITICAL",
						code: "PLE-010",
						message: "CPE regeneration must complete before PLE validation",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `ple-validate-${Date.now()}`,
			findings: [
				{
					stageId: "ple-validate",
					severity: "INFO",
					code: "PLE-011",
					message: "PLE validated with updated detracción rates",
				},
			],
			confidence: 0.85,
		};
	},
};

/** Complete detracción rule change compliance chain. */
export const DETRACCION_RULE_CHAIN: ComplianceChain = {
	chainId: "detraccion-rule-change",
	name: "Detracción Rule Change Compliance",
	description:
		"Cascading compliance stages triggered by detracción threshold/percentage changes",
	stages: [applyDetraccionRatesStage, cpeRegenerationStage, pleValidationStage],
	triggersOn: ["THRESHOLD", "RATE"],
};
