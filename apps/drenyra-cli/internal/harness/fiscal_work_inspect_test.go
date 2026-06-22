package harness

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestInspectFiscalWorkSendsScopeAndCapability(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/drenyra/fiscal-work/case-001/inspect" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		assertInspectHeader(t, r, "x-organization-id", "org-1")
		assertInspectHeader(t, r, "x-company-id", "company-1")
		assertInspectHeader(t, r, "x-company-ruc", "20601234565")
		assertInspectHeader(t, r, "x-fiscal-period", "2026-05")
		assertInspectHeader(t, r, "x-user-id", "user-1")
		assertInspectHeader(t, r, "x-drenyra-capability", FiscalWorkInspectCapability)
		writeInspectEnvelope(t, w, http.StatusOK, "success")
	}))
	defer server.Close()

	client := NewClient(server.URL+"/api/fiscal-command-center/harness", inspectFiscalContext())
	result, err := client.InspectFiscalWork(context.Background(), "case-001")
	if err != nil {
		t.Fatalf("InspectFiscalWork() error = %v", err)
	}
	if result.Status != "success" || result.Data == nil {
		t.Fatalf("unexpected result: %#v", result)
	}
}

func TestInspectFiscalWorkPreservesDeniedEnvelope(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeInspectEnvelope(t, w, http.StatusForbidden, "denied")
	}))
	defer server.Close()

	client := NewClient(server.URL, inspectFiscalContext())
	result, err := client.InspectFiscalWork(context.Background(), "case-001")
	if err != nil {
		t.Fatalf("InspectFiscalWork() error = %v", err)
	}
	if result.Status != "denied" {
		t.Fatalf("status = %q", result.Status)
	}
}

func TestContractUsesDrenyraSurfaceFromLegacyHarnessBase(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/drenyra/contract" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		payload := APIResponse[DrenyraDualSurfaceContract]{
			Success: true,
			Data: DrenyraDualSurfaceContract{
				Version:       "2026-05-26.dual-surface.v1",
				SourceOfTruth: "apps/api",
			},
		}
		if err := json.NewEncoder(w).Encode(payload); err != nil {
			t.Fatalf("encode contract: %v", err)
		}
	}))
	defer server.Close()

	client := NewClient(server.URL+"/api/fiscal-command-center/harness", inspectFiscalContext())
	contract, err := client.Contract(context.Background())
	if err != nil {
		t.Fatalf("Contract() error = %v", err)
	}
	if contract.SourceOfTruth != "apps/api" {
		t.Fatalf("sourceOfTruth = %q", contract.SourceOfTruth)
	}
}

func assertInspectHeader(t *testing.T, r *http.Request, key string, want string) {
	t.Helper()
	if got := r.Header.Get(key); got != want {
		t.Fatalf("%s = %q, want %q", key, got, want)
	}
}

func inspectFiscalContext() FiscalContext {
	return FiscalContext{
		OrganizationID: "org-1",
		CompanyID:      "company-1",
		CompanyRUC:     "20601234565",
		Period:         "2026-05",
		UserID:         "user-1",
	}
}

func writeInspectEnvelope(t *testing.T, w http.ResponseWriter, statusCode int, status string) {
	t.Helper()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	payload := APIResponse[FiscalWorkInspectResult]{
		Success: true,
		Data: FiscalWorkInspectResult{
			Status:         status,
			Reason:         status,
			TraceID:        "trace-001",
			Capability:     FiscalWorkInspectCapability,
			WorkItemID:     "case-001",
			RedactedDetail: "Scoped fiscal work inspection.",
			Data: &FiscalWorkInspectData{
				WorkItemID:              "case-001",
				WorkItemStatus:          "pending_approval",
				RiskLevel:               "medium",
				EvidenceRefs:            []string{"ev-1"},
				ProposalOrApprovalState: "pending",
				AccountantSummary:       "Review available in fiscal command center.",
			},
		},
	}
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		t.Fatalf("encode envelope: %v", err)
	}
}
