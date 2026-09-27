import type { PermissionService } from "../governance/permission-service";
import type { AgentRegistry } from "./agent-registry";
import type { GovernanceBundleResult, TenantCompanyRucScope, ToolActionInput } from "./contracts";
import type { FiscalPolicyInput, FiscalPolicyResult } from "./fiscal-policy.types";
import type { ToolRegistry } from "./tool-registry";
import type { TraceEvidenceStore } from "./trace-evidence";
export interface PolicyEvaluationInput {
    traceId: string;
    agentId: string;
    requestedScope: TenantCompanyRucScope;
    requestedCapability: string;
    requestedTool: string;
    action: "read" | "write" | "execute" | "admin";
    evidence?: Record<string, unknown>;
    fiscalPolicy?: Partial<Omit<FiscalPolicyInput, "traceId" | "toolName" | "action">>;
}
export interface PolicyEngineResult {
    allowed: boolean;
    violations: string[];
    evidenceRefs: string[];
    fiscalPolicy?: FiscalPolicyResult;
}
export declare class PolicyEngine {
    private agentRegistry;
    private toolRegistry;
    private evidenceStore;
    private permissionService?;
    constructor(agentRegistry: AgentRegistry, toolRegistry: ToolRegistry, evidenceStore: TraceEvidenceStore, permissionService?: PermissionService | undefined);
    getPermissionService(): PermissionService | undefined;
    evaluate(input: PolicyEvaluationInput): Promise<GovernanceBundleResult>;
    evaluateToolAction(input: ToolActionInput): Promise<GovernanceBundleResult>;
    private evaluateInternal;
    private persistEvidence;
    private buildRationale;
    private buildDenied;
}
//# sourceMappingURL=policy-engine.d.ts.map