package app

import (
	"strings"
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
)

func TestRenderContextPanelEmpty(t *testing.T) {
	tui.Init(true)
	m := minimalModel()
	got := m.renderContextPanel(30, 20)
	if got != "" {
		t.Errorf("renderContextPanel(30, 20) should be empty, got %q", got)
	}
}

func TestRenderContextPanelSections(t *testing.T) {
	tui.Init(true)
	m := minimalModel()
	got := m.renderContextPanel(40, 30)
	if got == "" {
		t.Fatal("renderContextPanel(40, 30) should not be empty")
	}
	for _, title := range []string{"Fiscal", "Workflows", "Recent"} {
		if !strings.Contains(got, title) {
			t.Errorf("expected section %q in context panel, got:\n%s", title, got)
		}
	}
}

func TestRenderContextPanelPlain(t *testing.T) {
	tui.Init(true)
	m := minimalModel()
	got := m.renderContextPanel(40, 30)
	if strings.Contains(got, "\x1b[") {
		t.Errorf("plain mode should not have ANSI escapes, got:\n%s", got)
	}
}

func TestRenderFiscalSection(t *testing.T) {
	tui.Init(true)
	m := minimalModel()
	got := m.renderFiscalSection(40)
	if !strings.Contains(got, "20601234565") {
		t.Errorf("expected RUC in fiscal section, got:\n%s", got)
	}
	if !strings.Contains(got, "2024-01") {
		t.Errorf("expected period in fiscal section, got:\n%s", got)
	}
}

func TestRenderRecentSectionEmpty(t *testing.T) {
	tui.Init(true)
	m := minimalModel()
	m.taskRecall = nil
	got := m.renderRecentSection(40)
	if got != "" {
		t.Errorf("expected empty recent section, got:\n%s", got)
	}
}

func minimalModel() model {
	return model{
		cfg: &config.Config{
			Fiscal: config.FiscalDefaults{
				CompanyRUC: "20601234565",
				Period:     "2024-01",
			},
			Providers: config.ProvidersConfig{Default: "openai-codex"},
		},
		tuiCfg: config.TUIConfig{
			Theme:     "drenyra-dark",
			DiffStyle: "unified",
		},
		taskRecall: []string{"conciliar SUNAT marzo 2024", "revisar detracciones"},
		agentMode:  agentModeBuild,
	}
}
