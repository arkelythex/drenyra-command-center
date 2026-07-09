package app

import (
	"fmt"
	"io"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// menuDelegate — Glow list + lazygit selection (left accent, no row fill).
type menuDelegate struct{}

func newMenuDelegate() menuDelegate { return menuDelegate{} }

func (d menuDelegate) Height() int                             { return 2 }
func (d menuDelegate) Spacing() int                            { return 0 }
func (d menuDelegate) Update(_ tea.Msg, _ *list.Model) tea.Cmd { return nil }

func (d menuDelegate) Render(w io.Writer, m list.Model, index int, item list.Item) {
	th := tui.T()
	entry, ok := item.(menuEntry)
	if !ok {
		return
	}

	title := entry.title
	desc := entry.description
	selected := index == m.Index()

	if !th.Enabled {
		prefix := "  "
		if selected {
			prefix = "> "
		}
		fmt.Fprintf(w, "%s%s\n", prefix, title)
		if desc != "" {
			fmt.Fprintf(w, "    %s\n", desc)
		}
		return
	}

	titleStyle := lipgloss.NewStyle().Foreground(th.Text)
	descStyle := lipgloss.NewStyle().Foreground(th.TextSecondary).PaddingLeft(2)

	if selected {
		block := titleStyle.Bold(true).Foreground(th.Primary).Render(title)
		if desc != "" {
			block += "\n" + descStyle.Render(desc)
		}
		fmt.Fprintln(w, th.SelectedRow.Render(block))
		return
	}

	fmt.Fprintln(w, "  "+titleStyle.Render(title))
	if desc != "" {
		fmt.Fprintln(w, descStyle.Render(desc))
	}
}

type autoDelegate struct{ menuDelegate }

func newAutoDelegate() autoDelegate { return autoDelegate{menuDelegate: newMenuDelegate()} }

func (d autoDelegate) Render(w io.Writer, m list.Model, index int, item list.Item) {
	entry, ok := item.(autoEntry)
	if !ok {
		return
	}
	d.menuDelegate.Render(w, m, index, menuEntry{
		title:       entry.level,
		description: entry.description,
	})
}
