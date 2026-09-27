export type ApprovalLevel = "R0" | "R1" | "R2" | "R3";
export declare const APPROVAL_LEVEL_ORDER: Record<ApprovalLevel, number>;
export declare function compareApprovalLevel(a: ApprovalLevel, b: ApprovalLevel): number;
export declare function requiresHumanApproval(level: ApprovalLevel): boolean;
export declare function requiresGovernanceBundle(level: ApprovalLevel): boolean;
export interface ApprovalRequirement {
    level: ApprovalLevel;
    allowedReviewers: readonly string[];
    requiresGovernanceBundle: boolean;
    requiresHumanApproval: boolean;
    requiredContext?: readonly string[];
}
export interface ApprovalPolicy {
    getRequirement(capabilityId: string): ApprovalRequirement;
    setRequirement(capabilityId: string, requirement: ApprovalRequirement): void;
}
//# sourceMappingURL=approval-policy.d.ts.map