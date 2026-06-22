package tui

import (
	"fmt"
	"sort"
	"strings"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/delegation"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/router"
)

// FormatAgentStack returns the delegation graph as a string (TUI-safe).
func FormatAgentStack() string {
	th := T()

	type line struct {
		prefix    string
		connector string
		agentID   string
		tier      string
		extra     string
	}

	lines := []line{
		{"", "", "arkelythex-orchestrator", "tier0", ""},
		{"  ", "└── ", "drenyra-sdd-orchestrator", "tier1", ""},
		{"      ", "├── ", "fiscal-command-orchestrator", "tier2", ""},
		{"      │   ", "├── ", "fiscal-sunat-agent", "tier3", "→ fiscal-sunat-payload-agent"},
		{"      │   ", "├── ", "fiscal-ledger-agent", "tier3", ""},
		{"      │   ", "└── ", "fiscal-reconcile-agent", "tier3", ""},
		{"      ", "├── ", "ai-swarm-orchestrator", "tier2", ""},
		{"      │   ", "├── ", "swarm-codegen-agent", "tier3", ""},
		{"      │   ", "├── ", "swarm-test-agent", "tier3", ""},
		{"      │   ", "└── ", "swarm-review-agent", "tier3", ""},
		{"      ", "└── ", "drenyra-hr-orchestrator", "tier2", ""},
		{"          ", "├── ", "hr-payroll-agent", "tier3", ""},
		{"          ", "└── ", "hr-compliance-agent", "tier3", ""},
	}

	var b strings.Builder
	for _, ln := range lines {
		if th.Enabled {
			b.WriteString(th.TreeLine.Render(ln.prefix + ln.connector))
			b.WriteString(TierBadge(ln.tier))
			b.WriteString(" ")
			b.WriteString(th.TreeAgent.Render(ln.agentID))
			if ln.extra != "" {
				b.WriteString(" ")
				b.WriteString(th.MutedText.Render(ln.extra))
			}
			b.WriteString("\n")
			continue
		}
		b.WriteString(fmt.Sprintf("%s%s %s %s %s\n", ln.prefix, ln.connector, ln.tier, ln.agentID, ln.extra))
	}
	return Panel("Delegation graph", strings.TrimRight(b.String(), "\n"))
}

// FormatDoctor returns doctor diagnostics as a string.
func FormatDoctor(checks []DoctorCheck, allOK bool) string {
	var rows strings.Builder
	for _, c := range checks {
		rows.WriteString(Check(c.OK, c.Label, c.Detail))
		rows.WriteString("\n")
	}
	body := Panel("Diagnostics", strings.TrimRight(rows.String(), "\n"))
	var ready string
	if allOK {
		ready = Check(true, "ready", "harness reachable — run a task from the menu")
	} else {
		ready = Check(false, "ready", "fix issues above, then retry")
	}
	return body + "\n" + ready
}

// FormatModelsList returns model routing table as a string.
func FormatModelsList(defaultProvider string, fallback []string, routes []router.ResolvedModel) string {
	meta := KV("provider", defaultProvider) + "\n" + KV("fallback", strings.Join(fallback, ", "))
	rows := make([][]string, 0, len(routes))
	for _, r := range routes {
		reasoning := r.ReasoningEffort
		if reasoning == "" {
			reasoning = "—"
		}
		rows = append(rows, []string{r.AgentID, r.Provider, r.Model, reasoning})
	}
	body := meta + "\n\n" + Table([]string{"AGENT", "PROVIDER", "MODEL", "REASONING"}, rows)
	return Panel("Opper-style routes", body)
}

// FormatExecuteResult returns harness run output as a string (RenderExecute logic).
func FormatExecuteResult(resp *harness.ExecuteResponse, models map[string]string, task string) string {
	th := T()

	var meta strings.Builder
	meta.WriteString(KV("trace", resp.TraceID) + "\n")
	meta.WriteString(KV("root", resp.RootAgentID) + "\n")
	meta.WriteString(KV("status", StatusBadge(resp.Status)) + "\n")
	if resp.Message != "" {
		meta.WriteString(KV("message", resp.Message) + "\n")
	}
	if task != "" {
		short := task
		if len(short) > 80 {
			short = short[:77] + "..."
		}
		meta.WriteString(KV("task", short) + "\n")
	}
	meta.WriteString(KV("summary", resp.ExecutiveSummary))

	var b strings.Builder
	b.WriteString(Panel("Run", strings.TrimRight(meta.String(), "\n")))
	b.WriteString("\n")

	if len(models) > 0 {
		ids := make([]string, 0, len(models))
		for id := range models {
			ids = append(ids, id)
		}
		sort.Strings(ids)
		rows := make([][]string, 0, len(ids))
		for _, id := range ids {
			rows = append(rows, []string{id, models[id]})
		}
		b.WriteString(Panel("Models", Table([]string{"AGENT", "MODEL"}, rows)))
		b.WriteString("\n")
	}

	treeBody := PrintRunTree(resp.Tree, 0)
	b.WriteString(Panel("Delegation tree", treeBody))

	if th.Enabled && resp.Status == "pending_approval" {
		b.WriteString("\n")
		b.WriteString(th.Warn.Render("  ⚠ Material fiscal actions may require human approval in Drenyra UI"))
	}

	return b.String()
}

// FormatAgentsList returns harness registry agents as a string.
func FormatAgentsList(maxDepth int, agentIDs []string) string {
	rows := make([][]string, 0, len(agentIDs))
	for _, id := range agentIDs {
		tier, label := "—", "—"
		if a, ok := delegation.Agents[id]; ok {
			tier, label = a.Tier, a.Label
		}
		tierCell := tier
		if T().Enabled {
			tierCell = T().TreeTier.Render(tier)
		}
		rows = append(rows, []string{id, tierCell, label})
	}
	body := KV("max_depth", fmt.Sprintf("%d", maxDepth)) + "\n\n"
	body += Table([]string{"AGENT", "TIER", "LABEL"}, rows)
	return Panel("Harness registry", body)
}
