package app

import (
	"fmt"
	"strings"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/charmbracelet/lipgloss"
)

type panelSection int

const (
	panelFiscal    panelSection = iota
	panelAgents
	panelWorkflows
	panelRecent
)

var contextPanelSectionTitles = map[panelSection]string{
	panelFiscal:    "Fiscal",
	panelAgents:    "Agents",
	panelWorkflows: "Workflows",
	panelRecent:    "Recent",
}

func (m model) renderContextPanel(width, height int) string {
	if width < 36 {
		return ""
	}
	th := tui.T()

	sections := []string{
		m.renderFiscalSection(width),
		m.renderAgentStatusSection(width),
		m.renderWorkflowsSection(width),
		m.renderRecentSection(width),
	}

	var visible []string
	for _, s := range sections {
		if s != "" {
			visible = append(visible, s)
		}
	}

	content := lipgloss.JoinVertical(lipgloss.Left, visible...)

	if th.Enabled {
		return th.Panel.Copy().
			Width(width).
			Height(height).
			Render(content)
	}
	return strings.Join(visible, "\n")
}

func (m model) renderFiscalSection(width int) string {
	th := tui.T()
	cfg := m.cfg
	if cfg == nil {
		return ""
	}
	var b strings.Builder
	b.WriteString(tui.SectionTitle("Fiscal"))
	b.WriteString("\n")
	b.WriteString(fmt.Sprintf("RUC %s\n", cfg.Fiscal.CompanyRUC))
	b.WriteString(fmt.Sprintf("Period %s\n", cfg.Fiscal.Period))
	b.WriteString(fmt.Sprintf("Diff: %s\n", m.tuiCfg.DiffStyle))
	return th.MutedText.Render(b.String())
}

func (m model) renderAgentStatusSection(width int) string {
	th := tui.T()
	agents := []struct {
		name   string
		status string
		dot    string
	}{
		{"fiscal-sunat", "ready", "○"},
		{"hr-payroll", "idle", "●"},
		{"swarm-review", "ready", "○"},
	}
	var b strings.Builder
	b.WriteString(tui.SectionTitle("Agents"))
	for _, a := range agents {
		b.WriteString("\n")
		b.WriteString(th.SecondaryText.Render(a.dot + " "))
		b.WriteString(th.MutedText.Render(a.name))
	}
	return b.String()
}

func (m model) renderWorkflowsSection(width int) string {
	th := tui.T()
	workflows := []string{
		"review-sunat",
		"pre-pr",
		"bugfix-tdd",
		"architecture-check",
	}
	var b strings.Builder
	b.WriteString(tui.SectionTitle("Workflows"))
	for _, w := range workflows {
		b.WriteString("\n")
		b.WriteString(th.SecondaryText.Render("○ " + w))
	}
	return b.String()
}

func (m model) renderRecentSection(width int) string {
	th := tui.T()
	if len(m.taskRecall) == 0 {
		return ""
	}
	maxRecent := 5
	if len(m.taskRecall) < maxRecent {
		maxRecent = len(m.taskRecall)
	}
	var b strings.Builder
	b.WriteString(tui.SectionTitle("Recent"))
	for _, task := range m.taskRecall[:maxRecent] {
		b.WriteString("\n")
		b.WriteString(th.MutedText.Render("• " + truncateTask(task, width-6)))
	}
	return b.String()
}
