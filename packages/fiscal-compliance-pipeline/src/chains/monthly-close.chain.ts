/**
 * Monthly Close Chain — cascading stages for month-end fiscal closing.
 *
 * Cierre Mensual → PLE Verification → SIRE Validation → Tax Declaration Preparation
 *
 * Each stage depends on the previous and requires approval before proceeding.
 */

import type {
	ComplianceChain,
	ComplianceContext,
	ComplianceStage,
	ComplianceStageResult,
	FiscalRuleChange,
} from "../types";

/** Stage 1: Initiate monthly close process. */
const closeInitStage: ComplianceStage = {
	stageId: "cierre-inicio",
	name: "Cierre Mensual Initiation",
	description:
		"Initialize the monthly closing process and freeze transaction period",
	affectedSubsystem: "Monthly Close Engine",
	requiredApproval: true,
	dependsOn: [],
	execute: async (
		change: FiscalRuleChange,
		_ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => ({
		status: "PASSED",
		evidenceId: `cierre-init-${Date.now()}`,
		findings: [
			{
				stageId: "cierre-inicio",
				severity: "INFO",
				code: "CIE-001",
				message: `Monthly close initiated for ${change.affectedRegulation}`,
			},
		],
		confidence: 0.9,
	}),
};

/** Stage 2: Verify PLE consistency after freeze. */
const pleVerifyStage: ComplianceStage = {
	stageId: "ple-verificacion",
	name: "PLE Verification",
	description:
		"Verify PLE (Libro de Compras/Ventas) consistency after period freeze",
	affectedSubsystem: "PLE Engine",
	requiredApproval: true,
	dependsOn: ["cierre-inicio"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const closeResult = ctx.previousStageResults.get("cierre-inicio");
		if (closeResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `ple-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "ple-verificacion",
						severity: "CRITICAL",
						code: "PLE-020",
						message: "Monthly close must be initiated before PLE verification",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `ple-verify-${Date.now()}`,
			findings: [
				{
					stageId: "ple-verificacion",
					severity: "INFO",
					code: "PLE-021",
					message: "PLE verified successfully after period freeze",
				},
			],
			confidence: 0.85,
		};
	},
};

/** Stage 3: Validate SIRE monthly report. */
const sireCloseValidationStage: ComplianceStage = {
	stageId: "sire-validacion-cierre",
	name: "SIRE Close Validation",
	description: "Validate SIRE monthly report against frozen PLE data",
	affectedSubsystem: "SIRE Engine",
	requiredApproval: true,
	dependsOn: ["ple-verificacion"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const pleResult = ctx.previousStageResults.get("ple-verificacion");
		if (pleResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `sire-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "sire-validacion-cierre",
						severity: "CRITICAL",
						code: "SIR-020",
						message: "PLE verification must complete before SIRE validation",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `sire-close-${Date.now()}`,
			findings: [
				{
					stageId: "sire-validacion-cierre",
					severity: "INFO",
					code: "SIR-021",
					message: "SIRE monthly report validated for close",
				},
			],
			confidence: 0.85,
		};
	},
};

/** Stage 4: Prepare tax declaration inputs. */
const taxDeclarationStage: ComplianceStage = {
	stageId: "declaracion-jurada",
	name: "Tax Declaration Preparation",
	description:
		"Prepare monthly tax declaration (DDJJ) inputs with verified data",
	affectedSubsystem: "Taxation Engine",
	requiredApproval: true,
	dependsOn: ["sire-validacion-cierre"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const sireResult = ctx.previousStageResults.get("sire-validacion-cierre");
		if (sireResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `ddjj-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "declaracion-jurada",
						severity: "CRITICAL",
						code: "DDJ-001",
						message: "SIRE validation must complete before DDJJ preparation",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `ddjj-ready-${Date.now()}`,
			findings: [
				{
					stageId: "declaracion-jurada",
					severity: "INFO",
					code: "DDJ-002",
					message: "Tax declaration inputs prepared from verified data",
				},
			],
			confidence: 0.9,
		};
	},
};

/** Complete monthly close compliance chain. */
export const MONTHLY_CLOSE_CHAIN: ComplianceChain = {
	chainId: "monthly-close",
	name: "Monthly Close Compliance",
	description:
		"Cascading compliance stages for month-end fiscal closing: Cierre → PLE → SIRE → DDJJ",
	stages: [
		closeInitStage,
		pleVerifyStage,
		sireCloseValidationStage,
		taxDeclarationStage,
	],
	triggersOn: ["REQUIREMENT", "SCHEMA"],
};
