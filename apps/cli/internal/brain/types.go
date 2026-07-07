package brain

type FiscalContext struct {
	OrganizationID string
	CompanyID      string
	CompanyRUC     string
	Period         string
	UserID         string
}

type CreateThreadRequest struct {
	Title         string        `json:"title"`
	SourceSurface string        `json:"sourceSurface"`
	FiscalContext FiscalContext `json:"-"`
}

type StartTurnRequest struct {
	Prompt        string        `json:"prompt"`
	SourceSurface string        `json:"sourceSurface"`
	FiscalContext FiscalContext `json:"-"`
}

type Thread struct {
	ID            string `json:"id"`
	Title         string `json:"title"`
	Status        string `json:"status"`
	SourceSurface string `json:"sourceSurface"`
}

type Turn struct {
	ID            string `json:"id"`
	ThreadID      string `json:"threadId"`
	Status        string `json:"status"`
	Prompt        string `json:"prompt"`
	SourceSurface string `json:"sourceSurface"`
}
