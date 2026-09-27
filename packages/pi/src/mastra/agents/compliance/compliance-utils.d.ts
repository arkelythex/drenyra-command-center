import type { ComplianceContext, ComplianceFinding, ComplianceSeverity } from "./compliance.types";
export declare function assertScopedContext(context: ComplianceContext): void;
export declare function createFinding(input: {
    readonly severity: ComplianceSeverity;
    readonly category: string;
    readonly message: string;
    readonly evidenceRefs?: readonly string[];
    readonly recommendedAction: string;
    readonly requiresApproval?: boolean;
}): ComplianceFinding;
export declare function riskScoreFromFindings(findings: readonly ComplianceFinding[]): number;
export declare function pickComplianceContext(input: {
    readonly payload?: Record<string, unknown>;
    readonly metadata?: Record<string, unknown>;
    readonly traceId?: string;
}): ComplianceContext;
export declare function requireComplianceScope(input: {
    readonly payload?: Record<string, unknown>;
    readonly metadata?: Record<string, unknown>;
    readonly traceId?: string;
}): ComplianceContext;
export declare function readRecord(value: unknown): Record<string, unknown> | undefined;
export declare function readString(value: unknown): string | undefined;
export declare function readStringArray(value: unknown): string[];
export declare function stableHash(value: string): string;
//# sourceMappingURL=compliance-utils.d.ts.map