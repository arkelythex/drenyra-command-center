import {
	DRENYRA_COMMAND_ID,
	DRENYRA_COMMAND_STATUS,
	DRENYRA_DETERMINISTIC_CHECK_STATUS,
	createDrenyraCommandEnvelope,
	type DrenyraCommandEnvelope,
} from "../../../../../packages/domain/src/drenyra/command-envelope";
import type { DrenyraActorContext } from "@drenyra/application/drenyra";
import { toDrenyraCommandScope, type CommandEnvelopeInputBase } from "./command-envelope.shared";

export interface ExplainRiskCommandInput extends CommandEnvelopeInputBase {
	riskRef?: string;
	sourceScopeVerified?: boolean;
}

export function createExplainRiskCommandEnvelope(
	context: DrenyraActorContext,
	input: ExplainRiskCommandInput,
): DrenyraCommandEnvelope {
	const evidenceId = input.riskRef ? `risk-${input.riskRef}` : "risk-explanation-draft";
	const scopeVerified = input.sourceScopeVerified === true;
	return createDrenyraCommandEnvelope({
		commandId: DRENYRA_COMMAND_ID.EXPLAIN_RISK,
		status: DRENYRA_COMMAND_STATUS.READY,
		scope: toDrenyraCommandScope(context),
		title: "Explain fiscal risk",
		summary: "Fiscal risk explanation envelope prepared for operator review",
		riskLevel: "HIGH",
		evidence: [{ id: evidenceId, type: "AGENT_OUTPUT", title: "Fiscal risk explanation", sourceRef: input.sourceRef }],
		deterministicChecks: [
			{
				id: "risk-scope",
				label: "Risk scope",
				status: scopeVerified ? DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED : DRENYRA_DETERMINISTIC_CHECK_STATUS.WARNING,
				summary: scopeVerified
					? "Risk source ownership was verified against scoped fiscal case evidence"
					: "Risk explanation inherits request scope; source ownership must be verified before material fiscal use",
				evidenceIds: [evidenceId],
			},
			{
				id: "advisory-only",
				label: "Advisory only",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "explain-risk does not approve, post, or submit fiscal state",
				evidenceIds: [evidenceId],
			},
		],
		approval: { required: false, status: "not_required", summary: "Risk explanation is advisory until promoted to an approval request" },
		diff: { kind: "risk_profile", summary: "Risk explanation prepared without changing fiscal state", after: { explainedRiskId: evidenceId } },
		trace: { traceId: input.traceId, caseId: input.caseId, createdAt: new Date().toISOString() },
	});
}
