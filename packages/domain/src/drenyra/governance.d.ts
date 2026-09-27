import type { FiscalScope } from "./types";
export declare const DRENYRA_TOOL_RISK_LEVELS: readonly ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
export type DrenyraToolRiskLevel = (typeof DRENYRA_TOOL_RISK_LEVELS)[number];
export declare const DRENYRA_TOOL_APPROVAL_LEVELS: readonly ["auto", "notify", "gate", "fiscal_gate"];
export type DrenyraToolApprovalLevel = (typeof DRENYRA_TOOL_APPROVAL_LEVELS)[number];
export interface DrenyraToolCapabilityManifest {
    toolName: string;
    capability: string;
    riskLevel: DrenyraToolRiskLevel;
    approvalLevel: DrenyraToolApprovalLevel;
    allowedScopes: readonly FiscalScope[];
    redactionRequired: boolean;
}
export interface DrenyraToolGovernanceRequest {
    manifest?: DrenyraToolCapabilityManifest;
    scope: FiscalScope;
    hasHumanApproval: boolean;
    redactionStatus: "passed" | "failed" | "not_required";
}
export interface DrenyraToolGovernanceDecision {
    allowed: boolean;
    reason: "TOOL_NOT_REGISTERED" | "SCOPE_NOT_ALLOWED" | "HUMAN_APPROVAL_REQUIRED" | "REDACTION_FAILED" | "ALLOWED";
}
export declare function evaluateDrenyraToolGovernance(request: DrenyraToolGovernanceRequest): DrenyraToolGovernanceDecision;
//# sourceMappingURL=governance.d.ts.map