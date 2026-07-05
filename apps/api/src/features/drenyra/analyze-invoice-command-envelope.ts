import {
	DRENYRA_COMMAND_ID,
	DRENYRA_COMMAND_STATUS,
	DRENYRA_DETERMINISTIC_CHECK_STATUS,
	createDrenyraCommandEnvelope,
	type DrenyraCommandEnvelope,
} from "../../../../../packages/domain/src/drenyra/command-envelope";
import type { DrenyraActorContext } from "@drenyra/application/drenyra";
import { toDrenyraCommandScope, type CommandEnvelopeInputBase } from "./command-envelope.shared";

export interface AnalyzeInvoiceCommandInput extends CommandEnvelopeInputBase {
	invoiceId?: string;
}

export function createAnalyzeInvoiceCommandEnvelope(
	context: DrenyraActorContext,
	input: AnalyzeInvoiceCommandInput,
): DrenyraCommandEnvelope {
	const evidenceId = input.invoiceId ? `invoice-${input.invoiceId}` : "invoice-analysis-draft";
	return createDrenyraCommandEnvelope({
		commandId: DRENYRA_COMMAND_ID.ANALYZE_INVOICE,
		status: DRENYRA_COMMAND_STATUS.READY,
		scope: toDrenyraCommandScope(context),
		title: "Analyze invoice",
		summary: "Invoice analysis envelope prepared for fiscal review",
		riskLevel: "MEDIUM",
		evidence: [{ id: evidenceId, type: "DOCUMENT", title: "Invoice analysis source document", sourceRef: input.sourceRef }],
		deterministicChecks: [
			{
				id: "invoice-scope",
				label: "Invoice scope",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.PASSED,
				summary: "Invoice analysis is locked to company RUC and fiscal period",
				evidenceIds: [evidenceId],
			},
			{
				id: "cpe-review-ready",
				label: "CPE review ready",
				status: DRENYRA_DETERMINISTIC_CHECK_STATUS.WARNING,
				summary: "Invoice requires deterministic CPE/UBL validation before material use",
				evidenceIds: [evidenceId],
			},
		],
		approval: { required: false, status: "not_required", summary: "Invoice analysis is advisory and does not create ledger entries" },
		diff: { kind: "risk_profile", summary: "Draft invoice risk profile prepared without changing fiscal state", after: { analyzedInvoiceId: evidenceId } },
		trace: { traceId: input.traceId, caseId: input.caseId, createdAt: new Date().toISOString() },
	});
}
