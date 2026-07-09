package app

import (
	"fmt"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
)

const (
	chromeHeaderLines = 2
	chromeStatusLines = 1
	chromeFooterLines = 1
	chromePromptLines = 2 // bottom `>` on home (agy-style)
	chromePadH        = 0

	contextPanelThreshold = 100

	// contextGap is the gap between the main content and the context panel.
	contextGap = 1
)

func breadcrumbFor(screen screen) string {
	switch screen {
	case screenMenu:
		return "Home"
	case screenRunTask:
		return "Home › Run task"
	case screenRunAuto:
		return "Home › Run task › Autonomy"
	case screenRunning:
		return "Home › Executing…"
	case screenResult:
		return "Home › Result"
	case screenDoctor:
		return "Home › Doctor"
	case screenContent:
		return "Home › View"
	case screenHelp:
		return "Home › Help"
	case screenApproval:
		return "Home › Approval"
	case screenCommandPalette:
		return "Home › Command Palette"
	case screenMemoryBrowser:
		return "Home › Memory Browser"
	default:
		return "Home"
	}
}

func fiscalChips(cfg *config.Config) []string {
	if cfg == nil {
		return nil
	}
	return []string{
		fmt.Sprintf("RUC %s", cfg.Fiscal.CompanyRUC),
		cfg.Fiscal.Period,
	}
}

func keyBarFor(screen screen, loading bool, focusMenu bool) []tui.KeyBind {
	if loading {
		return []tui.KeyBind{{Key: "…", Desc: "working"}}
	}
	switch screen {
	case screenMenu:
		if focusMenu {
			return []tui.KeyBind{
				{Key: "↑↓", Desc: "navigate"},
				{Key: "enter", Desc: "select"},
				{Key: "tab", Desc: "prompt"},
				{Key: "ctrl+p", Desc: "palette"},
				{Key: "ctrl+b", Desc: "mode"},
				{Key: "?", Desc: "help"},
				{Key: "q", Desc: "quit"},
			}
		}
		return []tui.KeyBind{
			{Key: "enter", Desc: "run"},
			{Key: "↑↓", Desc: "recall"},
			{Key: "ctrl+p", Desc: "palette"},
			{Key: "ctrl+b", Desc: "mode"},
			{Key: "/", Desc: "commands"},
			{Key: "?", Desc: "help"},
			{Key: "tab", Desc: "menu"},
			{Key: "esc esc", Desc: "clear"},
		}
	case screenRunTask:
		return []tui.KeyBind{
			{Key: "enter", Desc: "continue"},
			{Key: "esc", Desc: "back"},
			{Key: "ctrl+p", Desc: "palette"},
			{Key: "ctrl+b", Desc: "mode"},
			{Key: "?", Desc: "help"},
			{Key: "q", Desc: "quit"},
		}
	case screenRunAuto:
		return []tui.KeyBind{
			{Key: "↑↓", Desc: "level"},
			{Key: "enter", Desc: "run"},
			{Key: "esc", Desc: "back"},
			{Key: "ctrl+p", Desc: "palette"},
			{Key: "ctrl+b", Desc: "mode"},
			{Key: "?", Desc: "help"},
		}
	case screenApproval:
		return []tui.KeyBind{
			{Key: "y", Desc: "acknowledge"},
			{Key: "n", Desc: "home"},
			{Key: "esc", Desc: "home"},
		}
	case screenCommandPalette:
		return []tui.KeyBind{
			{Key: "type", Desc: "filter"},
			{Key: "↑↓", Desc: "navigate"},
			{Key: "enter", Desc: "run"},
			{Key: "esc", Desc: "close"},
		}
	case screenMemoryBrowser:
		return []tui.KeyBind{
			{Key: "type", Desc: "query"},
			{Key: "enter", Desc: "search"},
			{Key: "↑↓", Desc: "results"},
			{Key: "esc", Desc: "home"},
		}
	case screenResult, screenDoctor, screenContent, screenHelp:
		return []tui.KeyBind{
			{Key: "↑↓", Desc: "scroll"},
			{Key: "ctrl+l", Desc: "clear"},
			{Key: "esc", Desc: "home"},
			{Key: "ctrl+p", Desc: "palette"},
			{Key: "ctrl+b", Desc: "mode"},
			{Key: "?", Desc: "help"},
			{Key: "q", Desc: "quit"},
		}
	default:
		return []tui.KeyBind{{Key: "esc", Desc: "back"}, {Key: "?", Desc: "help"}, {Key: "q", Desc: "quit"}}
	}
}

// bodySize returns the usable width and height for the main content area
// after subtracting chrome (header, status, footer, prompt).
// Panel deduction (for split layout) happens in View(), not here.
func bodySize(width, height int, screen screen) (int, int) {
	w := width - chromePadH*2
	if w < 20 {
		w = 20
	}
	h := height - chromeHeaderLines - chromeStatusLines - chromeFooterLines - 2
	if screen == screenMenu {
		h -= chromePromptLines
	}
	if h < 4 {
		h = 4
	}
	return w, h
}

// contextPanelWidth returns the width of the right context panel.
// Returns 0 when terminal is below the threshold (no panel shown).
func contextPanelWidth(totalWidth int) int {
	if totalWidth < contextPanelThreshold {
		return 0
	}
	w := totalWidth * 40 / 100
	if w < 36 {
		return 36
	}
	if w > 60 {
		return 60
	}
	return w
}
