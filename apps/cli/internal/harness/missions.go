package harness

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// MissionsClient talks to the Drenyra Missions HTTP API.
type MissionsClient struct {
	BaseURL    string
	HTTPClient *http.Client
	AuthToken  string
}

func NewMissionsClient(baseURL string) *MissionsClient {
	return &MissionsClient{
		BaseURL:    baseURL,
		HTTPClient: &http.Client{},
	}
}

func (c *MissionsClient) headers() http.Header {
	h := http.Header{}
	h.Set("Content-Type", "application/json")
	if c.AuthToken != "" {
		h.Set("Authorization", "Bearer "+c.AuthToken)
	}
	return h
}

// do performs an HTTP request and decodes the response.
// For 4xx/5xx responses, it parses the typed error envelope
// and returns a *MissionError.
func (c *MissionsClient) do(ctx context.Context, method, path string, body, out any) error {
	var reqBody []byte
	if body != nil {
		var err error
		reqBody, err = json.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal request: %w", err)
		}
	}
	req, err := http.NewRequestWithContext(ctx, method, c.BaseURL+path, bytes.NewReader(reqBody))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header = c.headers()
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return fmt.Errorf("http do: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return parseErrorResponse(resp.StatusCode, resp.Body)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

// parseErrorResponse reads a typed error envelope from an API error response.
// Envelope format: {"success": false, "error": {"code": "...", "message": "...", "details": {...}}}
// Simple format:  {"success": false, "error": "...", "code": "..."}
func parseErrorResponse(statusCode int, body io.ReadCloser) error {
	var envelope struct {
		Error json.RawMessage `json:"error"`
		Code  string          `json:"code,omitempty"`
	}
	if err := json.NewDecoder(body).Decode(&envelope); err != nil {
		return &MissionError{
			Code:       fmt.Sprintf("HTTP_%d", statusCode),
			Message:    fmt.Sprintf("API error %d", statusCode),
			StatusCode: statusCode,
			family:     familyForCode(""),
			retryable:  statusCode >= 500,
		}
	}
	// Try nested error object first: { error: { code, message, details } }
	if len(envelope.Error) > 0 {
		var nested struct {
			Code    string                 `json:"code"`
			Message string                 `json:"message"`
			Details map[string]interface{} `json:"details"`
		}
		if err := json.Unmarshal(envelope.Error, &nested); err == nil && nested.Code != "" {
			return ParseMissionError(nested.Code, nested.Message, statusCode, nested.Details)
		}
		// Fallback: error is a string
		var msg string
		if err := json.Unmarshal(envelope.Error, &msg); err == nil && msg != "" {
			return ParseMissionError(envelope.Code, msg, statusCode, nil)
		}
	}
	// Simple format: { error: "...", code: "..." }
	if envelope.Code != "" {
		return ParseMissionError(envelope.Code, "", statusCode, nil)
	}
	return &MissionError{
		Code:       fmt.Sprintf("HTTP_%d", statusCode),
		Message:    fmt.Sprintf("API error %d", statusCode),
		StatusCode: statusCode,
		family:     familyForCode(""),
		retryable:  statusCode >= 500,
	}
}

func (c *MissionsClient) GetMission(ctx context.Context, id string) (*MissionSnapshot, error) {
	var resp APIResponse[MissionSnapshot]
	if err := c.do(ctx, http.MethodGet, "/api/v1/missions/"+id, nil, &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return nil, ParseMissionError("MISSION_NOT_FOUND", resp.Error, 404, nil)
	}
	return &resp.Data, nil
}

func (c *MissionsClient) GetGates(ctx context.Context, id string) ([]ReadinessGateResult, error) {
	var resp APIResponse[[]ReadinessGateResult]
	if err := c.do(ctx, http.MethodGet, "/api/v1/missions/"+id+"/gates", nil, &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return nil, fmt.Errorf("get gates: %s", resp.Error)
	}
	return resp.Data, nil
}

func (c *MissionsClient) GetExceptions(ctx context.Context, id string) ([]AccountingException, error) {
	var resp APIResponse[[]AccountingException]
	if err := c.do(ctx, http.MethodGet, "/api/v1/missions/"+id+"/exceptions", nil, &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return nil, fmt.Errorf("get exceptions: %s", resp.Error)
	}
	return resp.Data, nil
}

func (c *MissionsClient) VerifyReceipt(ctx context.Context, id string) (*ReceiptVerification, error) {
	type RV struct {
		Valid        bool   `json:"valid"`
		ReceiptHash  string `json:"receiptHash"`
		ComputedHash string `json:"computedHash,omitempty"`
		MissionID    string `json:"missionId"`
	}
	var resp APIResponse[RV]
	if err := c.do(ctx, http.MethodGet, "/api/v1/missions/"+id+"/receipt/verify", nil, &resp); err != nil {
		return nil, err
	}
	if !resp.Success {
		return nil, fmt.Errorf("verify receipt: %s", resp.Error)
	}
	return &ReceiptVerification{
		Valid:       resp.Data.Valid,
		ReceiptHash: resp.Data.ReceiptHash,
		MissionID:   resp.Data.MissionID,
	}, nil
}

type ReceiptVerification struct {
	Valid       bool   `json:"valid"`
	ReceiptHash string `json:"receiptHash"`
	MissionID   string `json:"missionId"`
}

func (c *MissionsClient) GetCapabilities(ctx context.Context) (*ProtocolCapabilities, error) {
	var resp struct {
		ProtocolVersion      string   `json:"protocolVersion"`
		MinimumClientVersion string   `json:"minimumClientVersion"`
		Features             []string `json:"features"`
		DeprecatedFields     []string `json:"deprecatedFields,omitempty"`
	}
	if err := c.do(ctx, http.MethodGet, "/api/v1/capabilities", nil, &resp); err != nil {
		return nil, err
	}
	return &ProtocolCapabilities{
		ProtocolVersion:      resp.ProtocolVersion,
		MinimumClientVersion: resp.MinimumClientVersion,
		Features:             resp.Features,
	}, nil
}

type ProtocolCapabilities struct {
	ProtocolVersion      string
	MinimumClientVersion string
	Features             []string
}
