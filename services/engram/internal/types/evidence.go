// Package types — domain types for fiscal evidence persistence.
// Inspired by Gentle-AI Engram: persistent memory for AI agents.
// Drenyra-Engram stores fiscal evidence records with full audit trail.
package types

import "time"

// FiscalTier matches the TypeScript FiscalTier enum.
type FiscalTier string

const (
	TierAdvisory FiscalTier = "T1_ADVISORY"
	TierStrong   FiscalTier = "T2_STRONG"
	TierCritical FiscalTier = "T3_CRITICAL"
)

// FdPhase matches the TypeScript FdPhase type.
type FdPhase string

const (
	PhaseExtract  FdPhase = "extract"
	PhaseClassify FdPhase = "classify"
	PhaseValidate FdPhase = "validate"
	PhaseComply   FdPhase = "comply"
	PhaseApprove  FdPhase = "approve"
	PhaseSubmit   FdPhase = "submit"
	PhaseArchive  FdPhase = "archive"
)

// Actor represents who performed the action.
type Actor string

const (
	ActorAI     Actor = "ai"
	ActorHuman  Actor = "human"
	ActorSystem Actor = "system"
)

// EvidenceRecord is the core unit of fiscal memory.
// Every fiscal action produces one evidence record.
type EvidenceRecord struct {
	ID          string            `json:"id"`
	OperationID string            `json:"operationId"`
	Phase       FdPhase           `json:"phase"`
	Tier        FiscalTier        `json:"tier"`
	Timestamp   time.Time         `json:"timestamp"`
	Actor       Actor             `json:"actor"`
	Action      string            `json:"action"`
	Input       any               `json:"input"`
	Output      any               `json:"output"`
	Reasoning   string            `json:"reasoning,omitempty"`
	Metadata    map[string]any    `json:"metadata,omitempty"`
	TenantID    string            `json:"tenantId"`
	RUC         string            `json:"ruc"`
	CompanyID   string            `json:"companyId"`
	UserID      string            `json:"userId,omitempty"`
	TraceID     string            `json:"traceId"`
}

// EvidenceFilter for querying evidence records.
type EvidenceFilter struct {
	OperationID string     `json:"operationId,omitempty"`
	Phase       FdPhase    `json:"phase,omitempty"`
	Tier        FiscalTier `json:"tier,omitempty"`
	Actor       Actor      `json:"actor,omitempty"`
	TenantID    string     `json:"tenantId,omitempty"`
	RUC         string     `json:"ruc,omitempty"`
	StartTime   *time.Time `json:"startTime,omitempty"`
	EndTime     *time.Time `json:"endTime,omitempty"`
	Limit       int        `json:"limit,omitempty"`
	Offset      int        `json:"offset,omitempty"`
	Search      string     `json:"search,omitempty"`
}

// EvidenceStats represents fiscal memory statistics.
type EvidenceStats struct {
	TotalRecords    int64 `json:"totalRecords"`
	ByPhase         map[FdPhase]int64
	ByTier          map[FiscalTier]int64
	ByActor         map[Actor]int64
	UniqueTenants   int64 `json:"uniqueTenants"`
	UniqueRUCs      int64 `json:"uniqueRUCs"`
	TotalOperations int64 `json:"totalOperations"`
	StorageBytes    int64 `json:"storageBytes"`
}

// Session is a group of evidence records tied to one fiscal session.
type Session struct {
	ID        string    `json:"id"`
	TenantID  string    `json:"tenantId"`
	RUC       string    `json:"ruc"`
	UserID    string    `json:"userId"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Evidence  []string  `json:"evidence,omitempty"`
}
