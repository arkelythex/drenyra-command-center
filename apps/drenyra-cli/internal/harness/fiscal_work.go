package harness

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const FiscalWorkInspectCapability = "drenyra.fiscal-work.inspect"

// InspectFiscalWork GET /api/drenyra/fiscal-work/:workItemId/inspect.
func (c *Client) InspectFiscalWork(ctx context.Context, workItemID string) (*FiscalWorkInspectResult, error) {
	var out APIResponse[FiscalWorkInspectResult]
	path := "/fiscal-work/" + url.PathEscape(workItemID) + "/inspect"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.drenyraURL(path), nil)
	if err != nil {
		return nil, err
	}
	req.Header = c.headers()
	req.Header.Set("x-drenyra-capability", FiscalWorkInspectCapability)
	if err := c.doInspect(req, &out); err != nil {
		return nil, err
	}
	if !out.Success {
		return nil, fmt.Errorf("drenyra inspect: %s", out.Error)
	}
	return &out.Data, nil
}

func (c *Client) doInspect(req *http.Request, out *APIResponse[FiscalWorkInspectResult]) error {
	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	raw, err := io.ReadAll(res.Body)
	if err != nil {
		return err
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("drenyra inspect HTTP %d: %s", res.StatusCode, string(raw))
	}
	if !out.Success {
		return nil
	}
	if res.StatusCode >= 400 && out.Data.Status != "denied" && out.Data.Status != "not_found" {
		return fmt.Errorf("drenyra inspect HTTP %d: %s", res.StatusCode, string(raw))
	}
	return nil
}
