package fiscalwork

const InspectCapability = "drenyra.fiscal-work.inspect"

type FiscalContext struct {
	OrganizationID string
	CompanyID      string
	CompanyRUC     string
	Period         string
	UserID         string
}

type InspectEnvelope struct {
	Status         string             `json:"status"`
	ReasonCode     string             `json:"reasonCode"`
	TraceID        string             `json:"traceId"`
	CapabilityID   string             `json:"capabilityId"`
	SourceSurface  string             `json:"sourceSurface,omitempty"`
	Summary        string             `json:"summary,omitempty"`
	RedactedDetail string             `json:"redactedDetail,omitempty"`
	EvidenceRefs   []string           `json:"evidenceRefs,omitempty"`
	Data           *FiscalCaseDetails `json:"data,omitempty"`
}

type FiscalCaseDetails struct {
	Case FiscalCase `json:"case"`
}

type FiscalCase struct {
	ID     string      `json:"id"`
	Title  string      `json:"title"`
	Status string      `json:"status"`
	Scope  FiscalScope `json:"scope"`
}

type FiscalScope struct {
	CompanyID  string `json:"companyId"`
	CompanyRUC string `json:"companyRuc"`
	Period     string `json:"period"`
}
