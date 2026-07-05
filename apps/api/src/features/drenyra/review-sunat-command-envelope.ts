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

export type ReviewSunatCommandInput = CommandEnvelopeInputBase;

export function createReviewSunatCommandEnvelope(
	context: DrenyraActorContext,
	input: ReviewSunatCommandInput,
): DrenyraCommandEnvelope {
	const evidenceId = input.caseId
		? `sunat-${input.caseId}`
		: "sunat-review-snapshot";
	return createDrenyraCommandEnvelope({
		commandId: DRENYRA_COMMAND_ID.REVIEW_SUNAT,
		status: DRENYRA_COMMAND_STATUS.READY,
		scope: toDrenyraCommandScope(context),
		title: "SUNAT fiscal review",
		summary: "Scoped SUNAT review envelope prepared for CLI/Web rendering",
		riskLevel: "MEDIUM",
		evidence: [
			{
				id: evidenceId,
				type: "SUNAT_RECORD",
				title: "SUNAT scoped review snapshot",
				sourceRef: input.sourceRef,
			},
		],
		deterministicChecks: [
			{
				id: "ruc-checksum",
				label: "RUC checksum",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "Company RUC passed canonical módulo 11 validation",
				evidenceIds: [evidenceId],
			},
			{
				id: "period-scope",
				label: "Fiscal period scope",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "Fiscal period is locked to the request scope",
				evidenceIds: [evidenceId],
			},
		],
		approval: {
			required: false,
			status: "not_required",
			summary: "Review envelope is advisory and does not submit to SUNAT",
		},
		diff: {
			kind: "none",
			summary: "No fiscal state mutation proposed by review-sunat",
		},
		trace: {
			traceId: input.traceId,
			caseId: input.caseId,
			createdAt: new Date().toISOString(),
		},
	});
}
