import { type DrenyraCapabilityEvaluation, type DrenyraCapabilityPolicy, type DrenyraCapabilityRequest } from "./capability-types";
export declare const FISCAL_GUARDIAN_DECISION: {
    readonly AUTO_ALLOW: "auto_allow";
    readonly REQUIRE_HUMAN: "require_human";
    readonly DENY: "deny";
};
export type FiscalGuardianDecision = (typeof FISCAL_GUARDIAN_DECISION)[keyof typeof FISCAL_GUARDIAN_DECISION];
export interface FiscalGuardianInput {
    capabilityEvaluation: DrenyraCapabilityEvaluation;
    request: DrenyraCapabilityRequest;
    policy: DrenyraCapabilityPolicy;
    materialityScore?: number;
}
export interface FiscalGuardianResult {
    decision: FiscalGuardianDecision;
    reason: string;
    auditEventType: "GUARDIAN_AUTO_ALLOWED" | "GUARDIAN_REQUIRE_HUMAN" | "GUARDIAN_DENIED";
}
export declare function evaluateFiscalGuardian(input: FiscalGuardianInput): FiscalGuardianResult;
//# sourceMappingURL=guardian-policies.d.ts.map