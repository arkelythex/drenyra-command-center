export type VerificationStatus = "pass" | "fail" | "inconclusive" | "bypassed";
export interface VerifiedFindingBase {
    finding: string;
    status: Exclude<VerificationStatus, "bypassed">;
    rule: string;
    expected?: string;
    actual?: string;
    detail?: string;
}
export interface BypassedFinding {
    finding: string;
    status: "bypassed";
    rule: "NO_RULE_MATCHED";
    bypassReason: "qualitative_finding" | "unsupported_pattern" | "insufficient_context" | "human_reviewed_acceptable";
    authorizedBy: {
        userId: string;
        role: string;
    };
    detail: string;
}
export type VerifiedFinding = VerifiedFindingBase | BypassedFinding;
export interface VerificationAuditEvent {
    eventType: "VERIFICATION_BYPASSED" | "VERIFICATION_FAIL";
    finding: string;
    rule: string;
    reason: string;
    actorId: string;
    occurredAt: string;
    detail?: string;
}
export interface VerificationReport {
    id: string;
    verifiedAt: string;
    adjustedConfidence: number;
    findings: VerifiedFinding[];
    auditEvents: VerificationAuditEvent[];
    integrityScore: number;
    summary: string;
    metrics: VerificationMetrics;
}
export interface VerificationMetrics {
    totalFindings: number;
    passed: number;
    failed: number;
    inconclusive: number;
    bypassed: number;
    integrityScore: number;
    perRuleMetrics: Record<string, {
        passed: number;
        failed: number;
        inconclusive: number;
        total: number;
    }>;
}
//# sourceMappingURL=verification-types.d.ts.map