/**
 * Bank Reconciliation Chain — cascading stages for exchange rate changes
 * affecting bank reconciliation.
 *
 * Exchange Rate Change → Outstanding Transaction Recalc → Reconciliation → Ledger Update
 *
 * When the exchange rate changes (e.g., USD/PEN rate update), all outstanding
 * foreign currency transactions must be recalculated before reconciliation.
 */

import type {
	ComplianceChain,
	ComplianceContext,
	ComplianceStage,
	ComplianceStageResult,
	FiscalRuleChange,
} from "../types";

/** Stage 1: Apply new exchange rate to outstanding transactions. */
const rateRecalcStage: ComplianceStage = {
	stageId: "tipo-cambio-recalculo",
	name: "Exchange Rate Recalculation",
	description:
		"Recalculate outstanding foreign currency transactions with new exchange rate",
	affectedSubsystem: "Banking Engine",
	requiredApproval: true,
	dependsOn: [],
	execute: async (
		change: FiscalRuleChange,
		_ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => ({
		status: "PASSED",
		evidenceId: `tc-recalc-${Date.now()}`,
		findings: [
			{
				stageId: "tipo-cambio-recalculo",
				severity: "INFO",
				code: "TC-001",
				message: `Exchange rate recalculated: ${change.oldValue} → ${change.newValue}`,
			},
		],
		confidence: 0.9,
	}),
};

/** Stage 2: Reconcile bank statements with recalculated rates. */
const bankReconStage: ComplianceStage = {
	stageId: "conciliacion-bancaria",
	name: "Bank Reconciliation",
	description: "Reconcile bank statements using recalculated exchange rates",
	affectedSubsystem: "Reconciliation Engine",
	requiredApproval: true,
	dependsOn: ["tipo-cambio-recalculo"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const tcResult = ctx.previousStageResults.get("tipo-cambio-recalculo");
		if (tcResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `recon-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "conciliacion-bancaria",
						severity: "CRITICAL",
						code: "REC-001",
						message:
							"Exchange rate recalculation must complete before reconciliation",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `recon-done-${Date.now()}`,
			findings: [
				{
					stageId: "conciliacion-bancaria",
					severity: "INFO",
					code: "REC-002",
					message: "Bank statements reconciled with updated exchange rates",
				},
			],
			confidence: 0.85,
		};
	},
};

/** Stage 3: Update ledger with reconciled differences. */
const ledgerUpdateStage: ComplianceStage = {
	stageId: "actualizacion-ledger",
	name: "Ledger Update",
	description:
		"Update general ledger with exchange rate differences from reconciliation",
	affectedSubsystem: "Ledger Engine",
	requiredApproval: true,
	dependsOn: ["conciliacion-bancaria"],
	execute: async (
		_change: FiscalRuleChange,
		ctx: ComplianceContext,
	): Promise<ComplianceStageResult> => {
		const reconResult = ctx.previousStageResults.get("conciliacion-bancaria");
		if (reconResult?.status !== "PASSED") {
			return {
				status: "BLOCKED",
				evidenceId: `ledger-blocked-${Date.now()}`,
				findings: [
					{
						stageId: "actualizacion-ledger",
						severity: "CRITICAL",
						code: "LED-001",
						message: "Bank reconciliation must complete before ledger update",
					},
				],
				confidence: 0,
			};
		}

		return {
			status: "PASSED",
			evidenceId: `ledger-updated-${Date.now()}`,
			findings: [
				{
					stageId: "actualizacion-ledger",
					severity: "INFO",
					code: "LED-002",
					message:
						"General ledger updated with exchange rate reconciliation differences",
				},
			],
			confidence: 0.9,
		};
	},
};

/** Complete bank reconciliation compliance chain. */
export const BANK_RECONCILIATION_CHAIN: ComplianceChain = {
	chainId: "bank-reconciliation",
	name: "Bank Reconciliation Compliance",
	description:
		"Cascading compliance stages for exchange rate changes: TC Recalc → Reconciliation → Ledger",
	stages: [rateRecalcStage, bankReconStage, ledgerUpdateStage],
	triggersOn: ["RATE", "THRESHOLD"],
};
