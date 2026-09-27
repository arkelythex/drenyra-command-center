import type { ApprovalStatus, FiscalCaseStatus, FiscalRiskLevel, FiscalScope } from "./types";
export declare const DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY: "drenyra.fiscal-work.inspect";
export type DrenyraFiscalWorkInspectStatus = "success" | "denied" | "not_found";
export type DrenyraFiscalWorkInspectReason = "ALLOWED" | "MISSING_SCOPE" | "INVALID_SCOPE" | "CAPABILITY_DENIED" | "WORK_ITEM_NOT_FOUND_OR_OUT_OF_SCOPE";
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
export declare function validateDrenyraFiscalWorkInspectRequest(request: DrenyraFiscalWorkInspectRequest): DrenyraFiscalWorkInspectReason;
//# sourceMappingURL=fiscal-work-inspect.d.ts.map