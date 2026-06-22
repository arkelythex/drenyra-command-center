package harness

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Client talks to @arkelythex/harness HTTP API.
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
	Fiscal     FiscalContext
}

func NewClient(baseURL string, fiscal FiscalContext) *Client {
	return &Client{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		HTTPClient: &http.Client{Timeout: 120 * time.Second},
		Fiscal:     fiscal,
	}
}

func (c *Client) headers() http.Header {
	h := http.Header{}
	h.Set("Content-Type", "application/json")
	h.Set("x-organization-id", c.Fiscal.OrganizationID)
	h.Set("x-company-id", c.Fiscal.CompanyID)
	h.Set("x-company-ruc", c.Fiscal.CompanyRUC)
	h.Set("x-fiscal-period", c.Fiscal.Period)
	h.Set("x-user-id", c.Fiscal.UserID)
	return h
}

// Contract fetches the shared API/Web/CLI Drenyra contract.
func (c *Client) Contract(ctx context.Context) (*DrenyraDualSurfaceContract, error) {
	var out APIResponse[DrenyraDualSurfaceContract]
	if err := c.getDrenyra(ctx, "/contract", &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("harness: %s", out.Error)
	}
	return &out.Data, nil
}

// ListAgents GET /agents
func (c *Client) ListAgents(ctx context.Context) (*AgentsListData, error) {
	var out APIResponse[AgentsListData]
	if err := c.get(ctx, "/agents", &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("harness: %s", out.Error)
	}
	return &out.Data, nil
}

// Execute POST /execute
func (c *Client) Execute(ctx context.Context, req ExecuteRequest) (*ExecuteResponse, error) {
	var out APIResponse[ExecuteResponse]
	if err := c.post(ctx, "/execute", req, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("harness: %s", out.Error)
	}
	return &out.Data, nil
}

// Spawn POST /spawn — run a single agent without full orchestration tree.
func (c *Client) Spawn(ctx context.Context, req SpawnRequest) (*RunNode, error) {
	var out APIResponse[RunNode]
	if err := c.post(ctx, "/spawn", req, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("harness: %s", out.Error)
	}
	return &out.Data, nil
}

func (c *Client) get(ctx context.Context, path string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.BaseURL+path, nil)
	if err != nil {
		return err
	}
	req.Header = c.headers()
	return c.do(req, dest)
}

func (c *Client) getDrenyra(ctx context.Context, path string, dest any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.drenyraURL(path), nil)
	if err != nil {
		return err
	}
	req.Header = c.headers()
	return c.do(req, dest)
}

func (c *Client) post(ctx context.Context, path string, body any, dest any) error {
	data, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.BaseURL+path, bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header = c.headers()
	return c.do(req, dest)
}

func (c *Client) drenyraURL(path string) string {
	if strings.HasSuffix(c.BaseURL, "/api/fiscal-command-center/harness") {
		return strings.TrimSuffix(c.BaseURL, "/api/fiscal-command-center/harness") + "/api/drenyra" + path
	}
	return c.BaseURL + path
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
	if res.StatusCode >= 400 {
		return fmt.Errorf("harness HTTP %d: %s", res.StatusCode, string(raw))
	}
	if dest != nil {
		return json.Unmarshal(raw, dest)
	}
	return nil
}

// Ping checks reachability (list agents).
func (c *Client) Ping(ctx context.Context) error {
	_, err := c.ListAgents(ctx)
	return err
}
