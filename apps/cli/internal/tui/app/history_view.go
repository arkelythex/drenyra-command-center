package app

import (
	"time"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/history"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
)

func (m model) formatHistoryView(query string) string {
	entries, err := history.Search(query, 25)
	if err != nil {
		return m.formatError(err)
	}
	if len(entries) == 0 {
		return tui.Panel("Session history", tui.T().MutedText.Render("No runs yet. Execute a task from the prompt."))
	}
	rows := make([][]string, 0, len(entries))
	for _, e := range entries {
		rows = append(rows, []string{
			e.At.Format(time.RFC3339),
			truncateTask(e.Task, 36),
			e.RootAgent,
			e.AutoLevel,
			e.Status,
		})
	}
	body := tui.Table([]string{"WHEN", "TASK", "ROOT", "AUTO", "STATUS"}, rows)
	return tui.Panel("Session history (search: drenyra history search)", body)
}

func (m *model) recallOlder() {
	if len(m.taskRecall) == 0 {
		return
	}
	next := m.recallIdx + 1
	if next >= len(m.taskRecall) {
		return
	}
	m.recallIdx = next
	m.taskInput.SetValue(m.taskRecall[m.recallIdx])
}

func (m *model) recallNewer() {
	if m.recallIdx <= 0 {
		m.recallIdx = -1
		m.taskInput.SetValue("")
		return
	}
	m.recallIdx--
	m.taskInput.SetValue(m.taskRecall[m.recallIdx])
}
