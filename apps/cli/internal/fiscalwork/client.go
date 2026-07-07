package fiscalwork

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL:    drenyraAPIBaseURL(baseURL),
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Inspect(ctx context.Context, workItemID string, fiscal FiscalContext) (InspectEnvelope, error) {
	path := fmt.Sprintf("/fiscal-work/%s/inspect", url.PathEscape(workItemID))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.BaseURL+path, nil)
	if err != nil {
		return InspectEnvelope{}, err
	}
	req.Header = headers(fiscal)

	var envelope InspectEnvelope
	if err := c.do(req, &envelope); err != nil {
		return InspectEnvelope{}, err
	}
	return envelope, nil
}

func headers(fiscal FiscalContext) http.Header {
	h := http.Header{}
	h.Set("x-organization-id", fiscal.OrganizationID)
	h.Set("x-company-id", fiscal.CompanyID)
	h.Set("x-company-ruc", fiscal.CompanyRUC)
	h.Set("x-fiscal-period", fiscal.Period)
	h.Set("x-user-id", fiscal.UserID)
	h.Set("x-drenyra-capability-grant", InspectCapability)
	h.Set("x-drenyra-source-surface", "cli")
	return h
}

func (c *Client) do(req *http.Request, dest any) error {
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("fiscal work HTTP %d: %s", res.StatusCode, string(raw))
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		return fmt.Errorf("decode fiscal work response: %w", err)
	}
	return nil
}

func drenyraAPIBaseURL(baseURL string) string {
	trimmed := strings.TrimRight(baseURL, "/")
	if strings.HasSuffix(trimmed, "/api/drenyra") {
		return trimmed
	}
	if strings.HasSuffix(trimmed, "/api/fiscal-command-center/harness") {
		return strings.TrimSuffix(trimmed, "/api/fiscal-command-center/harness") + "/api/drenyra"
	}
	if strings.HasSuffix(trimmed, "/api") {
		return trimmed + "/drenyra"
	}
	return trimmed + "/api/drenyra"
}
