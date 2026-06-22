package harness

import (
	"context"
	"fmt"
	"net/url"
	"strconv"
)

func (c *Client) ListCommandEnvelopeAudit(ctx context.Context, query CommandEnvelopeAuditQuery) (*CommandEnvelopeAuditResponse, error) {
	params := url.Values{}
	if query.Decision != "" {
		params.Set("decision", string(query.Decision))
	}
	if query.CaseID != "" {
		params.Set("caseId", query.CaseID)
	}
	if query.Limit > 0 {
		params.Set("limit", strconv.Itoa(query.Limit))
	}
	path := "/command-envelope/audit"
	if encoded := params.Encode(); encoded != "" {
		path += "?" + encoded
	}
	var out APIResponse[CommandEnvelopeAuditResponse]
	if err := c.getDrenyra(ctx, path, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("drenyra command envelope audit: %s", out.Error)
	}
	return &out.Data, nil
}
