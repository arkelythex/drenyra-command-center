package harness

// API envelope from Drenyra fiscal-command-center routes.
type APIResponse[T any] struct {
	Success bool   `json:"success"`
	Data    T      `json:"data"`
	Error   string `json:"error,omitempty"`
	Code    string `json:"code,omitempty"`
}

type AgentsListData struct {
	Agents   []string `json:"agents"`
	MaxDepth int      `json:"maxDepth"`
}

type ExecuteRequest struct {
	Task        string         `json:"task"`
	RootAgentID string         `json:"rootAgentId,omitempty"`
	AutoSpawn   bool           `json:"autoSpawn"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type ExecuteResponse struct {
	TraceID          string  `json:"traceId"`
	RootAgentID      string  `json:"rootAgentId"`
	Status           string  `json:"status"`
	Tree             RunNode `json:"tree"`
	ExecutiveSummary string  `json:"executiveSummary"`
	Message          string  `json:"message,omitempty"`
}

type SpawnRequest struct {
	AgentID     string `json:"agentId"`
	Task        string `json:"task"`
	Depth       int    `json:"depth,omitempty"`
	ParentRunID string `json:"parentRunId,omitempty"`
}

type RunNode struct {
	RunID     string      `json:"runId"`
	AgentID   string      `json:"agentId"`
	Depth     int         `json:"depth"`
	Status    string      `json:"status"`
	Result    AgentResult `json:"result"`
	Children  []RunNode   `json:"children"`
	StartedAt string      `json:"startedAt"`
	EndedAt   string      `json:"endedAt"`
}

type AgentResult struct {
	Status           string       `json:"status"`
	ExecutiveSummary string       `json:"executiveSummary"`
	Artifacts        []string     `json:"artifacts"`
	NextRecommended  string       `json:"nextRecommended"`
	Risks            []string     `json:"risks"`
	DelegationDepth  int          `json:"delegationDepth"`
	Spawn            []SpawnChild `json:"spawn,omitempty"`
	RequiresApproval bool         `json:"requiresApproval,omitempty"`
}

type SpawnChild struct {
	AgentID string `json:"agentId"`
	Task    string `json:"task"`
}

type FiscalContext struct {
	OrganizationID string
	CompanyID      string
	CompanyRUC     string
	Period         string
	UserID         string
}

type FiscalScope struct {
	OrganizationID string `json:"organizationId,omitempty"`
	CompanyID      string `json:"companyId"`
	CompanyRUC     string `json:"companyRuc"`
	Period         string `json:"period"`
	CountryCode    string `json:"countryCode"`
}

type DrenyraDualSurfaceContract struct {
	Version              string                    `json:"version"`
	SourceOfTruth        string                    `json:"sourceOfTruth"`
	SharedDomain         string                    `json:"sharedDomain"`
	SharedApplication    string                    `json:"sharedApplication"`
	RequiredScopeHeaders []string                  `json:"requiredScopeHeaders"`
	IdempotencyHeader    string                    `json:"idempotencyHeader"`
	SSEEventTypes        []string                  `json:"sseEventTypes"`
	OfflineCommandKinds  []string                  `json:"offlineCommandKinds"`
	Endpoints            []DrenyraContractEndpoint `json:"endpoints"`
	Invariants           []string                  `json:"invariants"`
}

type DrenyraContractEndpoint struct {
	Method           string   `json:"method"`
	Path             string   `json:"path"`
	IdempotentReplay bool     `json:"idempotentReplay"`
	CLIParity        string   `json:"cliParity"`
	WebParity        string   `json:"webParity"`
	SSEEvents        []string `json:"sseEvents,omitempty"`
}

type FiscalWorkInspectResult struct {
	Status         string                 `json:"status"`
	Reason         string                 `json:"reason"`
	TraceID        string                 `json:"traceId"`
	Capability     string                 `json:"capability"`
	WorkItemID     string                 `json:"workItemId,omitempty"`
	Data           *FiscalWorkInspectData `json:"data,omitempty"`
	RedactedDetail string                 `json:"redactedDetail"`
}

type FiscalWorkInspectData struct {
	WorkItemID              string   `json:"workItemId"`
	WorkItemStatus          string   `json:"workItemStatus"`
	RiskLevel               string   `json:"riskLevel"`
	EvidenceRefs            []string `json:"evidenceRefs"`
	ProposalOrApprovalState string   `json:"proposalOrApprovalState,omitempty"`
	AccountantSummary       string   `json:"accountantSummary"`
}

type CommandEnvelopeAuditDecision string

const (
	CommandEnvelopeAuditAll     CommandEnvelopeAuditDecision = "all"
	CommandEnvelopeAuditAllowed CommandEnvelopeAuditDecision = "allowed"
	CommandEnvelopeAuditDenied  CommandEnvelopeAuditDecision = "denied"
)

type CommandEnvelopeAuditQuery struct {
	Decision CommandEnvelopeAuditDecision
	CaseID   string
	Limit    int
}

type CommandEnvelopeAuditResponse struct {
	Decision string       `json:"decision"`
	Events   []AuditEvent `json:"events"`
	Count    int          `json:"count"`
}

type AuditEvent struct {
	ID         string         `json:"id"`
	CaseID     string         `json:"caseId,omitempty"`
	Scope      FiscalScope    `json:"scope"`
	EventType  string         `json:"eventType"`
	ActorID    string         `json:"actorId"`
	Message    string         `json:"message"`
	OccurredAt string         `json:"occurredAt"`
	Metadata   map[string]any `json:"metadata"`
}
