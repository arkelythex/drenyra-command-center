package app

import (
	"testing"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	tea "github.com/charmbracelet/bubbletea"
)

func TestHomePromptAcceptsLiteralQ(t *testing.T) {
	m := newModel(config.Default(), config.DefaultTUI())
	m.screen = screenMenu
	m.focusMenu = false
	m.taskInput.Focus()

	next, _ := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'q'}})
	got := next.(model)
	if got.taskInput.Value() != "q" {
		t.Fatalf("taskInput.Value() = %q, want q", got.taskInput.Value())
	}
}

func TestMenuFocusedQQuits(t *testing.T) {
	m := newModel(config.Default(), config.DefaultTUI())
	m.screen = screenMenu
	m.focusMenu = true

	_, cmd := m.Update(tea.KeyMsg{Type: tea.KeyRunes, Runes: []rune{'q'}})
	if cmd == nil {
		t.Fatal("menu-focused q should return quit command")
	}
}
