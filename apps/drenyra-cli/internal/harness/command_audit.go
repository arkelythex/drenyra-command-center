package harness

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

type CommandAuditFilter struct {
	CaseID    string
	CommandID string
	EventType string
}

type CommandAuditEvent struct {
	ID         string         `json:"id"`
	CaseID     string         `json:"caseId,omitempty"`
	EventType  string         `json:"eventType"`
	ActorID    string         `json:"actorId"`
	Message    string         `json:"message"`
	OccurredAt string         `json:"occurredAt"`
	Metadata   map[string]any `json:"metadata"`
}

func (c *Client) CommandAuditEvents(ctx context.Context, filter CommandAuditFilter) ([]CommandAuditEvent, error) {
	query := url.Values{}
	if filter.CaseID != "" {
		query.Set("caseId", filter.CaseID)
	}
	if filter.CommandID != "" {
		query.Set("commandId", filter.CommandID)
	}
	if filter.EventType != "" {
		query.Set("eventType", filter.EventType)
	}
	path := "/commands/audit-events"
	if encoded := query.Encode(); encoded != "" {
		path += "?" + encoded
	}
	var out APIResponse[[]CommandAuditEvent]
	if err := c.drenyraGet(ctx, path, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("drenyra command audit: %s", out.Error)
	}
	return out.Data, nil
}

func (c *Client) drenyraGet(ctx context.Context, path string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.drenyraBaseURL()+path, nil)
	if err != nil {
		return err
	}
	req.Header = c.headers()
	req.Header.Set("x-drenyra-capability-grant", "scoped")
	req.Header.Set("x-drenyra-redaction-ok", "true")
	return c.do(req, dest)
}

func (c *Client) drenyraBaseURL() string {
	base := strings.TrimRight(c.BaseURL, "/")
	return strings.TrimSuffix(base, "/api/fiscal-command-center/harness") + "/api/drenyra"
}
