package app

import (
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	"github.com/charmbracelet/lipgloss"
)

func (m model) View() string {
	th := tui.T()
	bodyW, bodyH := bodySize(m.width, m.height, m.screen)

	header := tui.RenderHeader(m.width, breadcrumbFor(m.screen), fiscalChips(m.cfg))
	status := renderStatusBar(m.cfg, m.screen, m.task, m.autoLevel, m.agentMode, m.loading, m.memSnap)
	footer := tui.RenderKeyBar(keyBarFor(m.screen, m.loading, m.focusMenu))

	var body string
	switch {
	case m.loading:
		body = m.renderLoading(bodyW, bodyH)
	case m.screen == screenMenu:
		body = m.renderHome(bodyW, bodyH)
	case m.screen == screenRunTask:
		body = tui.PadBody(m.renderRunTask(bodyW), bodyW)
	case m.screen == screenRunAuto:
		body = tui.PadBody(m.renderRunAuto(), bodyW)
	case m.screen == screenApproval:
		body = tui.PadBody(m.content, bodyW)
	case m.screen == screenCommandPalette:
		body = m.renderCommandPalette(bodyW, bodyH)
	case m.screen == screenMemoryBrowser:
		body = m.renderMemoryBrowser(bodyW, bodyH)
	case m.screen == screenResult, m.screen == screenDoctor, m.screen == screenContent, m.screen == screenHelp:
		body = tui.ContentFrame(m.viewport.View(), bodyW, bodyH)
	default:
		body = ""
	}

	if !th.Enabled {
		return header + "\n" + status + "\n" + body + "\n" + footer
	}

	parts := []string{header, body}
	if status != "" {
		parts = append(parts, status)
	}
	if m.screen == screenMenu && !m.loading {
		parts = append(parts, m.renderPromptLine(bodyW))
	}
	parts = append(parts, footer)
	return lipgloss.JoinVertical(lipgloss.Left, parts...)
}

func (m model) renderHome(bodyW, bodyH int) string {
	th := tui.T()
	hint := th.MutedText.Render("Harness + memory snapshot · Ctrl+B Plan/Build · task below · ↑↓ recall · Tab → menu · ? help")
	if m.memSnap.NeedsConsolidation() {
		hint = th.Warn.Render("Memory >80% — drenyra memory edit to consolidate") + "\n" + hint
	}
	if w := m.homeWelcomeLine(); w != "" {
		hint = lipgloss.JoinVertical(lipgloss.Left, hint, "", w)
	}
	section := tui.SectionTitle("Actions")
	listH := bodyH - 4
	if listH < 4 {
		listH = 4
	}

	mainW := bodyW
	panelW := contextPanelWidth(bodyW)
	var panel string
	if panelW > 0 {
		panel = m.renderContextPanel(panelW, bodyH)
		mainW = bodyW - panelW - contextGap
		if mainW < 48 {
			mainW = bodyW
			panel = ""
		}
	}

	m.menu.SetSize(mainW, listH)
	listView := m.menu.View()
	inner := lipgloss.JoinVertical(lipgloss.Left, hint, "", section, "", listView)
	main := tui.PadBody(inner, mainW)

	if panel == "" {
		return main
	}
	return lipgloss.JoinHorizontal(lipgloss.Top, main, "  ", panel)
}

func (m model) renderPromptLine(bodyW int) string {
	th := tui.T()
	line := m.taskInput.View()
	if !th.Enabled {
		return line
	}
	return th.FooterBar.Copy().
		BorderTop(true).
		BorderBottom(false).
		Width(bodyW).
		Render("  " + line)
}

func (m model) renderLoading(bodyW, bodyH int) string {
	th := tui.T()
	label := th.MutedText.Render(m.loadingLabel)
	inner := lipgloss.JoinVertical(lipgloss.Center, m.spinner.View(), "", label)
	return tui.CenterBlock(inner, bodyW, bodyH)
}

func (m model) renderRunTask(bodyW int) string {
	th := tui.T()
	return lipgloss.JoinVertical(lipgloss.Left,
		tui.SectionTitle("Task"),
		th.MutedText.Render("Root agent is inferred from keywords (SUNAT, payroll, refactor…)"),
		"",
		m.taskInput.View(),
	)
}

func (m model) renderRunAuto() string {
	return lipgloss.JoinVertical(lipgloss.Left,
		tui.SectionTitle("Autonomy"),
		tui.T().MutedText.Render("Maps to harness autoSpawn · mode: "+m.agentMode.Label()),
		"",
		m.autoList.View(),
	)
}
