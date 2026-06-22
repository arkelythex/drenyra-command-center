package execution

import (
	"context"
	"errors"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/audit"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/brain"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/delegation"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/modes"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/router"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/runctx"
)

// Client executes a harness request.
type Client interface {
	Execute(context.Context, harness.ExecuteRequest) (*harness.ExecuteResponse, error)
}

// ClientFactory builds a harness client for a fiscal context.
type ClientFactory func(apiURL string, fiscal harness.FiscalContext) Client

// BrainClient executes requests against Drenyra Brain.
type BrainClient interface {
	CreateThread(ctx context.Context, input brain.CreateThreadRequest) (brain.Thread, error)
	StartTurn(ctx context.Context, threadID string, input brain.StartTurnRequest) (brain.Turn, error)
}

// Recorder persists the run after the harness completes.
type Recorder func(task, root, autoLevel, traceID, status string)

// Engine centralizes Drenyra CLI harness execution for Cobra, TUI, RPC, and workflows.
type Engine struct {
	cfg          *config.Config
	newClient    ClientFactory
	brainClient  BrainClient
	recordRun    Recorder
	loadSnapshot func() (memory.Snapshot, error)
}

// NewEngine returns a production execution engine.
func NewEngine(cfg *config.Config) *Engine {
	return &Engine{
		cfg: cfg,
		newClient: func(apiURL string, fiscal harness.FiscalContext) Client {
			return harness.NewClient(apiURL, fiscal)
		},
		recordRun:    runctx.RecordRun,
		loadSnapshot: memory.LoadSnapshot,
	}
}

// ExecuteInput describes one harness execution request before defaults are applied.
type ExecuteInput struct {
	Task            string
	RootAgentID     string
	AutoLevel       string
	FiscalOverrides audit.FiscalOverrides
	Mode            modes.Mode
	AutoSpawn       *bool
	Metadata        map[string]any
}

// ExecuteResult is the normalized result returned to all frontends.
type ExecuteResult struct {
	Response    *harness.ExecuteResponse
	Models      map[string]string
	Task        string
	RootAgentID string
	AutoLevel   string
	AutoSpawn   bool
	Fiscal      harness.FiscalContext
	Request     harness.ExecuteRequest
}

// Execute resolves fiscal context, root agent, model metadata, memory metadata, and run recording.
func (e *Engine) Execute(ctx context.Context, input ExecuteInput) (ExecuteResult, error) {
	if e == nil || e.cfg == nil {
		return ExecuteResult{}, errors.New("execution engine config is required")
	}
	if e.newClient == nil {
		e.newClient = func(apiURL string, fiscal harness.FiscalContext) Client { return harness.NewClient(apiURL, fiscal) }
	}
	if e.recordRun == nil {
		e.recordRun = runctx.RecordRun
	}
	if e.loadSnapshot == nil {
		e.loadSnapshot = memory.LoadSnapshot
	}
	if input.AutoLevel == "" {
		input.AutoLevel = "medium"
	}

	fiscal, err := audit.MergeFiscal(e.cfg, input.FiscalOverrides)
	if err != nil {
		return ExecuteResult{Fiscal: fiscal}, err
	}

	root := input.RootAgentID
	if root == "" {
		root = delegation.ResolveRootAgent(input.Task)
	}
	task, policy := modes.ApplyToTask(input.Task, input.Mode)
	autoSpawn, autoReadOnly := router.Autonomy(input.AutoLevel)
	if input.AutoSpawn != nil {
		autoSpawn = *input.AutoSpawn
	}
	rootModel, _ := router.Resolve(e.cfg, root)

	metadata := map[string]any{}
	for k, v := range input.Metadata {
		metadata[k] = v
	}
	metadata["cli"] = "drenyra-go"
	metadata["autoLevel"] = input.AutoLevel
	metadata["autoReadOnly"] = autoReadOnly
	metadata["mode"] = string(policy.Mode)
	metadata["readOnly"] = policy.ReadOnly || autoReadOnly
	metadata["rootModel"] = rootModel.Model
	metadata["rootProvider"] = rootModel.Provider
	if e.brainClient != nil {
		brainFiscal := brain.FiscalContext{
			OrganizationID: fiscal.OrganizationID,
			CompanyID:      fiscal.CompanyID,
			CompanyRUC:     fiscal.CompanyRUC,
			Period:         fiscal.Period,
			UserID:         fiscal.UserID,
		}
		thread, err := e.brainClient.CreateThread(ctx, brain.CreateThreadRequest{
			Title:         task,
			SourceSurface: "cli",
			FiscalContext: brainFiscal,
		})
		if err != nil {
			return ExecuteResult{Task: task, RootAgentID: root, AutoLevel: input.AutoLevel, AutoSpawn: autoSpawn, Fiscal: fiscal}, err
		}
		turn, err := e.brainClient.StartTurn(ctx, thread.ID, brain.StartTurnRequest{
			Prompt:        task,
			SourceSurface: "cli",
			FiscalContext: brainFiscal,
		})
		if err != nil {
			return ExecuteResult{Task: task, RootAgentID: root, AutoLevel: input.AutoLevel, AutoSpawn: autoSpawn, Fiscal: fiscal}, err
		}
		metadata["brainThreadId"] = thread.ID
		metadata["brainTurnId"] = turn.ID
	}
	snap, err := e.loadSnapshot()
	if err != nil {
		return ExecuteResult{Task: task, RootAgentID: root, AutoLevel: input.AutoLevel, AutoSpawn: autoSpawn, Fiscal: fiscal}, err
	}
	for k, v := range memory.Metadata(snap) {
		metadata[k] = v
	}

	req := harness.ExecuteRequest{Task: task, RootAgentID: root, AutoSpawn: autoSpawn, Metadata: metadata}
	resp, err := e.newClient(e.cfg.Harness.API, fiscal).Execute(ctx, req)
	result := ExecuteResult{Response: resp, Task: task, RootAgentID: root, AutoLevel: input.AutoLevel, AutoSpawn: autoSpawn, Fiscal: fiscal, Request: req}
	if err != nil {
		return result, err
	}
	if resp != nil {
		result.Models = ResolveModelsForTree(e.cfg, resp.Tree)
		e.recordRun(task, root, input.AutoLevel, resp.TraceID, resp.Status)
	}
	return result, nil
}

// ResolveModelsForTree returns model IDs for every agent in the execution tree.
func ResolveModelsForTree(cfg *config.Config, node harness.RunNode) map[string]string {
	out := map[string]string{}
	collectModels(cfg, node, out)
	return out
}

func collectModels(cfg *config.Config, node harness.RunNode, out map[string]string) {
	if _, ok := out[node.AgentID]; !ok {
		if r, err := router.Resolve(cfg, node.AgentID); err == nil {
			out[node.AgentID] = r.Model
		}
	}
	for _, ch := range node.Children {
		collectModels(cfg, ch, out)
	}
}
