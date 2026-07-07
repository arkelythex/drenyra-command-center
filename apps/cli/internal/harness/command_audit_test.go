package harness

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCommandAuditEventsUsesScopedDrenyraEndpoint(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/drenyra/commands/audit-events" {
			t.Fatalf("path = %s", r.URL.Path)
		}
		if got := r.URL.Query().Get("commandId"); got != "review-sunat" {
			t.Fatalf("commandId = %q", got)
		}
		if got := r.Header.Get("x-drenyra-capability-grant"); got != "scoped" {
			t.Fatalf("capability grant = %q", got)
		}
		if got := r.Header.Get("x-drenyra-redaction-ok"); got != "true" {
			t.Fatalf("redaction = %q", got)
		}
		if got := r.Header.Get("x-company-ruc"); got != "20123456786" {
			t.Fatalf("ruc = %q", got)
		}
		_ = json.NewEncoder(w).Encode(APIResponse[[]CommandAuditEvent]{
			Success: true,
			Data:    []CommandAuditEvent{{EventType: "CAPABILITY_ALLOWED", Metadata: map[string]any{"commandId": "review-sunat"}}},
		})
	}))
	defer server.Close()

	client := NewClient(server.URL+"/api/fiscal-command-center/harness", FiscalContext{
		OrganizationID: "org-1",
		CompanyID:      "company-1",
		CompanyRUC:     "20123456786",
		Period:         "2026-05",
		UserID:         "user-1",
	})
	events, err := client.CommandAuditEvents(context.Background(), CommandAuditFilter{CommandID: "review-sunat"})
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 1 || events[0].EventType != "CAPABILITY_ALLOWED" {
		t.Fatalf("events = %#v", events)
	}
}
