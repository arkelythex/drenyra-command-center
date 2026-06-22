package cmd

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/execution"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/modes"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/rpc"
	"github.com/spf13/cobra"
)

type harnessRPC struct {
	client *harness.Client
	engine *execution.Engine
}

func (h harnessRPC) Ping(ctx context.Context) error {
	return h.client.Ping(ctx)
}

func (h harnessRPC) Execute(ctx context.Context, req harness.ExecuteRequest) (*harness.ExecuteResponse, error) {
	if h.engine == nil {
		return nil, errors.New("rpc execution engine is required")
	}
	autoSpawn := req.AutoSpawn
	result, err := h.engine.Execute(ctx, execution.ExecuteInput{
		Task:        req.Task,
		RootAgentID: req.RootAgentID,
		AutoLevel:   metaString(req.Metadata, "autoLevel"),
		AutoSpawn:   &autoSpawn,
		Mode:        modes.Normalize(metaString(req.Metadata, "mode")),
		Metadata:    req.Metadata,
	})
	if err != nil {
		return nil, err
	}
	return result.Response, nil
}

func metaString(m map[string]any, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func (h harnessRPC) Spawn(ctx context.Context, req harness.SpawnRequest) (*harness.RunNode, error) {
	return h.client.Spawn(ctx, req)
}

func (h harnessRPC) CommandAuditEvents(
	ctx context.Context,
	filter harness.CommandAuditFilter,
) ([]harness.CommandAuditEvent, error) {
	return h.client.CommandAuditEvents(ctx, filter)
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Line-delimited JSON RPC over stdin/stdout (Pi/Droid style)",
	Long: `Read newline-delimited JSON requests from stdin and write responses to stdout.

Request:  {"method":"ping|execute|spawn|command_audit.list","id":"1","params":{...}}
Response: {"id":"1","ok":true,"result":{...}} or {"id":"1","ok":false,"error":"..."}

Methods:
  ping               — harness connectivity
  execute            — full orchestration (params: task, rootAgentId?, autoSpawn?, metadata?)
  spawn              — single agent (params: agentId, task, depth?, parentRunId?)
  command_audit.list — scoped command capability audit events`,
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		fiscalCtx, err := mergeFiscal(cfg, fiscalFlags{})
		if err != nil {
			return err
		}

		client := harness.NewClient(cfg.Harness.API, fiscalCtx)
		handler := harnessRPC{client: client, engine: execution.NewEngine(cfg)}

		var log io.Writer = io.Discard
		if verbose {
			log = os.Stderr
			fmt.Fprintln(os.Stderr, "drenyra serve: listening on stdin (JSON lines)")
		}

		return rpc.Serve(context.Background(), os.Stdin, os.Stdout, log, handler, verbose)
	},
}
