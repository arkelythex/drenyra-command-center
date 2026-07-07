package cmd

import (
	"context"
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/history"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/version"
	"github.com/spf13/cobra"
)

// latinAgents is the canonical 8-agent roster for the status dashboard.
var latinAgents = []struct {
	ID      string
	Role    string
	Default string // default status when no live data
}{
	{"Cerno", "financial analysis", "active"},
	{"Custos", "compliance", "idle"},
	{"Necto", "operations", "active"},
	{"Regula", "governance", "idle"},
	{"Lumen", "analysis", "idle"},
	{"Fusio", "reconciliation", "active"},
	{"Scripta", "reporting", "idle"},
	{"Capsa", "document storage", "idle"},
}

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "System dashboard — health, recent work, agents, system info",
	Long: `Display a comprehensive status dashboard for the Drenyra ecosystem.

Shows system health, recent activity, Latin Moderno agent status,
and system information in a clean Pi CLI-style layout.

Running 'drenyra' without any subcommand also shows this dashboard.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		return runStatus(cmd.Context())
	},
}

func runStatus(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		// Still render partial dashboard with config error
		cfg = &config.Config{}
	}

	tui.Banner("STATUS")
	fmt.Println()

	// ── System Health ──
	healthBody := renderHealth(ctx, cfg)
	fmt.Println(tui.Panel(" System Health", healthBody))
	fmt.Println()

	// ── Recent Work ──
	recentBody := renderRecent()
	fmt.Println(tui.Panel(" Recent Work", recentBody))
	fmt.Println()

	// ── Latin Moderno Agents ──
	agentsBody := renderAgents()
	fmt.Println(tui.Panel(" Latin Moderno Agents", agentsBody))
	fmt.Println()

	// ── System Info ──
	sysBody := renderSysInfo()
	fmt.Println(tui.Panel(" System", sysBody))
	fmt.Println()

	// ── Quick Reference ──
	tui.RenderKeyBar([]tui.KeyBind{
		{Key: " drenyra run ", Desc: "Execute a task"},
		{Key: " drenyra doctor ", Desc: "Full diagnostics"},
		{Key: " drenyra history ", Desc: "Browse recent work"},
		{Key: " drenyra config ", Desc: "Configuration"},
		{Key: " drenyra tui ", Desc: "Interactive UI"},
	})
	fmt.Println()

	return nil
}

// renderHealth builds the health panel rows.
func renderHealth(ctx context.Context, cfg *config.Config) string {
	var rows string

	// Config
	globalPath, _ := config.GlobalPath()
	if _, err := os.Stat(globalPath); err != nil {
		rows += tui.Check(false, "config", fmt.Sprintf("%s (run: drenyra init)", globalPath)) + "\n"
	} else {
		rows += tui.Check(true, "config", globalPath) + "\n"
	}

	// Fiscal context
	if cfg.Fiscal.CompanyRUC != "" {
		rows += tui.Check(true, "fiscal", fmt.Sprintf("%s · %s · org %s",
			cfg.Fiscal.CompanyRUC, cfg.Fiscal.Period, cfg.Fiscal.OrganizationID)) + "\n"
	} else {
		rows += tui.Check(false, "fiscal", "not configured (run: drenyra init)") + "\n"
	}

	// Memory
	if err := memory.EnsureDefaults(); err != nil {
		rows += tui.Check(false, "memory", err.Error()) + "\n"
	} else {
		snap, _ := memory.LoadSnapshot()
		detail := memory.StatusLine(snap)
		if snap.NeedsConsolidation() {
			detail += " (run: drenyra memory edit)"
		}
		rows += tui.Check(true, "memory", detail) + "\n"
	}

	// Harness API
	if cfg.Harness.API != "" {
		client := harness.NewClient(cfg.Harness.API, harness.FiscalContext{})
		pingErr := client.Ping(ctx)
		if pingErr != nil {
			rows += tui.Check(false, "harness", pingErr.Error()) + "\n"
		} else {
			rows += tui.Check(true, "harness", cfg.Harness.API) + "\n"
		}
	} else {
		rows += tui.Check(false, "harness", "no API endpoint configured") + "\n"
	}

	return rows
}

// renderRecent builds the recent work panel from history.
func renderRecent() string {
	entries, err := history.Search("", 5)
	if err != nil || len(entries) == 0 {
		return tui.T().MutedText.Render("No recent work. Run: drenyra run \"your task\"")
	}

	var rows string
	for _, e := range entries {
		age := formatAge(time.Since(e.At))
		rows += fmt.Sprintf("  %-12s %s\n",
			tui.T().MutedText.Render(age),
			e.Task)
	}
	return rows
}

// renderAgents builds the Latin Moderno agent status panel.
func renderAgents() string {
	var rows string
	for _, a := range latinAgents {
		id := tui.TierBadge(a.ID)
		role := tui.T().MutedText.Render(a.Role)
		status := tui.StatusBadge(a.Default)
		rows += fmt.Sprintf("  %-6s  %-24s %s\n", id, role, status)
	}
	return rows
}

// renderSysInfo builds the system information panel.
func renderSysInfo() string {
	ver := version.Short()
	goVer := runtime.Version()
	platform := fmt.Sprintf("%s/%s", runtime.GOOS, runtime.GOARCH)
	now := time.Now().Format("2006-01-02 15:04")

	var rows string
	rows += tui.KV("Version", fmt.Sprintf("%s · %s · %s", ver, goVer, platform)) + "\n"
	rows += tui.KV("Built", now) + "\n"

	return rows
}

// formatAge returns a human-readable age string like "5m ago" or "2h ago".
func formatAge(d time.Duration) string {
	switch {
	case d < time.Minute:
		return "just now"
	case d < time.Hour:
		m := int(d.Minutes())
		if m == 1 {
			return "1m ago"
		}
		return fmt.Sprintf("%dm ago", m)
	case d < 24*time.Hour:
		h := int(d.Hours())
		if h == 1 {
			return "1h ago"
		}
		return fmt.Sprintf("%dh ago", h)
	default:
		d2 := int(d.Hours() / 24)
		if d2 == 1 {
			return "1d ago"
		}
		return fmt.Sprintf("%dd ago", d2)
	}
}

func init() {
	rootCmd.AddCommand(statusCmd)
}
