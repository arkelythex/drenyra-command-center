package rpc

type executeParams struct {
	Task        string         `json:"task"`
	RootAgentID string         `json:"rootAgentId,omitempty"`
	AutoSpawn   *bool          `json:"autoSpawn,omitempty"`
	Metadata    map[string]any `json:"metadata,omitempty"`
}

type spawnParams struct {
	AgentID     string `json:"agentId"`
	Task        string `json:"task"`
	Depth       int    `json:"depth,omitempty"`
	ParentRunID string `json:"parentRunId,omitempty"`
}

type fiscalWorkInspectParams struct {
	WorkItemID string `json:"workItemId"`
}

type commandEnvelopeAuditParams struct {
	Decision string `json:"decision,omitempty"`
	CaseID   string `json:"caseId,omitempty"`
	Limit    int    `json:"limit,omitempty"`
}
