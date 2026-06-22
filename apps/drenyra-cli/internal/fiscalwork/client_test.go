package fiscalwork

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestInspectSendsFiscalScopeAndCapabilityHeaders(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got, want := r.Method, http.MethodGet; got != want {
			t.Fatalf("method = %s, want %s", got, want)
		}
		if got, want := r.URL.EscapedPath(), "/api/drenyra/fiscal-work/case%2F1/inspect"; got != want {
			t.Fatalf("path = %s, want %s", got, want)
		}
		assertHeader(t, r, "x-organization-id", "org-1")
		assertHeader(t, r, "x-company-id", "company-1")
		assertHeader(t, r, "x-company-ruc", "20100070970")
		assertHeader(t, r, "x-fiscal-period", "2026-05")
		assertHeader(t, r, "x-user-id", "user-1")
		assertHeader(t, r, "x-drenyra-capability-grant", InspectCapability)
		assertHeader(t, r, "x-drenyra-source-surface", "cli")

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(InspectEnvelope{
			Status:       "success",
			ReasonCode:   "OK",
			TraceID:      "trace-cli",
			CapabilityID: InspectCapability,
			EvidenceRefs: []string{"ev-1"},
		})
	}))
	defer ts.Close()

	client := NewClient(ts.URL)
	envelope, err := client.Inspect(context.Background(), "case/1", FiscalContext{
		OrganizationID: "org-1",
		CompanyID:      "company-1",
		CompanyRUC:     "20100070970",
		Period:         "2026-05",
		UserID:         "user-1",
	})
	if err != nil {
		t.Fatalf("Inspect error: %v", err)
	}
	if envelope.TraceID != "trace-cli" || len(envelope.EvidenceRefs) != 1 {
		t.Fatalf("Inspect envelope = %#v", envelope)
	}
}

func TestDrenyraAPIBaseURLDerivesFromHarnessURL(t *testing.T) {
	t.Parallel()

	got := drenyraAPIBaseURL("http://localhost:3000/api/fiscal-command-center/harness")
	want := "http://localhost:3000/api/drenyra"
	if got != want {
		t.Fatalf("drenyraAPIBaseURL() = %q, want %q", got, want)
	}
}

func assertHeader(t *testing.T, r *http.Request, key, want string) {
	t.Helper()
	if got := r.Header.Get(key); got != want {
		t.Fatalf("%s = %q, want %q", key, got, want)
	}
}
