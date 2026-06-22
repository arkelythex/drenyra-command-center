/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { DRENYRA_IDEMPOTENCY_HEADER } from "@arkelythex/domain/drenyra";
import { t } from "elysia";
import { fail } from "../shared/api-response";

export function readIdempotencyKey(
	headers: Record<string, string | undefined>,
	body: { idempotencyKey?: string } = {},
): string | undefined {
	return body.idempotencyKey?.trim() || headers[DRENYRA_IDEMPOTENCY_HEADER]?.trim() || undefined;
}

export function commandCenterError(error: unknown) {
	if (error instanceof Error) {
		if (error.message.endsWith("_NOT_FOUND")) return fail(error.message, "NOT_FOUND");
		if (
			error.message === "APPROVAL_ALREADY_DECIDED" ||
			error.message === "FISCAL_CASE_STATUS_UNCHANGED"
		) {
			return fail(error.message, "CONFLICT");
		}
		return fail(error.message, "DRENYRA_COMMAND_CENTER_ERROR");
	}
	return fail("Unknown Drenyra command center error", "DRENYRA_COMMAND_CENTER_ERROR");
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
