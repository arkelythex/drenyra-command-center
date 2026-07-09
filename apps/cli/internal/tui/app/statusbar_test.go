package app

import (
	"strings"
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/memory"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
)

func TestStatusBarProviderBadge(t *testing.T) {
	tui.Init(true)
	cfg := &config.Config{
		Fiscal: config.FiscalDefaults{
			CompanyRUC: "20601234565",
			Period:     "2024-01",
		},
		Providers: config.ProvidersConfig{Default: "openai-codex"},
	}
	got := renderStatusBar(cfg, screenMenu, "", "", agentModeBuild, false, memory.Snapshot{})
	if !strings.Contains(got, "openai-codex") {
		t.Errorf("expected provider badge in status bar, got:\n%s", got)
	}
	if !strings.Contains(got, "ready") {
		t.Errorf("expected 'ready' state in status bar, got:\n%s", got)
	}
}

func TestStatusBarPlain(t *testing.T) {
	tui.Init(true)
	cfg := &config.Config{
		Fiscal: config.FiscalDefaults{
			CompanyRUC: "20601234565",
			Period:     "2024-01",
		},
		Providers: config.ProvidersConfig{Default: "openai-codex"},
	}
	got := renderStatusBar(cfg, screenMenu, "", "", agentModeBuild, false, memory.Snapshot{})
	if strings.Contains(got, "\x1b[") {
		t.Errorf("plain mode should not have ANSI escapes, got:\n%s", got)
	}
}

func TestStatusBarConnectionDot(t *testing.T) {
	tui.Init(true)
	cfg := &config.Config{
		Fiscal: config.FiscalDefaults{
			CompanyRUC: "20601234565",
			Period:     "2024-01",
		},
		Providers: config.ProvidersConfig{Default: "openai-codex"},
	}
	got := renderStatusBar(cfg, screenMenu, "", "", agentModeBuild, false, memory.Snapshot{})
	// In plain mode, there will be no ANSI but the dot character should be present
	if !strings.Contains(got, "✓") && !strings.Contains(got, "ready") {
		t.Errorf("expected ready indicator in status bar, got:\n%s", got)
	}
}
