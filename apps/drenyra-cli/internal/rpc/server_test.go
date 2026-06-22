package rpc

import (
	"bytes"
	"context"
	"encoding/json"
	"testing"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
)

type stubHandler struct {
	pingErr         error
	executeOut      *harness.ExecuteResponse
	executeErr      error
	spawnOut        *harness.RunNode
	spawnErr        error
	commandAuditOut []harness.CommandAuditEvent
	commandFilter   harness.CommandAuditFilter
}

func (s stubHandler) Ping(_ context.Context) error { return s.pingErr }

func (s stubHandler) Execute(_ context.Context, _ harness.ExecuteRequest) (*harness.ExecuteResponse, error) {
	return s.executeOut, s.executeErr
}

func (s stubHandler) Spawn(_ context.Context, _ harness.SpawnRequest) (*harness.RunNode, error) {
	return s.spawnOut, s.spawnErr
}

func (s *stubHandler) CommandAuditEvents(
	_ context.Context,
	filter harness.CommandAuditFilter,
) ([]harness.CommandAuditEvent, error) {
	s.commandFilter = filter
	return s.commandAuditOut, nil
}

func TestServePing(t *testing.T) {
	in := bytes.NewBufferString(`{"method":"ping","id":"1"}` + "\n")
	var out bytes.Buffer
	h := &stubHandler{}
	if err := Serve(context.Background(), in, &out, nil, h, false); err != nil {
		t.Fatal(err)
	}
	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if !resp.OK || resp.ID != "1" {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestServeUnknownMethod(t *testing.T) {
	in := bytes.NewBufferString(`{"method":"nope","id":"x"}` + "\n")
	var out bytes.Buffer
	if err := Serve(context.Background(), in, &out, nil, &stubHandler{}, false); err != nil {
		t.Fatal(err)
	}
	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp.OK {
		t.Fatal("expected error response")
	}
}

func TestServeSpawn(t *testing.T) {
	in := bytes.NewBufferString(`{"method":"spawn","id":"2","params":{"agentId":"a","task":"do it"}}` + "\n")
	var out bytes.Buffer
	h := &stubHandler{
		spawnOut: &harness.RunNode{RunID: "r1", AgentID: "a", Status: "done"},
	}
	if err := Serve(context.Background(), in, &out, nil, h, false); err != nil {
		t.Fatal(err)
	}
	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if !resp.OK {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

func TestServeCommandAuditList(t *testing.T) {
	in := bytes.NewBufferString(`{"method":"command_audit.list","id":"3","params":{"commandId":"review-sunat","eventType":"CAPABILITY_DENIED"}}` + "\n")
	var out bytes.Buffer
	h := &stubHandler{
		commandAuditOut: []harness.CommandAuditEvent{{
			ID:        "evt-1",
			EventType: "CAPABILITY_DENIED",
			Metadata:  map[string]any{"commandId": "review-sunat"},
		}},
	}
	if err := Serve(context.Background(), in, &out, nil, h, false); err != nil {
		t.Fatal(err)
	}
	if h.commandFilter.CommandID != "review-sunat" || h.commandFilter.EventType != "CAPABILITY_DENIED" {
		t.Fatalf("filter = %#v", h.commandFilter)
	}
	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if !resp.OK || resp.ID != "3" {
		t.Fatalf("unexpected response: %+v", resp)
	}
}

type captureExecuteHandler struct {
	stubHandler
	req harness.ExecuteRequest
}

func (h *captureExecuteHandler) Execute(_ context.Context, req harness.ExecuteRequest) (*harness.ExecuteResponse, error) {
	h.req = req
	return &harness.ExecuteResponse{TraceID: "t1", RootAgentID: req.RootAgentID, Status: "done"}, nil
}

func TestServeExecutePreservesWireRequest(t *testing.T) {
	in := bytes.NewBufferString(`{"method":"execute","id":"3","params":{"task":"do it","rootAgentId":"agent-a","autoSpawn":false,"metadata":{"autoLevel":"low"}}}` + "\n")
	var out bytes.Buffer
	h := &captureExecuteHandler{}
	if err := Serve(context.Background(), in, &out, nil, h, false); err != nil {
		t.Fatal(err)
	}
	var resp Response
	if err := json.Unmarshal(out.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if !resp.OK || resp.ID != "3" {
		t.Fatalf("unexpected response: %+v", resp)
	}
	if h.req.Task != "do it" || h.req.RootAgentID != "agent-a" || h.req.AutoSpawn {
		t.Fatalf("execute request = %#v", h.req)
	}
	if h.req.Metadata["autoLevel"] != "low" {
		t.Fatalf("metadata = %#v", h.req.Metadata)
	}
}
