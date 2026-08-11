import type {
	DrenyraActorContext,
	DrenyraFiscalCommandCenterService,
} from "@drenyra/application/drenyra";
import { Elysia, t } from "elysia";
import { fail } from "../shared/api-response";
import {
	createAnalyzeInvoiceCommandEnvelope,
	createExplainRiskCommandEnvelope,
	createPrepareEvidenceCommandEnvelope,
	createProposeLedgerEntryCommandEnvelope,
	createReviewSunatCommandEnvelope,
} from "./command-envelope";
import {
	listCommandEnvelopeAuditEvents,
	recordCommandEnvelopeCapability,
} from "./drenyra-command-envelope-audit";
import {
	type CapabilityAuditInput,
	guardedEnvelope,
} from "./drenyra-command-envelope-route-guards";

const optionalRef = t.Optional(t.String({ minLength: 1 }));
type ExplainRiskBody = {
	caseId?: string;
	riskRef?: string;
	sourceRef?: string;
};

async function verifyExplainRiskSource(
	commandCenter: DrenyraFiscalCommandCenterService,
	context: DrenyraActorContext,
	body: ExplainRiskBody,
): Promise<boolean> {
	if (!body.caseId) return !body.riskRef && !body.sourceRef;
	const details = await commandCenter.getFiscalCaseDetails(
		context,
		body.caseId,
	);
	if (!details) return false;
	const riskMatches =
		!body.riskRef || details.case.metadata.riskRef === body.riskRef;
	const sourceMatches =
		!body.sourceRef ||
		details.evidence.some((item) => item.sourceRef === body.sourceRef);
	return riskMatches && sourceMatches;
}

export function createDrenyraCommandEnvelopeRoutes(
	commandCenter: DrenyraFiscalCommandCenterService,
) {
	const audit = (context: DrenyraActorContext, input: CapabilityAuditInput) =>
		recordCommandEnvelopeCapability(commandCenter, context, input);
	return new Elysia({ prefix: "/commands" })
		.get(
			"/audit-events",
			({ query, headers, set }) =>
				guardedEnvelope(
					set,
					headers,
					"FISCAL_REVIEWER_AGENT",
					"list_fiscal_cases",
					{
						...(query.caseId !== undefined ? { auditCaseId: query.caseId } : {}),
						commandId: "command-audit-events",
						createEnvelope: (context) =>
							listCommandEnvelopeAuditEvents(commandCenter, context, {
								...(query.caseId !== undefined ? { caseId: query.caseId } : {}),
								...(query.commandId !== undefined ? { commandId: query.commandId } : {}),
								...(query.eventType !== undefined ? { eventType: query.eventType } : {}),
							}),
						onCapabilityEvaluated: audit,
					},
				),
			{
				query: t.Object({
					caseId: optionalRef,
					commandId: optionalRef,
					eventType: t.Optional(
						t.Union([
							t.Literal("CAPABILITY_ALLOWED"),
							t.Literal("CAPABILITY_DENIED"),
						]),
					),
				}),
			},
		)
		.post(
			"/review-sunat",
			({ body, headers, set }) =>
				guardedEnvelope(set, headers, "SIRE_AGENT", "run_agent_review", {
					...(body.caseId !== undefined ? { auditCaseId: body.caseId } : {}),
					commandId: "review-sunat",
					createEnvelope: (context, traceId) =>
						createReviewSunatCommandEnvelope(context, {
							...(body.caseId !== undefined ? { caseId: body.caseId } : {}),
							...(body.sourceRef !== undefined ? { sourceRef: body.sourceRef } : {}),
							traceId,
						}),
					onCapabilityEvaluated: audit,
				}),
			{ body: t.Object({ caseId: optionalRef, sourceRef: optionalRef }) },
		)
		.post(
			"/prepare-evidence",
			({ body, headers, set }) =>
				guardedEnvelope(set, headers, "EVIDENCE_AGENT", "explain_evidence", {
					...(body.caseId !== undefined ? { auditCaseId: body.caseId } : {}),
					commandId: "prepare-evidence",
					createEnvelope: (context, traceId) =>
						createPrepareEvidenceCommandEnvelope(context, {
							...(body.caseId !== undefined ? { caseId: body.caseId } : {}),
							...(body.documentId !== undefined ? { documentId: body.documentId } : {}),
							...(body.sourceRef !== undefined ? { sourceRef: body.sourceRef } : {}),
							traceId,
						}),
					onCapabilityEvaluated: audit,
				}),
			{
				body: t.Object({
					caseId: optionalRef,
					documentId: optionalRef,
					sourceRef: optionalRef,
				}),
			},
		)
		.post(
			"/analyze-invoice",
			({ body, headers, set }) =>
				guardedEnvelope(set, headers, "CPE_AGENT", "validate_cpe", {
					...(body.caseId !== undefined ? { auditCaseId: body.caseId } : {}),
					commandId: "analyze-invoice",
					createEnvelope: (context, traceId) =>
						createAnalyzeInvoiceCommandEnvelope(context, {
							...(body.caseId !== undefined ? { caseId: body.caseId } : {}),
							...(body.invoiceId !== undefined ? { invoiceId: body.invoiceId } : {}),
							...(body.sourceRef !== undefined ? { sourceRef: body.sourceRef } : {}),
							traceId,
						}),
					onCapabilityEvaluated: audit,
				}),
			{
				body: t.Object({
					caseId: optionalRef,
					invoiceId: optionalRef,
					sourceRef: optionalRef,
				}),
			},
		)
		.post(
			"/explain-risk",
			({ body, headers, set }) =>
				guardedEnvelope(set, headers, "FISCAL_REVIEWER_AGENT", "explain_risk", {
					...(body.caseId !== undefined ? { auditCaseId: body.caseId } : {}),
					commandId: "explain-risk",
					createEnvelope: async (context, traceId) => {
						const sourceScopeVerified = await verifyExplainRiskSource(
							commandCenter,
							context,
							body,
						);
						if (
							!sourceScopeVerified &&
							(body.caseId || body.riskRef || body.sourceRef)
						) {
							set.status = 404;
							return fail(
								"Explain-risk source is outside fiscal scope",
								"DRENYRA_RISK_SOURCE_NOT_FOUND",
							);
						}
						return createExplainRiskCommandEnvelope(context, {
							...(body.caseId !== undefined ? { caseId: body.caseId } : {}),
							...(body.riskRef !== undefined ? { riskRef: body.riskRef } : {}),
							...(body.sourceRef !== undefined ? { sourceRef: body.sourceRef } : {}),
							sourceScopeVerified,
							traceId,
						});
					},
					onCapabilityEvaluated: audit,
				}),
			{
				body: t.Object({
					caseId: optionalRef,
					riskRef: optionalRef,
					sourceRef: optionalRef,
				}),
			},
		)
		.post(
			"/propose-ledger-entry",
			({ body, headers, set }) =>
				guardedEnvelope(set, headers, "LEDGER_AGENT", "propose_ledger_entry", {
					approvalId: body.approvalId,
					...(body.caseId !== undefined ? { auditCaseId: body.caseId } : {}),
					commandId: "propose-ledger-entry",
					createEnvelope: (context, traceId) =>
						createProposeLedgerEntryCommandEnvelope(context, {
							approvalId: body.approvalId,
							...(body.caseId !== undefined ? { caseId: body.caseId } : {}),
							...(body.ledgerDraftId !== undefined ? { ledgerDraftId: body.ledgerDraftId } : {}),
							...(body.sourceRef !== undefined ? { sourceRef: body.sourceRef } : {}),
							traceId,
						}),
					onCapabilityEvaluated: audit,
				}),
			{
				body: t.Object({
					approvalId: t.String({ minLength: 1 }),
					caseId: optionalRef,
					ledgerDraftId: optionalRef,
					sourceRef: optionalRef,
				}),
			},
		);
}
