/**
 * Documents this Drenyra/Fiscal public module as part of the governed PR delta.
 *
 * @example Preserve tenant, company RUC and fiscal-period scope before invoking this module.
 * @example Keep fiscal evidence append-only and auditable when wiring this module into routes.
 * @example Prefer typed command envelopes instead of raw objects at API, Web and CLI boundaries.
 * @example Deny capability-gated operations by default unless governance headers prove scope.
 * @example Add focused tests when changing this module's fiscal behavior or public contract.
 */
import {
	AGENT_TYPES,
	type DrenyraAgentType,
	EVIDENCE_TYPES,
	type EvidenceType,
	FISCAL_CASE_STATUSES,
	FISCAL_CASE_TYPES,
	type FiscalCaseStatus,
	type FiscalCaseType,
} from "./types";

export const DRENYRA_CONTRACT_VERSION = "2026-05-26.dual-surface.v1" as const;

export const DRENYRA_REQUIRED_SCOPE_HEADERS = [
	"x-organization-id",
	"x-company-id",
	"x-company-ruc",
	"x-fiscal-period",
	"x-user-id",
] as const;

export type DrenyraRequiredScopeHeader =
	(typeof DRENYRA_REQUIRED_SCOPE_HEADERS)[number];

export const DRENYRA_IDEMPOTENCY_HEADER = "x-idempotency-key" as const;

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
] as const;

export type DrenyraSseEventType = (typeof DRENYRA_SSE_EVENT_TYPES)[number];

export type DrenyraSurface = "api" | "web" | "cli" | "tui" | "automation";

export type DrenyraOfflineCommandKind =
	| "CREATE_FISCAL_CASE"
	| "ADD_EVIDENCE"
	| "START_AGENT_RUN"
	| "REQUEST_APPROVAL"
	| "DECIDE_APPROVAL";

export interface DrenyraCommandEnvelope<
	TPayload extends Record<string, unknown> = Record<string, unknown>,
> {
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
		"redactionRequired",
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

export function buildDrenyraDualSurfaceContract(): DrenyraDualSurfaceContract {
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
