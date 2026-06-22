package router

import (
	"fmt"
	"strings"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
)

// ResolvedModel is the model choice for an agent run.
type ResolvedModel struct {
	AgentID         string
	Model           string
	Provider        string
	ReasoningEffort string
	Fallback        []string
}

// Resolve picks model config for an agent with global fallback chain.
func Resolve(cfg *config.Config, agentID string) (ResolvedModel, error) {
	agentCfg, ok := cfg.Agents[agentID]
	if !ok {
		return ResolvedModel{}, fmt.Errorf("no model mapping for agent %q in config", agentID)
	}
	provider := agentCfg.Provider
	if provider == "" {
		provider = cfg.Providers.Default
	}
	return ResolvedModel{
		AgentID:         agentID,
		Model:           agentCfg.Model,
		Provider:        provider,
		ReasoningEffort: agentCfg.ReasoningEffort,
		Fallback:        append([]string(nil), cfg.Routing.Fallback...),
	}, nil
}

// Format prints resolved model for CLI.
func (r ResolvedModel) Format() string {
	var b strings.Builder
	fmt.Fprintf(&b, "agent=%s provider=%s model=%s", r.AgentID, r.Provider, r.Model)
	if r.ReasoningEffort != "" {
		fmt.Fprintf(&b, " reasoning=%s", r.ReasoningEffort)
	}
	if len(r.Fallback) > 0 {
		fmt.Fprintf(&b, " fallback=[%s]", strings.Join(r.Fallback, ", "))
	}
	return b.String()
}

// Autonomy maps Droid-style --auto to harness autoSpawn.
func Autonomy(level string) (autoSpawn bool, readOnly bool) {
	switch strings.ToLower(level) {
	case "low":
		return false, true
	case "medium":
		return true, false
	case "high":
		return true, false
	default:
		return true, false
	}
}
