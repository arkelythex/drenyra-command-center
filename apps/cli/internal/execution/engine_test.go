package execution

import (
	"context"
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/brain"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/memory"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/modes"
)

type fakeClient struct {
	req harness.ExecuteRequest
}

type fakeBrainClient struct {
	created         brain.CreateThreadRequest
	startedThreadID string
	started         brain.StartTurnRequest
}

func (f *fakeBrainClient) CreateThread(_ context.Context, input brain.CreateThreadRequest) (brain.Thread, error) {
	f.created = input
	return brain.Thread{ID: "thread-1", Title: input.Title, Status: "active", SourceSurface: input.SourceSurface}, nil
}

func (f *fakeBrainClient) StartTurn(_ context.Context, threadID string, input brain.StartTurnRequest) (brain.Turn, error) {
	f.startedThreadID = threadID
	f.started = input
	return brain.Turn{ID: "turn-1", ThreadID: threadID, Status: "running", Prompt: input.Prompt, SourceSurface: input.SourceSurface}, nil
}

func (f *fakeClient) Execute(_ context.Context, req harness.ExecuteRequest) (*harness.ExecuteResponse, error) {
	f.req = req
	return &harness.ExecuteResponse{
		TraceID:     "trace-1",
		RootAgentID: req.RootAgentID,
		Status:      "done",
		Tree: harness.RunNode{
			AgentID:  req.RootAgentID,
			Children: []harness.RunNode{{AgentID: "swarm-review-agent"}},
		},
	}, nil
}

func TestEngineRequiresConfig(t *testing.T) {
	_, err := NewEngine(nil).Execute(context.Background(), ExecuteInput{Task: "review SUNAT payload"})
	if err == nil {
		t.Fatal("Execute() expected error for nil config")
	}
}

func TestEngineExecuteCentralizesRequest(t *testing.T) {
	cfg := config.Default()
	client := &fakeClient{}
	var recorded struct {
		task, root, auto, trace, status string
	}
	engine := NewEngine(cfg)
	brainClient := &fakeBrainClient{}
	engine.brainClient = brainClient
	engine.newClient = func(string, harness.FiscalContext) Client { return client }
	engine.recordRun = func(task, root, autoLevel, traceID, status string) {
		recorded.task = task
		recorded.root = root
		recorded.auto = autoLevel
		recorded.trace = traceID
		recorded.status = status
	}
	engine.loadSnapshot = func() (memory.Snapshot, error) {
		return memory.Snapshot{Memory: "remember tenant scoping", MemoryLimit: 100, UserLimit: 100}, nil
	}

	inputAutoSpawn := false
	result, err := engine.Execute(context.Background(), ExecuteInput{
		Task:      "review SUNAT payload",
		AutoLevel: "medium",
		AutoSpawn: &inputAutoSpawn,
		Mode:      modes.Plan,
		Metadata:  map[string]any{"readOnly": false, "cli": "external"},
	})
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}
	if result.RootAgentID != "fiscal-command-orchestrator" {
		t.Fatalf("RootAgentID = %q", result.RootAgentID)
	}
	if result.AutoSpawn || !result.Request.Metadata["readOnly"].(bool) {
		t.Fatalf("metadata/autospawn = %#v auto=%v", result.Request.Metadata, result.AutoSpawn)
	}
	if got := result.Request.Metadata["cli"]; got != "drenyra-go" {
		t.Fatalf("cli metadata = %#v", got)
	}
	if got := result.Request.Metadata["mode"]; got != "plan" {
		t.Fatalf("mode metadata = %#v", got)
	}
	if got := result.Request.Metadata["persistentMemory"]; got != "remember tenant scoping" {
		t.Fatalf("persistentMemory = %#v", got)
	}
	if got := result.Request.Metadata["brainThreadId"]; got != "thread-1" {
		t.Fatalf("brainThreadId = %#v", got)
	}
	if brainClient.startedThreadID != "thread-1" || brainClient.started.Prompt != result.Task {
		t.Fatalf("brain timeline not linked: %#v", brainClient)
	}
	if recorded.trace != "trace-1" || recorded.status != "done" || recorded.root != result.RootAgentID {
		t.Fatalf("recorded = %#v", recorded)
	}
	if result.Models["swarm-review-agent"] == "" {
		t.Fatalf("models not collected: %#v", result.Models)
	}
	if client.req.Task != result.Task || client.req.RootAgentID != result.RootAgentID {
		t.Fatalf("client req = %#v result = %#v", client.req, result.Request)
	}
}

func TestEngineResolvesRootFromOriginalTaskBeforePlanPrefix(t *testing.T) {
	cfg := config.Default()
	client := &fakeClient{}
	engine := NewEngine(cfg)
	engine.newClient = func(string, harness.FiscalContext) Client { return client }
	engine.recordRun = func(string, string, string, string, string) {}
	engine.loadSnapshot = func() (memory.Snapshot, error) {
		return memory.Snapshot{MemoryLimit: 100, UserLimit: 100}, nil
	}

	result, err := engine.Execute(context.Background(), ExecuteInput{Task: "summarize monthly cashflow", AutoLevel: "low", Mode: modes.Plan})
	if err != nil {
		t.Fatalf("Execute() error = %v", err)
	}
	if result.RootAgentID != "fiscal-command-orchestrator" {
		t.Fatalf("RootAgentID = %q, want fiscal-command-orchestrator", result.RootAgentID)
	}
	if result.Request.RootAgentID != result.RootAgentID {
		t.Fatalf("request root = %q result root = %q", result.Request.RootAgentID, result.RootAgentID)
	}
	if result.Request.Task == "summarize monthly cashflow" {
		t.Fatalf("plan mode did not transform task: %q", result.Request.Task)
	}
}
