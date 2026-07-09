package app

import (
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type commandPaletteEntry struct {
	ID          string
	Title       string
	Description string
	Action      slashAction
}

func defaultCommandPaletteEntries() []commandPaletteEntry {
	return []commandPaletteEntry{
		{ID: "doctor", Title: "Doctor", Description: "Run config and harness health checks", Action: slashDoctor},
		{ID: "agents", Title: "Agents", Description: "Show delegation tree and registry", Action: slashAgents},
		{ID: "models", Title: "Models", Description: "Show per-agent model routing", Action: slashModels},
		{ID: "memory", Title: "Memory", Description: "Open local memory browser and search", Action: slashMemory},
		{ID: "history", Title: "History", Description: "Show recent task runs", Action: slashHistory},
		{ID: "resume", Title: "Resume", Description: "Load the last task into the prompt", Action: slashResume},
		{ID: "menu", Title: "Menu", Description: "Return to the home action menu", Action: slashMenu},
		{ID: "clear", Title: "Clear", Description: "Clear the bottom prompt", Action: slashClear},
		{ID: "help", Title: "Help", Description: "Open contextual help", Action: slashHelp},
		{ID: "quit", Title: "Quit", Description: "Exit Drenyra CLI", Action: slashQuit},
	}
}

func filterCommandPalette(entries []commandPaletteEntry, query string) []commandPaletteEntry {
	needle := strings.ToLower(strings.TrimSpace(query))
	if needle == "" {
		return append([]commandPaletteEntry(nil), entries...)
	}
	filtered := make([]commandPaletteEntry, 0, len(entries))
	for _, entry := range entries {
		haystack := strings.ToLower(entry.ID + " " + entry.Title + " " + entry.Description)
		if strings.Contains(haystack, needle) {
			filtered = append(filtered, entry)
		}
	}
	return filtered
}

func clampPaletteCursor(cursor int, entries []commandPaletteEntry) int {
	if len(entries) == 0 {
		return 0
	}
	if cursor < 0 {
		return 0
	}
	if cursor >= len(entries) {
		return len(entries) - 1
	}
	return cursor
}

func selectedCommandPaletteAction(entries []commandPaletteEntry, cursor int) (slashAction, bool) {
	if len(entries) == 0 {
		return slashNone, false
	}
	cursor = clampPaletteCursor(cursor, entries)
	return entries[cursor].Action, true
}

func (m model) filteredPaletteEntries() []commandPaletteEntry {
	return filterCommandPalette(m.paletteEntries, m.paletteInput.Value())
}

func (m model) openCommandPalette() model {
	m.paletteReturnScreen = m.screen
	m.paletteReturnFocus = m.focusMenu
	m.paletteCursor = 0
	m.paletteInput.SetValue("")
	m.paletteInput.Focus()
	m.taskInput.Blur()
	m.screen = screenCommandPalette
	m.applyLayout()
	return m
}

func (m model) closeCommandPalette() (model, tea.Cmd) {
	m.screen = m.paletteReturnScreen
	m.focusMenu = m.paletteReturnFocus
	m.paletteInput.Blur()
	if m.screen == screenMenu && !m.focusMenu {
		m.taskInput.Focus()
		return m, textinput.Blink
	}
	return m, nil
}

func (m model) handleCommandPaletteKey(key string, msg tea.KeyMsg) (model, tea.Cmd) {
	switch key {
	case "ctrl+c":
		return m, tea.Quit
	case "esc":
		return m.closeCommandPalette()
	case "up":
		m.paletteCursor--
		m.paletteCursor = clampPaletteCursor(m.paletteCursor, m.filteredPaletteEntries())
		return m, nil
	case "down":
		m.paletteCursor++
		m.paletteCursor = clampPaletteCursor(m.paletteCursor, m.filteredPaletteEntries())
		return m, nil
	case "enter":
		action, ok := selectedCommandPaletteAction(m.filteredPaletteEntries(), m.paletteCursor)
		if !ok {
			return m, nil
		}
		m.screen = m.paletteReturnScreen
		m.focusMenu = m.paletteReturnFocus
		m.paletteInput.Blur()
		if m.screen == screenMenu && !m.focusMenu {
			m.taskInput.Focus()
		}
		return m.handleSlash(action)
	}

	before := m.paletteInput.Value()
	var cmd tea.Cmd
	m.paletteInput, cmd = m.paletteInput.Update(msg)
	if m.paletteInput.Value() != before {
		m.paletteCursor = 0
	}
	m.paletteCursor = clampPaletteCursor(m.paletteCursor, m.filteredPaletteEntries())
	return m, cmd
}

func (m model) renderCommandPalette(bodyW, bodyH int) string {
	th := tui.T()
	entries := m.filteredPaletteEntries()
	cursor := clampPaletteCursor(m.paletteCursor, entries)

	lines := []string{
		tui.SectionTitle("Command Palette"),
		th.MutedText.Render("Type to filter · ↑↓ navigate · Enter run · Esc close"),
		"",
		m.paletteInput.View(),
		"",
	}

	if len(entries) == 0 {
		lines = append(lines, th.MutedText.Render("No commands match your query."))
	} else {
		visible := bodyH - 8
		if visible < 4 {
			visible = 4
		}
		start := 0
		if cursor >= visible {
			start = cursor - visible + 1
		}
		end := start + visible
		if end > len(entries) {
			end = len(entries)
		}
		for i := start; i < end; i++ {
			entry := entries[i]
			prefix := "  "
			rowStyle := th.TableCell
			if i == cursor {
				prefix = "▸ "
				rowStyle = th.SelectedRow
			}
			row := prefix + entry.ID + " — " + entry.Description
			if th.Enabled {
				lines = append(lines, rowStyle.Render(row))
			} else {
				lines = append(lines, row)
			}
		}
	}

	content := lipgloss.JoinVertical(lipgloss.Left, lines...)
	return tui.ContentFrame(content, bodyW, bodyH)
}
