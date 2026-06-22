// Package client — Go client for Drenyra Engram evidence store.
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/arkelythex/drenyra-engram/internal/types"
)

// Client communicates with the Drenyra Engram HTTP server.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new client with the given base URL.
func NewClient(baseURL string) *Client {
	return &Client{
		baseURL:    baseURL,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// SaveEvidence persists an evidence record.
func (c *Client) SaveEvidence(ev *types.EvidenceRecord) error {
	return c.doJSON("POST", "/api/v1/evidence", ev, nil)
}

// GetEvidence retrieves an evidence record by ID.
func (c *Client) GetEvidence(id string) (*types.EvidenceRecord, error) {
	var ev types.EvidenceRecord
	err := c.doJSON("GET", "/api/v1/evidence/"+id, nil, &ev)
	return &ev, err
}

// ListEvidence queries evidence records.
func (c *Client) ListEvidence(filter types.EvidenceFilter) ([]*types.EvidenceRecord, error) {
	var results []*types.EvidenceRecord
	err := c.doJSON("GET", "/api/v1/evidence?limit=50", nil, &results)
	return results, err
}

// Health checks if the service is running.
func (c *Client) Health() (map[string]string, error) {
	var result map[string]string
	err := c.doJSON("GET", "/health", nil, &result)
	return result, err
}

func (c *Client) doJSON(method, path string, body, result any) error {
	var reqBody []byte
	if body != nil {
		var err error
		reqBody, err = json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal: %w", err)
		}
	}

	req, err := http.NewRequest(method, c.baseURL+path, bytes.NewReader(reqBody))
	if err != nil {
		return fmt.Errorf("request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("do: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp struct {
			Error string `json:"error"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		return fmt.Errorf("API error %d: %s", resp.StatusCode, errResp.Error)
	}

	if result != nil {
		return json.NewDecoder(resp.Body).Decode(result)
	}
	return nil
}
