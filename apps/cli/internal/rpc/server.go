package rpc

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
)

// Handler dispatches RPC methods to the harness client.
type Handler interface {
	Ping(ctx context.Context) error
	Execute(ctx context.Context, req harness.ExecuteRequest) (*harness.ExecuteResponse, error)
	Spawn(ctx context.Context, req harness.SpawnRequest) (*harness.RunNode, error)
	CommandAuditEvents(ctx context.Context, filter harness.CommandAuditFilter) ([]harness.CommandAuditEvent, error)
}

// Request is one line-delimited JSON RPC call (Pi/Droid style).
type Request struct {
	Method string          `json:"method"`
	ID     string          `json:"id"`
	Params json.RawMessage `json:"params,omitempty"`
}

// Response is one line-delimited JSON RPC reply.
type Response struct {
	ID     string `json:"id"`
	OK     bool   `json:"ok"`
	Result any    `json:"result,omitempty"`
	Error  string `json:"error,omitempty"`
}

type pingParams struct{}

type commandAuditParams struct {
	CaseID    string `json:"caseId,omitempty"`
	CommandID string `json:"commandId,omitempty"`
	EventType string `json:"eventType,omitempty"`
}

// Serve reads newline-delimited JSON requests from in and writes responses to out.
func Serve(ctx context.Context, in io.Reader, out io.Writer, log io.Writer, h Handler, verbose bool) error {
	scanner := bufio.NewScanner(in)
	buf := make([]byte, 0, 1024*1024)
	scanner.Buffer(buf, 10*1024*1024)

	enc := json.NewEncoder(out)

	for scanner.Scan() {
		line := bytes.TrimSpace(scanner.Bytes())
		if len(line) == 0 {
			continue
		}

		var req Request
		if err := json.Unmarshal(line, &req); err != nil {
			writeErr(enc, "", fmt.Errorf("invalid request JSON: %w", err))
			continue
		}

		if verbose && log != nil {
			fmt.Fprintf(log, "rpc: %s id=%s\n", req.Method, req.ID)
		}

		resp := dispatch(ctx, req, h)
		if err := enc.Encode(resp); err != nil {
			return err
		}
	}

	if err := scanner.Err(); err != nil {
		return err
	}
	return nil
}

func dispatch(ctx context.Context, req Request, h Handler) Response {
	method := strings.ToLower(strings.TrimSpace(req.Method))
	if method == "" {
		return failResp(req.ID, "method is required")
	}

	switch method {
	case "ping":
		if err := h.Ping(ctx); err != nil {
			return failResp(req.ID, err.Error())
		}
		return okResp(req.ID, map[string]string{"status": "ok"})

	case "execute":
		var params executeParams
		if len(req.Params) > 0 {
			if err := json.Unmarshal(req.Params, &params); err != nil {
				return failResp(req.ID, "invalid execute params: "+err.Error())
			}
		}
		if params.Task == "" {
			return failResp(req.ID, "task is required")
		}
		autoSpawn := true
		if params.AutoSpawn != nil {
			autoSpawn = *params.AutoSpawn
		}
		result, err := h.Execute(ctx, harness.ExecuteRequest{
			Task:        params.Task,
			RootAgentID: params.RootAgentID,
			AutoSpawn:   autoSpawn,
			Metadata:    params.Metadata,
		})
		if err != nil {
			return failResp(req.ID, err.Error())
		}
		return okResp(req.ID, result)

	case "spawn":
		var params spawnParams
		if len(req.Params) > 0 {
			if err := json.Unmarshal(req.Params, &params); err != nil {
				return failResp(req.ID, "invalid spawn params: "+err.Error())
			}
		}
		if params.AgentID == "" || params.Task == "" {
			return failResp(req.ID, "agentId and task are required")
		}
		result, err := h.Spawn(ctx, harness.SpawnRequest{
			AgentID:     params.AgentID,
			Task:        params.Task,
			Depth:       params.Depth,
			ParentRunID: params.ParentRunID,
		})
		if err != nil {
			return failResp(req.ID, err.Error())
		}
		return okResp(req.ID, result)

	case "command_audit.list", "command-audit.list":
		var params commandAuditParams
		if len(req.Params) > 0 {
			if err := json.Unmarshal(req.Params, &params); err != nil {
				return failResp(req.ID, "invalid command_audit.list params: "+err.Error())
			}
		}
		if params.EventType != "" && params.EventType != "CAPABILITY_ALLOWED" && params.EventType != "CAPABILITY_DENIED" {
			return failResp(req.ID, "eventType must be CAPABILITY_ALLOWED or CAPABILITY_DENIED")
		}
		result, err := h.CommandAuditEvents(ctx, harness.CommandAuditFilter{
			CaseID:    params.CaseID,
			CommandID: params.CommandID,
			EventType: params.EventType,
		})
		if err != nil {
			return failResp(req.ID, err.Error())
		}
		return okResp(req.ID, result)

	default:
		return failResp(req.ID, "unknown method: "+req.Method)
	}
}

func okResp(id string, result any) Response {
	return Response{ID: id, OK: true, Result: result}
}

func failResp(id string, msg string) Response {
	return Response{ID: id, OK: false, Error: msg}
}

func writeErr(enc *json.Encoder, id string, err error) {
	_ = enc.Encode(failResp(id, err.Error()))
}
