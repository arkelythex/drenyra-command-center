package tui

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/delegation"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/router"
)

// DoctorCheck is one row for doctor output.
type DoctorCheck struct {
	OK     bool
	Label  string
	Detail string
}

// RenderDoctor prints health checks.
func RenderDoctor(checks []DoctorCheck, allOK bool) {
	Banner("System check")
	var rows strings.Builder
	for _, c := range checks {
		rows.WriteString(Check(c.OK, c.Label, c.Detail))
		rows.WriteString("\n")
	}
	fmt.Println(Panel("Diagnostics", strings.TrimRight(rows.String(), "\n")))
	if allOK {
		fmt.Println(Check(true, "ready", "harness reachable — run `drenyra run`"))
	} else {
		fmt.Println(Check(false, "ready", "fix issues above, then retry"))
	}
	fmt.Println()
}

// RenderAgentsList prints agents from API as a table.
func RenderAgentsList(maxDepth int, agentIDs []string) {
	Banner("Registered agents")
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
	fmt.Println(Panel("Harness registry", body))
	fmt.Println()
}

// RenderModelsList prints model routing table.
func RenderModelsList(defaultProvider string, fallback []string, routes []router.ResolvedModel) {
	Banner("Model routing")
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
	fmt.Println(Panel("Opper-style routes", body))
	fmt.Println()
}

// RenderModelRoute prints a single agent route card.
func RenderModelRoute(r router.ResolvedModel) {
	Banner("Route resolution")
	rows := []DoctorCheck{
		{true, "agent", r.AgentID},
		{true, "provider", r.Provider},
		{true, "model", r.Model},
	}
	if r.ReasoningEffort != "" {
		rows = append(rows, DoctorCheck{true, "reasoning", r.ReasoningEffort})
	}
	if len(r.Fallback) > 0 {
		rows = append(rows, DoctorCheck{true, "fallback", strings.Join(r.Fallback, ", ")})
	}
	var b strings.Builder
	for _, row := range rows {
		b.WriteString(Check(row.OK, row.Label, row.Detail))
		b.WriteString("\n")
	}
	fmt.Println(Panel(r.AgentID, strings.TrimRight(b.String(), "\n")))
	fmt.Println()
}

// RenderExecute prints harness run results (text mode).
func RenderExecute(resp *harness.ExecuteResponse, models map[string]string, task string) {
	Banner("Harness execution")
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

	fmt.Println(Panel("Run", strings.TrimRight(meta.String(), "\n")))

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
		fmt.Println(Panel("Models", Table([]string{"AGENT", "MODEL"}, rows)))
	}

	treeBody := PrintRunTree(resp.Tree, 0)
	fmt.Println(Panel("Delegation tree", treeBody))

	if th.Enabled && resp.Status == "pending_approval" {
		fmt.Println(th.Warn.Render("  ⚠ Material fiscal actions may require human approval in Drenyra UI"))
	}
	fmt.Println()
}

// RenderInitSuccess after config write.
func RenderInitSuccess(path string) {
	Banner("Configuration")
	fmt.Println(Panel("Init", Check(true, "config", path)))
	fmt.Println(thMuted("Next: drenyra doctor  →  drenyra run \"your task\""))
	fmt.Println()
}

// RenderConfig shows merged configuration.
func RenderConfig(cfg *config.Config, paths config.ConfigPaths) {
	Banner("Configuration")

	var harnessBody strings.Builder
	harnessBody.WriteString(KV("api", cfg.Harness.API))

	var fiscalBody strings.Builder
	fiscalBody.WriteString(KV("organization", cfg.Fiscal.OrganizationID) + "\n")
	fiscalBody.WriteString(KV("company", cfg.Fiscal.CompanyID) + "\n")
	fiscalBody.WriteString(KV("ruc", cfg.Fiscal.CompanyRUC) + "\n")
	fiscalBody.WriteString(KV("period", cfg.Fiscal.Period) + "\n")
	fiscalBody.WriteString(KV("user", cfg.Fiscal.UserID))

	var providersBody strings.Builder
	providersBody.WriteString(KV("default", cfg.Providers.Default))
	if len(cfg.Routing.Fallback) > 0 {
		providersBody.WriteString("\n" + KV("fallback", strings.Join(cfg.Routing.Fallback, ", ")))
	}

	fmt.Println(Panel("Harness", strings.TrimRight(harnessBody.String(), "\n")))
	fmt.Println(Panel("Fiscal defaults", strings.TrimRight(fiscalBody.String(), "\n")))
	fmt.Println(Panel("Providers", strings.TrimRight(providersBody.String(), "\n")))

	if len(cfg.Agents) > 0 {
		ids := make([]string, 0, len(cfg.Agents))
		for id := range cfg.Agents {
			ids = append(ids, id)
		}
		sort.Strings(ids)
		rows := make([][]string, 0, len(ids))
		for _, id := range ids {
			a := cfg.Agents[id]
			reasoning := a.ReasoningEffort
			if reasoning == "" {
				reasoning = "—"
			}
			provider := a.Provider
			if provider == "" {
				provider = cfg.Providers.Default
			}
			rows = append(rows, []string{id, provider, a.Model, reasoning})
		}
		fmt.Println(Panel("Agent routes", Table([]string{"AGENT", "PROVIDER", "MODEL", "REASONING"}, rows)))
	}

	var pathsBody strings.Builder
	pathsBody.WriteString(KV("global", paths.Global) + "\n")
	if paths.Project != "" {
		pathsBody.WriteString(KV("project", paths.Project))
	}
	fmt.Println(Panel("Sources", strings.TrimRight(pathsBody.String(), "\n")))
	fmt.Println()
}

// RenderConfigPaths prints config file locations.
func RenderConfigPaths(paths config.ConfigPaths) {
	Banner("Config paths")
	var body strings.Builder
	body.WriteString(Check(fileExists(paths.Global), "global", paths.Global))
	body.WriteString("\n")
	if paths.Project != "" {
		body.WriteString(Check(fileExists(paths.Project), "project", paths.Project))
	}
	fmt.Println(Panel("Paths", strings.TrimRight(body.String(), "\n")))
	fmt.Println()
}

// RenderConfigValidation prints validation results.
func RenderConfigValidation(issues []config.ValidationIssue) {
	Banner("Config validation")
	var body strings.Builder
	allOK := true
	for _, issue := range issues {
		body.WriteString(Check(issue.OK, issue.Field, issue.Message))
		body.WriteString("\n")
		if !issue.OK {
			allOK = false
		}
	}
	fmt.Println(Panel("Checks", strings.TrimRight(body.String(), "\n")))
	if allOK {
		fmt.Println(Check(true, "valid", "configuration OK"))
	} else {
		fmt.Println(Check(false, "valid", "fix issues above"))
	}
	fmt.Println()
}

// RenderSpawn prints a single-agent spawn result.
func RenderSpawn(node *harness.RunNode) {
	Banner("Agent spawn")
	var meta strings.Builder
	meta.WriteString(KV("run", node.RunID) + "\n")
	meta.WriteString(KV("agent", node.AgentID) + "\n")
	meta.WriteString(KV("depth", fmt.Sprintf("%d", node.Depth)) + "\n")
	meta.WriteString(KV("status", StatusBadge(node.Status)) + "\n")
	if node.Result.ExecutiveSummary != "" {
		meta.WriteString(KV("summary", node.Result.ExecutiveSummary))
	}
	fmt.Println(Panel("Spawn", strings.TrimRight(meta.String(), "\n")))

	treeBody := PrintRunTree(*node, 0)
	fmt.Println(Panel("Result tree", treeBody))
	fmt.Println()
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func thMuted(s string) string {
	if T().Enabled {
		return T().MutedText.Render(s)
	}
	return s
}

// WritePlain writes to stdout without styling (for non-TUI fallback).
func WritePlain(s string) {
	fmt.Fprint(os.Stdout, s)
}
