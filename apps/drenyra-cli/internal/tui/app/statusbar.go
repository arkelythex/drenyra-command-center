package app

import (
	"fmt"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
)

func renderStatusBar(cfg *config.Config, screen screen, task, autoLevel string, mode agentMode, loading bool, mem memory.Snapshot) string {
	th := tui.T()
	if cfg == nil {
		return ""
	}

	// Connection health dot
	connDot := th.OK.Render("✓")
	if loading {
		connDot = th.Warn.Render("◌")
	}
	switch screen {
	case screenRunning:
		connDot = th.Warn.Render("◌")
	case screenResult:
		connDot = th.OK.Render("✓")
	case screenDoctor:
		connDot = th.InfoStyle.Render("◇")
	}

	state := "ready"
	if loading {
		state = "running"
	}
	switch screen {
	case screenRunning:
		state = "executing"
	case screenResult:
		state = "done"
	case screenDoctor:
		state = "doctor"
	}

	parts := []string{
		fmt.Sprintf("%s harness %s", connDot, state),
		"mode:" + mode.Label(),
		fmt.Sprintf("RUC %s", cfg.Fiscal.CompanyRUC),
		cfg.Fiscal.Period,
	}
	if task != "" {
		short := task
		if len(short) > 32 {
			short = short[:29] + "..."
		}
		parts = append(parts, "task:"+short)
	}
	if autoLevel != "" {
		parts = append(parts, "auto:"+autoLevel)
	}
	memLine := memory.StatusLine(mem)
	if mem.NeedsConsolidation() {
		memLine = th.Warn.Render(memLine + " · consolidate")
	}
	parts = append(parts, memLine)

	// Provider badge
	if cfg.Providers.Default != "" {
		parts = append(parts, "provider:"+cfg.Providers.Default)
	}

	line := th.MutedText.Render("  ")
	for i, p := range parts {
		if i > 0 {
			line += th.MutedText.Render(" · ")
		}
		line += th.SecondaryText.Render(p)
	}
	return th.FooterBar.Copy().BorderTop(false).Render(line)
}
