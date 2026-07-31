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

// ─── Mission types ──────────────────────────────────────────────────────

type MissionStatus string

const (
	MissionDRAFT              MissionStatus = "DRAFT"
	MissionQUEUED             MissionStatus = "QUEUED"
	MissionRUNNING            MissionStatus = "RUNNING"
	MissionBLOCKED            MissionStatus = "BLOCKED"
	MissionAWAITING_APPROVAL  MissionStatus = "AWAITING_APPROVAL"
	MissionAPPROVED           MissionStatus = "APPROVED"
	MissionREJECTED           MissionStatus = "REJECTED"
	MissionREVISION_REQUESTED MissionStatus = "REVISION_REQUESTED"
	MissionCOMPLETED          MissionStatus = "COMPLETED"
	MissionFAILED             MissionStatus = "FAILED"
	MissionUNKNOWN            MissionStatus = "UNKNOWN"
	MissionWAITING_FOR_EVIDENCE  MissionStatus = "WAITING_FOR_EVIDENCE"
	MissionBLOCKED_BY_GATE      MissionStatus = "BLOCKED_BY_GATE"
	MissionRETRYING            MissionStatus = "RETRYING"
)

type MissionSnapshot struct {
	MissionID         string           `json:"missionId"`
	Status            MissionStatus    `json:"status"`
	Progress          int              `json:"progress"`
	Steps             []MissionStep    `json:"steps"`
	Blockers          []MissionBlocker `json:"blockers"`
	Proposal          *MissionProposal `json:"proposal"`
	Version           int              `json:"version"`
	ReceiptID         string           `json:"receiptId,omitempty"`
	ReceiptHash       string           `json:"receiptHash,omitempty"`
	LastEventSequence int              `json:"lastEventSequence,omitempty"`
}

type MissionStep struct {
	ID     string `json:"id"`
	Label  string `json:"label"`
	Status string `json:"status"`
}

type MissionBlocker struct {
	ID       string `json:"id"`
	Reason   string `json:"reason"`
	Severity string `json:"severity"`
}

type MissionProposal struct {
	ID               string         `json:"id"`
	Version          int            `json:"version"`
	Summary          string         `json:"summary"`
	RiskLevel        string         `json:"riskLevel"`
	RequiresApproval bool           `json:"requiresApproval"`
	ApprovalLevel    string         `json:"approvalLevel"`
	Evidence         []EvidenceItem `json:"evidence"`
	EvidenceHash     string         `json:"evidenceHash"`
}

type EvidenceItem struct {
	ID    string `json:"id"`
	Label string `json:"label"`
	Type  string `json:"type"`
}

type ReadinessGateResult struct {
	GateName    string `json:"gateName"`
	Status      string `json:"status"`
	Details     string `json:"details,omitempty"`
	EvaluatedAt string `json:"evaluatedAt,omitempty"`
}

type AccountingException struct {
	ID               string   `json:"id"`
	MissionID        string   `json:"missionId"`
	Code             string   `json:"code"`
	Severity         string   `json:"severity"`
	SubjectRef       string   `json:"subjectRef"`
	EvidenceRefs     []string `json:"evidenceRefs"`
	ResolutionStatus string   `json:"resolutionStatus"`
}

type ApprovalResult struct {
	ReceiptID   string `json:"receiptId"`
	ReceiptHash string `json:"receiptHash"`
	Version     int    `json:"version"`
}

// ─── Mission types ──────────────────────────────────────────────────────
