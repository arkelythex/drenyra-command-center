import type { DrenyraActorContext } from "@drenyra/application/drenyra";
import { t } from "elysia";
import { fail } from "../shared/api-response";

export type DrenyraActorContextResolution =
	| { ok: true; context: DrenyraActorContext }
	| { ok: false; missingHeaders: string[] };

export type ResolveDrenyraActorContext = (
	headers: Record<string, string | undefined>,
) => DrenyraActorContextResolution;

export function drenyraActorContextFailure(missingHeaders: string[]) {
	return fail(
		"Drenyra command center requests require company, RUC, fiscal period and user headers",
		"TENANT_CONTEXT_REQUIRED",
		{ details: { missingHeaders } },
	);
}

export function commandCenterError(error: unknown) {
	if (error instanceof Error) {
		if (error.message.endsWith("_NOT_FOUND"))
			return fail(error.message, "NOT_FOUND");
		if (
			error.message === "APPROVAL_ALREADY_DECIDED" ||
			error.message === "FISCAL_CASE_STATUS_UNCHANGED"
		) {
			return fail(error.message, "CONFLICT");
		}
		return fail(error.message, "DRENYRA_COMMAND_CENTER_ERROR");
	}
	return fail(
		"Unknown Drenyra command center error",
		"DRENYRA_COMMAND_CENTER_ERROR",
	);
}

export function statusForCaseMutationError(error: unknown): 400 | 404 {
	return error instanceof Error && error.message.endsWith("_NOT_FOUND")
		? 404
		: 400;
}

export function statusForStatusMutationError(error: unknown): 400 | 404 | 409 {
	if (!(error instanceof Error)) return 400;
	if (error.message.endsWith("_NOT_FOUND")) return 404;
	return error.message === "FISCAL_CASE_STATUS_UNCHANGED" ? 409 : 400;
}

export function statusForApprovalDecisionError(error: unknown): 404 | 409 {
	return error instanceof Error && error.message === "APPROVAL_ALREADY_DECIDED"
		? 409
		: 404;
}

export const fiscalCaseTypeSchema = t.Union([
	t.Literal("MONTHLY_CLOSE"),
	t.Literal("CPE_REVIEW"),
	t.Literal("SIRE_REVIEW"),
	t.Literal("LEDGER_REVIEW"),
	t.Literal("CONCILIATION"),
	t.Literal("EVIDENCE_REVIEW"),
]);

export const manualFiscalCaseStatusSchema = t.Union([
	t.Literal("OPEN"),
	t.Literal("IN_REVIEW"),
	t.Literal("RESOLVED"),
	t.Literal("ARCHIVED"),
]);

export const fiscalRiskLevelSchema = t.Union([
	t.Literal("LOW"),
	t.Literal("MEDIUM"),
	t.Literal("HIGH"),
	t.Literal("CRITICAL"),
]);

export const autonomyLevelSchema = t.Union([
	t.Literal("ADVISORY"),
	t.Literal("DRAFT_ONLY"),
	t.Literal("PREPARE_WITH_APPROVAL"),
	t.Literal("EXECUTE_AFTER_APPROVAL"),
]);

export const evidenceTypeSchema = t.Union([
	t.Literal("DOCUMENT"),
	t.Literal("SUNAT_RECORD"),
	t.Literal("LEDGER_ENTRY"),
	t.Literal("BANK_STATEMENT"),
	t.Literal("USER_NOTE"),
	t.Literal("AGENT_OUTPUT"),
]);

export const drenyraAgentTypeSchema = t.Union([
	t.Literal("CPE_AGENT"),
	t.Literal("SIRE_AGENT"),
	t.Literal("LEDGER_AGENT"),
	t.Literal("CONCILIATION_AGENT"),
	t.Literal("FISCAL_REVIEWER_AGENT"),
	t.Literal("EVIDENCE_AGENT"),
]);

export const metadataSchema = t.Optional(t.Record(t.String(), t.Unknown()));
