package cmd

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/fiscalwork"
)

func TestRunWorkInspectUsesSharedBackendContract(t *testing.T) {
	t.Parallel()

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got, want := r.URL.EscapedPath(), "/api/drenyra/fiscal-work/work-1/inspect"; got != want {
			t.Fatalf("path = %s, want %s", got, want)
		}
		if got, want := r.Header.Get("x-drenyra-capability-grant"), fiscalwork.InspectCapability; got != want {
			t.Fatalf("capability = %q, want %q", got, want)
		}
		if got, want := r.Header.Get("x-company-ruc"), "20100070970"; got != want {
			t.Fatalf("ruc = %q, want %q", got, want)
		}
		if got, want := r.Header.Get("x-fiscal-period"), "2026-05"; got != want {
			t.Fatalf("period = %q, want %q", got, want)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(fiscalwork.InspectEnvelope{
			Status:       "success",
			ReasonCode:   "OK",
			TraceID:      "trace-work",
			CapabilityID: fiscalwork.InspectCapability,
		})
	}))
	defer ts.Close()

	cfg := config.Default()
	cfg.Harness.API = ts.URL
	envelope, err := runWorkInspect(context.Background(), cfg, "work-1", fiscalFlags{
		organizationID: "org-1",
		companyID:      "company-1",
		companyRUC:     "20100070970",
		period:         "2026-05",
		userID:         "user-1",
	})
	if err != nil {
		t.Fatalf("runWorkInspect error: %v", err)
	}
	if envelope.TraceID != "trace-work" {
		t.Fatalf("trace = %q, want trace-work", envelope.TraceID)
	}
}
