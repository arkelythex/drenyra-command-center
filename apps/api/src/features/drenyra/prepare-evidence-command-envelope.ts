import type { DrenyraActorContext } from "@drenyra/application/drenyra";
import {
	createDrenyraCommandEnvelope,
	DRENYRA_COMMAND_ID,
	DRENYRA_COMMAND_STATUS,
	DRENYRA_DETERMINISTIC_CHECK_STATUS,
	type DrenyraCommandEnvelope,
} from "../../../../../packages/domain/src/drenyra/command-envelope";
import {
	type CommandEnvelopeInputBase,
	toDrenyraCommandScope,
} from "./command-envelope.shared";

export interface PrepareEvidenceCommandInput extends CommandEnvelopeInputBase {
	documentId?: string;
}

export function createPrepareEvidenceCommandEnvelope(
	context: DrenyraActorContext,
	input: PrepareEvidenceCommandInput,
): DrenyraCommandEnvelope {
	const evidenceId = input.documentId
		? `document-${input.documentId}`
		: "evidence-bundle-draft";
	return createDrenyraCommandEnvelope({
		commandId: DRENYRA_COMMAND_ID.PREPARE_EVIDENCE,
		status: DRENYRA_COMMAND_STATUS.READY,
		scope: toDrenyraCommandScope(context),
		title: "Prepare fiscal evidence",
		summary: "Evidence bundle envelope prepared for fiscal review",
		riskLevel: "LOW",
		evidence: [
			{
				id: evidenceId,
				type: "DOCUMENT",
				title: "Fiscal evidence bundle draft",
				sourceRef: input.sourceRef,
			},
		],
		deterministicChecks: [
			{
				id: "evidence-scope",
				label: "Evidence scope",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "Evidence bundle is locked to company RUC and fiscal period",
				evidenceIds: [evidenceId],
			},
			{
				id: "mutation-check",
				label: "No material mutation",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "prepare-evidence does not post ledger or submit to SUNAT",
				evidenceIds: [evidenceId],
			},
		],
		approval: {
			required: false,
			status: "not_required",
			summary:
				"Evidence preparation is advisory until attached to an approval request",
		},
		diff: {
			kind: "evidence_bundle",
			summary: "Draft evidence bundle prepared without changing fiscal state",
			after: { preparedEvidenceId: evidenceId },
		},
		trace: {
			traceId: input.traceId,
			caseId: input.caseId,
			createdAt: new Date().toISOString(),
		},
	});
}
