package app

import (
	"context"
	"fmt"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/memory"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type memoryBrowserState struct {
	Status        memory.DBStatus
	StatusMessage string
	Results       []memory.SearchResult
	Cursor        int
	Searched      bool
	Error         string
}

func newMemorySearchInput(th tui.Theme) textinput.Model {
	input := textinput.New()
	input.Placeholder = "Search local memory DB…"
	input.CharLimit = 160
	input.Width = 56
	input.Prompt = "⌕ "
	input.PromptStyle = lipgloss.NewStyle().Foreground(th.Accent).Bold(true)
	input.TextStyle = lipgloss.NewStyle().Foreground(th.Text)
	input.PlaceholderStyle = lipgloss.NewStyle().Foreground(th.Muted).Italic(true)
	input.Cursor.Style = lipgloss.NewStyle().Foreground(th.Accent)
	return input
}

func loadMemoryBrowserState(ctx context.Context) memoryBrowserState {
	status, err := memory.LocalDBStatusReadOnly(ctx)
	state := memoryBrowserState{Status: status}
	if err != nil {
		state.StatusMessage = "Local DB not initialized yet. Run a task, add memory, or use drenyra memory db-status."
		return state
	}
	return state
}

func (m model) openMemoryBrowser() model {
	if snap, err := memory.LoadSnapshot(); err == nil {
		m.memSnap = snap
	}
	m.memoryBrowser = loadMemoryBrowserState(context.Background())
	m.memoryInput.SetValue("")
	m.memoryInput.Focus()
	m.taskInput.Blur()
	m.paletteInput.Blur()
	m.screen = screenMemoryBrowser
	m.applyLayout()
	return m
}

func (m model) handleMemoryBrowserKey(key string, msg tea.KeyMsg) (model, tea.Cmd) {
	switch key {
	case "ctrl+c":
		return m, tea.Quit
	case "esc":
		m.screen = screenMenu
		m.focusMenu = false
		m.memoryInput.Blur()
		m.taskInput.Focus()
		m.applyLayout()
		return m, textinput.Blink
	case "up":
		m.memoryBrowser.Cursor = clampMemoryCursor(m.memoryBrowser.Cursor-1, m.memoryBrowser.Results)
		return m, nil
	case "down":
		m.memoryBrowser.Cursor = clampMemoryCursor(m.memoryBrowser.Cursor+1, m.memoryBrowser.Results)
		return m, nil
	case "enter":
		m = m.searchMemoryBrowser()
		return m, nil
	}

	before := m.memoryInput.Value()
	var cmd tea.Cmd
	m.memoryInput, cmd = m.memoryInput.Update(msg)
	if m.memoryInput.Value() != before {
		m.memoryBrowser.Cursor = 0
	}
	return m, cmd
}

func (m model) searchMemoryBrowser() model {
	query := strings.TrimSpace(m.memoryInput.Value())
	m.memoryBrowser.Searched = query != ""
	m.memoryBrowser.Results = nil
	m.memoryBrowser.Cursor = 0
	m.memoryBrowser.Error = ""
	if query == "" {
		return m
	}
	results, err := memory.SearchLocalDBReadOnly(context.Background(), query, 25)
	if err != nil {
		m.memoryBrowser.Error = err.Error()
		return m
	}
	m.memoryBrowser.Results = results
	return m
}

func clampMemoryCursor(cursor int, results []memory.SearchResult) int {
	if len(results) == 0 || cursor < 0 {
		return 0
	}
	if cursor >= len(results) {
		return len(results) - 1
	}
	return cursor
}

func memoryStatusLine(status memory.DBStatus) string {
	return fmt.Sprintf("DB %s · sessions:%d · runs:%d · memories:%d · decisions:%d · bugs:%d",
		status.Path, status.Sessions, status.Runs, status.Memories, status.Decisions, status.Bugs)
}

func memorySnapshotLine(s memory.Snapshot) string {
	return fmt.Sprintf("MEMORY %d/%d (%.0f%%) · USER %d/%d (%.0f%%)",
		s.MemoryUsed, s.MemoryLimit, s.MemoryPct(), s.UserUsed, s.UserLimit, s.UserPct())
}

func (m model) renderMemoryBrowser(bodyW, bodyH int) string {
	th := tui.T()
	state := m.memoryBrowser
	lines := []string{
		tui.SectionTitle("Memory Browser"),
		th.MutedText.Render("Local SQLite/FTS search · markdown memory remains editable via drenyra memory show/edit"),
		"",
		memorySnapshotLine(m.memSnap),
		memoryStatusLine(state.Status),
	}
	if state.StatusMessage != "" {
		lines = append(lines, th.MutedText.Render(state.StatusMessage))
	}
	if state.Error != "" {
		lines = append(lines, th.Err.Render(state.Error))
	}
	lines = append(lines, "", m.memoryInput.View(), "")

	if !state.Searched {
		lines = append(lines, th.MutedText.Render("Type a query and press Enter. Results include runs, memories, decisions, and bugs."))
	} else if len(state.Results) == 0 {
		lines = append(lines, th.MutedText.Render("No local memory matches."))
	} else {
		visible := bodyH - len(lines) - 4
		if visible < 4 {
			visible = 4
		}
		cursor := clampMemoryCursor(state.Cursor, state.Results)
		start := 0
		if cursor >= visible {
			start = cursor - visible + 1
		}
		end := start + visible
		if end > len(state.Results) {
			end = len(state.Results)
		}
		for i := start; i < end; i++ {
			result := state.Results[i]
			prefix := "  "
			style := th.TableCell
			if i == cursor {
				prefix = "▸ "
				style = th.SelectedRow
			}
			row := fmt.Sprintf("%s%s · %s — %s", prefix, result.Kind, result.Title, truncateTask(strings.ReplaceAll(result.Content, "\n", " "), bodyW/2))
			if th.Enabled {
				row = style.Render(row)
			}
			lines = append(lines, row)
		}
	}

	content := lipgloss.JoinVertical(lipgloss.Left, lines...)
	return tui.ContentFrame(content, bodyW, bodyH)
}
