import { type DrenyraAgentType, type EvidenceType, type FiscalCaseStatus, type FiscalCaseType } from "./types";
export declare const DRENYRA_CONTRACT_VERSION: "2026-05-26.dual-surface.v1";
export declare const DRENYRA_REQUIRED_SCOPE_HEADERS: readonly ["x-organization-id", "x-company-id", "x-company-ruc", "x-fiscal-period", "x-user-id"];
export type DrenyraRequiredScopeHeader = (typeof DRENYRA_REQUIRED_SCOPE_HEADERS)[number];
export declare const DRENYRA_IDEMPOTENCY_HEADER: "x-idempotency-key";
export declare const DRENYRA_SSE_EVENT_TYPES: readonly ["connected", "heartbeat", "intent", "token", "result", "snapshot", "approval.new", "approval.updated", "approval.resolved", "error", "done"];
export type DrenyraSseEventType = (typeof DRENYRA_SSE_EVENT_TYPES)[number];
export type DrenyraSurface = "api" | "web" | "cli" | "tui" | "automation";
export type DrenyraOfflineCommandKind = "CREATE_FISCAL_CASE" | "ADD_EVIDENCE" | "START_AGENT_RUN" | "REQUEST_APPROVAL" | "DECIDE_APPROVAL";
export interface DrenyraCommandEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
    contractVersion: typeof DRENYRA_CONTRACT_VERSION;
    idempotencyKey: string;
    surface: DrenyraSurface;
    kind: DrenyraOfflineCommandKind;
    issuedAt: string;
    scope: {
        organizationId: string;
        companyId: string;
        companyRuc: string;
        period: string;
        countryCode: "PE";
        userId: string;
    };
    payload: TPayload;
}
export interface DrenyraContractEndpoint {
    method: "GET" | "POST" | "PATCH";
    path: string;
    idempotentReplay: boolean;
    cliParity: "required" | "not-applicable";
    webParity: "required" | "not-applicable";
    sseEvents?: DrenyraSseEventType[];
}
export interface DrenyraAgentGovernanceContract {
    denyByDefault: boolean;
    capabilityManifestFields: readonly [
        "toolName",
        "capability",
        "riskLevel",
        "approvalLevel",
        "allowedScopes",
        "redactionRequired"
    ];
    materialFiscalActionsRequireHumanApproval: boolean;
    redactionFailureMode: "deny";
}
export interface DrenyraDualSurfaceContract {
    version: typeof DRENYRA_CONTRACT_VERSION;
    platformCategory: "ai_augmented_fiscal_sovereignty_platform";
    fiscalOntologyVersion: "2026-05.fiscal-ontology.v1";
    sourceOfTruth: "apps/api";
    sharedDomain: "packages/domain/src/drenyra";
    sharedApplication: "packages/application/src/drenyra";
    requiredScopeHeaders: readonly DrenyraRequiredScopeHeader[];
    idempotencyHeader: typeof DRENYRA_IDEMPOTENCY_HEADER;
    allowedFiscalCaseStatuses: readonly FiscalCaseStatus[];
    allowedFiscalCaseTypes: readonly FiscalCaseType[];
    allowedEvidenceTypes: readonly EvidenceType[];
    allowedAgentTypes: readonly DrenyraAgentType[];
    agentGovernance: DrenyraAgentGovernanceContract;
    sseEventTypes: readonly DrenyraSseEventType[];
    offlineCommandKinds: readonly DrenyraOfflineCommandKind[];
    endpoints: readonly DrenyraContractEndpoint[];
    invariants: readonly string[];
}
export declare function buildDrenyraDualSurfaceContract(): DrenyraDualSurfaceContract;
//# sourceMappingURL=contracts.d.ts.map