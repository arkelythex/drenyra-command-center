/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import { RUC } from "../value-objects/RUC";
import type {
	ApprovalStatus,
	FiscalCaseStatus,
	FiscalRiskLevel,
	FiscalScope,
} from "./types";

export const DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY =
	"drenyra.fiscal-work.inspect" as const;

export type DrenyraFiscalWorkInspectStatus = "success" | "denied" | "not_found";
export type DrenyraFiscalWorkInspectReason =
	| "ALLOWED"
	| "MISSING_SCOPE"
	| "INVALID_SCOPE"
	| "CAPABILITY_DENIED"
	| "WORK_ITEM_NOT_FOUND_OR_OUT_OF_SCOPE";

export interface DrenyraFiscalWorkInspectScope extends Required<FiscalScope> {
	actorId: string;
}

export interface DrenyraFiscalWorkInspectRequest {
	scope: DrenyraFiscalWorkInspectScope;
	workItemId: string;
	grantedCapabilities: readonly string[];
}

export interface DrenyraFiscalWorkInspectData {
	workItemId: string;
	workItemStatus: FiscalCaseStatus;
	riskLevel: FiscalRiskLevel;
	evidenceRefs: readonly string[];
	proposalOrApprovalState?: ApprovalStatus;
	accountantSummary: string;
}

export interface DrenyraFiscalWorkInspectResult {
	status: DrenyraFiscalWorkInspectStatus;
	reason: DrenyraFiscalWorkInspectReason;
	traceId: string;
	capability: typeof DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY;
	workItemId?: string;
	data?: DrenyraFiscalWorkInspectData;
	redactedDetail: string;
}

export function validateDrenyraFiscalWorkInspectRequest(
	request: DrenyraFiscalWorkInspectRequest,
): DrenyraFiscalWorkInspectReason {
	const { scope } = request;
	if (
		!scope.organizationId.trim() ||
		!scope.companyId.trim() ||
		!scope.companyRuc.trim() ||
		!scope.period.trim() ||
		!scope.actorId.trim() ||
		!request.workItemId.trim()
	) {
		return "MISSING_SCOPE";
	}
	if (
		!RUC.isValid(scope.companyRuc) ||
		!/^\d{4}-(0[1-9]|1[0-2])$/.test(scope.period)
	) {
		return "INVALID_SCOPE";
	}
	if (
		!request.grantedCapabilities.includes(
			DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
		)
	) {
		return "CAPABILITY_DENIED";
	}
	return "ALLOWED";
}
