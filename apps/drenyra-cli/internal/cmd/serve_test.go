package cmd

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/execution"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
)

func TestHarnessRPCExecuteUsesExecutionEngine(t *testing.T) {
	t.Setenv("HOME", t.TempDir())

	var got harness.ExecuteRequest
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/execute" {
			t.Fatalf("path = %q, want /execute", r.URL.Path)
		}
		if err := json.NewDecoder(r.Body).Decode(&got); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		_ = json.NewEncoder(w).Encode(harness.APIResponse[harness.ExecuteResponse]{
			Success: true,
			Data: harness.ExecuteResponse{
				TraceID:     "trace-rpc",
				RootAgentID: got.RootAgentID,
				Status:      "done",
				Tree:        harness.RunNode{AgentID: got.RootAgentID, Status: "done"},
			},
		})
	}))
	defer server.Close()

	cfg := config.Default()
	cfg.Harness.API = server.URL
	handler := harnessRPC{
		client: harness.NewClient(server.URL, harness.FiscalContext{
			OrganizationID: cfg.Fiscal.OrganizationID,
			CompanyID:      cfg.Fiscal.CompanyID,
			CompanyRUC:     cfg.Fiscal.CompanyRUC,
			Period:         cfg.Fiscal.Period,
			UserID:         cfg.Fiscal.UserID,
		}),
		engine: execution.NewEngine(cfg),
	}

	resp, err := handler.Execute(context.Background(), harness.ExecuteRequest{
		Task:      "summarize monthly cashflow",
		AutoSpawn: false,
		Metadata: map[string]any{
			"autoLevel": "medium",
			"mode":      "plan",
			"readOnly":  false,
		},
	})
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}
	if resp.TraceID != "trace-rpc" {
		t.Fatalf("TraceID = %q", resp.TraceID)
	}
	if got.AutoSpawn {
		t.Fatalf("AutoSpawn = true, want false from RPC request")
	}
	if got.RootAgentID != "fiscal-command-orchestrator" {
		t.Fatalf("RootAgentID = %q, want root resolved from original task", got.RootAgentID)
	}
	if !strings.HasPrefix(got.Task, "PLAN MODE (read-only):") {
		t.Fatalf("Task = %q, want plan mode task", got.Task)
	}
	if got.Metadata["mode"] != "plan" || got.Metadata["readOnly"] != true {
		t.Fatalf("metadata = %#v", got.Metadata)
	}
	if got.Metadata["memorySnapshot"] != true {
		t.Fatalf("memory metadata missing: %#v", got.Metadata)
	}
}

func TestHarnessRPCCommandAuditEventsUsesDrenyraClient(t *testing.T) {
	t.Setenv("HOME", t.TempDir())

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/drenyra/commands/audit-events" {
			t.Fatalf("path = %q", r.URL.Path)
		}
		if got := r.URL.Query().Get("eventType"); got != "CAPABILITY_ALLOWED" {
			t.Fatalf("eventType = %q", got)
		}
		if got := r.Header.Get("x-drenyra-capability-grant"); got != "scoped" {
			t.Fatalf("capability grant = %q", got)
		}
		_ = json.NewEncoder(w).Encode(harness.APIResponse[[]harness.CommandAuditEvent]{
			Success: true,
			Data: []harness.CommandAuditEvent{{
				ID:        "evt-1",
				EventType: "CAPABILITY_ALLOWED",
				Metadata:  map[string]any{"commandId": "review-sunat"},
			}},
		})
	}))
	defer server.Close()

	handler := harnessRPC{
		client: harness.NewClient(server.URL+"/api/fiscal-command-center/harness", harness.FiscalContext{
			OrganizationID: "org-1",
			CompanyID:      "company-1",
			CompanyRUC:     "20123456786",
			Period:         "2026-05",
			UserID:         "user-1",
		}),
	}

	events, err := handler.CommandAuditEvents(context.Background(), harness.CommandAuditFilter{
		EventType: "CAPABILITY_ALLOWED",
	})
	if err != nil {
		t.Fatal(err)
	}
	if len(events) != 1 || events[0].ID != "evt-1" {
		t.Fatalf("events = %#v", events)
	}
}
