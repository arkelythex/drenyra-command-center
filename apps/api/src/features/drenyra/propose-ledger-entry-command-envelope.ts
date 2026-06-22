import {
	DRENYRA_COMMAND_ID,
	DRENYRA_COMMAND_STATUS,
	DRENYRA_DETERMINISTIC_CHECK_STATUS,
	createDrenyraCommandEnvelope,
	type DrenyraCommandEnvelope,
} from "../../../../../packages/domain/src/drenyra/command-envelope";
import type { DrenyraActorContext } from "@arkelythex/application/drenyra";
import { toDrenyraCommandScope, type CommandEnvelopeInputBase } from "./command-envelope.shared";

export interface ProposeLedgerEntryCommandInput extends CommandEnvelopeInputBase {
	approvalId: string;
	ledgerDraftId?: string;
}

export function createProposeLedgerEntryCommandEnvelope(
	context: DrenyraActorContext,
	input: ProposeLedgerEntryCommandInput,
): DrenyraCommandEnvelope {
	const evidenceId = input.ledgerDraftId ? `ledger-draft-${input.ledgerDraftId}` : "ledger-entry-proposal-draft";
	return createDrenyraCommandEnvelope({
		commandId: DRENYRA_COMMAND_ID.PROPOSE_LEDGER_ENTRY,
		status: DRENYRA_COMMAND_STATUS.NEEDS_APPROVAL,
		scope: toDrenyraCommandScope(context),
		title: "Propose ledger entry",
		summary: "Ledger entry proposal prepared for fiscal approval",
		riskLevel: "HIGH",
		evidence: [{ id: evidenceId, type: "LEDGER_ENTRY", title: "Proposed ledger entry draft", sourceRef: input.sourceRef }],
		deterministicChecks: [
			{
				id: "ledger-scope",
				label: "Ledger proposal scope",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "Ledger proposal is locked to company RUC and fiscal period",
				evidenceIds: [evidenceId],
			},
			{
				id: "posting-blocked",
				label: "Posting blocked",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "propose-ledger-entry does not post accounting state or submit to SUNAT",
				evidenceIds: [evidenceId],
			},
		],
		approval: {
			required: true,
			approvalId: input.approvalId,
			status: "pending",
			summary: "Fiscal reviewer approval is required before any ledger posting",
		},
		diff: {
			kind: "ledger_entry",
			summary: "Ledger entry draft proposed without posting fiscal state",
			after: { proposedLedgerEntryId: evidenceId },
		},
		trace: { traceId: input.traceId, caseId: input.caseId, createdAt: new Date().toISOString() },
	});
}
