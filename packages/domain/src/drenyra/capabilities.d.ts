import { type DrenyraCapabilityEvaluation, type DrenyraCapabilityGrant, type DrenyraCapabilityPolicy, type DrenyraCapabilityRequest } from "./capability-types";
import type { DrenyraFiscalScope } from "./types";
export * from "./capability-policies";
export * from "./capability-types";
export declare function evaluateDrenyraCapability(input: {
    request: DrenyraCapabilityRequest;
    grants: readonly DrenyraCapabilityGrant[];
    policies?: readonly DrenyraCapabilityPolicy[];
}): DrenyraCapabilityEvaluation;
export declare function isCompleteDrenyraCapabilityScope(scope: DrenyraFiscalScope): boolean;
export declare function isSameDrenyraCapabilityScope(left: DrenyraFiscalScope, right: DrenyraFiscalScope): boolean;
//# sourceMappingURL=capabilities.d.ts.map