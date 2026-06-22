package brain

import (
	"bytes"
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
		BaseURL:    strings.TrimRight(baseURL, "/"),
		HTTPClient: &http.Client{Timeout: 120 * time.Second},
	}
}

func (c *Client) CreateThread(ctx context.Context, input CreateThreadRequest) (Thread, error) {
	body := map[string]any{
		"title":         input.Title,
		"sourceSurface": input.SourceSurface,
	}
	var out Thread
	err := c.post(ctx, "/threads", body, input.FiscalContext, &out)
	return out, err
}

func (c *Client) StartTurn(ctx context.Context, threadID string, input StartTurnRequest) (Turn, error) {
	path, err := url.JoinPath("/threads", url.PathEscape(threadID), "turns")
	if err != nil {
		return Turn{}, fmt.Errorf("brain build turns path: %w", err)
	}

	body := map[string]any{
		"prompt":        input.Prompt,
		"sourceSurface": input.SourceSurface,
	}
	var out Turn
	err = c.post(ctx, path, body, input.FiscalContext, &out)
	return out, err
}

func (c *Client) post(ctx context.Context, path string, body any, fiscal FiscalContext, dest any) error {
	data, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+path, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header = headers(fiscal)
	return c.do(req, dest)
}

func headers(fiscal FiscalContext) http.Header {
	h := http.Header{}
	h.Set("Content-Type", "application/json")
	if fiscal.OrganizationID != "" {
		h.Set("x-organization-id", fiscal.OrganizationID)
	}
	if fiscal.CompanyID != "" {
		h.Set("x-company-id", fiscal.CompanyID)
	}
	if fiscal.CompanyRUC != "" {
		h.Set("x-company-ruc", fiscal.CompanyRUC)
	}
	if fiscal.Period != "" {
		h.Set("x-fiscal-period", fiscal.Period)
	}
	if fiscal.UserID != "" {
		h.Set("x-user-id", fiscal.UserID)
	}
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
		return fmt.Errorf("brain HTTP %d: %s", res.StatusCode, string(raw))
	}
	if dest != nil {
		if err := json.Unmarshal(raw, dest); err != nil {
			return fmt.Errorf("brain decode response: %w", err)
		}
	}
	return nil
}
