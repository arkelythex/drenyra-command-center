package harness

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestListCommandEnvelopeAuditSendsScopedQuery(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/drenyra/command-envelope/audit" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if got := r.URL.Query().Get("decision"); got != "denied" {
			t.Fatalf("decision = %q", got)
		}
		if got := r.URL.Query().Get("caseId"); got != "case-001" {
			t.Fatalf("caseId = %q", got)
		}
		assertInspectHeader(t, r, "x-company-ruc", "20601234565")
		payload := APIResponse[CommandEnvelopeAuditResponse]{
			Success: true,
			Data: CommandEnvelopeAuditResponse{
				Decision: "denied",
				Count:    1,
				Events: []AuditEvent{{
					ID:         "audit-001",
					CaseID:     "case-001",
					EventType:  "CAPABILITY_DENIED",
					ActorID:    "user-1",
					Message:    "Capability denied",
					OccurredAt: "2026-05-27T03:40:00.000Z",
					Metadata:   map[string]any{"commandId": "cmd-001"},
				}},
			},
		}
		if err := json.NewEncoder(w).Encode(payload); err != nil {
			t.Fatalf("encode audit: %v", err)
		}
	}))
	defer server.Close()

	client := NewClient(server.URL+"/api/fiscal-command-center/harness", inspectFiscalContext())
	result, err := client.ListCommandEnvelopeAudit(context.Background(), CommandEnvelopeAuditQuery{
		Decision: CommandEnvelopeAuditDenied,
		CaseID:   "case-001",
		Limit:    25,
	})
	if err != nil {
		t.Fatalf("ListCommandEnvelopeAudit() error = %v", err)
	}
	if result.Count != 1 || result.Events[0].EventType != "CAPABILITY_DENIED" {
		t.Fatalf("unexpected result: %#v", result)
	}
}
