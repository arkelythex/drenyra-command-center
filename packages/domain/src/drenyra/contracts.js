import { AGENT_TYPES, EVIDENCE_TYPES, FISCAL_CASE_STATUSES, FISCAL_CASE_TYPES, } from "./types";
export const DRENYRA_CONTRACT_VERSION = "2026-05-26.dual-surface.v1";
export const DRENYRA_REQUIRED_SCOPE_HEADERS = [
    "x-organization-id",
    "x-company-id",
    "x-company-ruc",
    "x-fiscal-period",
    "x-user-id",
];
export const DRENYRA_IDEMPOTENCY_HEADER = "x-idempotency-key";
export const DRENYRA_SSE_EVENT_TYPES = [
    "connected",
    "heartbeat",
    "intent",
    "token",
    "result",
    "snapshot",
    "approval.new",
    "approval.updated",
    "approval.resolved",
    "error",
    "done",
];
export function buildDrenyraDualSurfaceContract() {
    return {
        version: DRENYRA_CONTRACT_VERSION,
        platformCategory: "ai_augmented_fiscal_sovereignty_platform",
        fiscalOntologyVersion: "2026-05.fiscal-ontology.v1",
        sourceOfTruth: "apps/api",
        sharedDomain: "packages/domain/src/drenyra",
        sharedApplication: "packages/application/src/drenyra",
        requiredScopeHeaders: DRENYRA_REQUIRED_SCOPE_HEADERS,
        idempotencyHeader: DRENYRA_IDEMPOTENCY_HEADER,
        allowedFiscalCaseStatuses: FISCAL_CASE_STATUSES,
        allowedFiscalCaseTypes: FISCAL_CASE_TYPES,
        allowedEvidenceTypes: EVIDENCE_TYPES,
        allowedAgentTypes: AGENT_TYPES,
        agentGovernance: {
            denyByDefault: true,
            capabilityManifestFields: [
                "toolName",
                "capability",
                "riskLevel",
                "approvalLevel",
                "allowedScopes",
                "redactionRequired",
            ],
            materialFiscalActionsRequireHumanApproval: true,
            redactionFailureMode: "deny",
        },
        sseEventTypes: DRENYRA_SSE_EVENT_TYPES,
        offlineCommandKinds: [
            "CREATE_FISCAL_CASE",
            "ADD_EVIDENCE",
            "START_AGENT_RUN",
            "REQUEST_APPROVAL",
            "DECIDE_APPROVAL",
        ],
        endpoints: [
            {
                method: "GET",
                path: "/api/drenyra/contract",
                idempotentReplay: true,
                cliParity: "required",
                webParity: "required",
            },
            {
                method: "GET",
                path: "/api/drenyra/cases",
                idempotentReplay: true,
                cliParity: "required",
                webParity: "required",
            },
            {
                method: "GET",
                path: "/api/drenyra/fiscal-work/:workItemId/inspect",
                idempotentReplay: true,
                cliParity: "required",
                webParity: "required",
            },
            {
                method: "POST",
                path: "/api/drenyra/cases",
                idempotentReplay: true,
                cliParity: "required",
                webParity: "required",
            },
            {
                method: "GET",
                path: "/api/drenyra/brain/threads/:threadId/events",
                idempotentReplay: false,
                cliParity: "required",
                webParity: "required",
                sseEvents: ["heartbeat"],
            },
        ],
        invariants: [
            "API/domain/application are source of truth; CLI and Web are UX adapters.",
            "Every write requires company, RUC, organization, fiscal period and user scope.",
            "Offline CLI writes must replay as command envelopes with idempotency keys; local SQLite is not fiscal source of truth.",
            "Sensitive fiscal execution remains behind human approval and immutable audit events.",
        ],
    };
}
//# sourceMappingURL=contracts.js.map