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

export interface ProposeLedgerEntryCommandInput
	extends CommandEnvelopeInputBase {
	approvalId: string;
	ledgerDraftId?: string;
	gloss?: string;
	lines?: Array<{
		accountId: string;
		description?: string;
		debit: number;
		credit: number;
	}>;
}

export function createProposeLedgerEntryCommandEnvelope(
	context: DrenyraActorContext,
	input: ProposeLedgerEntryCommandInput,
): DrenyraCommandEnvelope {
	const evidenceId = input.ledgerDraftId
		? `ledger-draft-${input.ledgerDraftId}`
		: "ledger-entry-proposal-draft";
	const proposedLines = input.lines ?? [];
	const totalDebit = proposedLines.reduce((sum, line) => sum + line.debit, 0);
	const totalCredit = proposedLines.reduce((sum, line) => sum + line.credit, 0);

	return createDrenyraCommandEnvelope({
		commandId: DRENYRA_COMMAND_ID.PROPOSE_LEDGER_ENTRY,
		status: DRENYRA_COMMAND_STATUS.NEEDS_APPROVAL,
		scope: toDrenyraCommandScope(context),
		title: "Propose ledger entry",
		summary:
			input.gloss ?? "Ledger entry proposal prepared for fiscal approval",
		riskLevel: "HIGH",
		evidence: [
			{
				id: evidenceId,
				type: "LEDGER_ENTRY",
				title: "Proposed ledger entry draft",
				...(input.sourceRef !== undefined
					? { sourceRef: input.sourceRef }
					: {}),
			},
		],
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
				summary:
					"propose-ledger-entry does not post accounting state or submit to SUNAT",
				evidenceIds: [evidenceId],
			},
			{
				id: "balanced-entry",
				label: "Debit/credit balance",
				status:
					Math.abs(totalDebit - totalCredit) < 0.01
						? DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED
						: DRENYRA_DETERMINISTIC_CHECK_STATUS.FAILED,
				summary:
					Math.abs(totalDebit - totalCredit) < 0.01
						? "Proposal is balanced"
						: `Unbalanced proposal: debit ${totalDebit} vs credit ${totalCredit}`,
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
			before: { status: "none" },
			after: {
				proposedLedgerEntryId: evidenceId,
				gloss: input.gloss,
				lines: proposedLines,
				totalDebit,
				totalCredit,
			},
		},
		trace: {
			traceId: input.traceId,
			...(input.caseId !== undefined ? { caseId: input.caseId } : {}),
			createdAt: new Date().toISOString(),
		},
	});
}
