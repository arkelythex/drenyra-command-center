package tui

import "testing"

func TestStatusBadge_plain(t *testing.T) {
	Init(true)
	if got := StatusBadge("done"); got != "done" {
		t.Fatalf("plain badge: %q", got)
	}
}

func TestStatusBadge_colorTheme(t *testing.T) {
	active = newTheme(true)
	if !T().Enabled {
		t.Fatal("expected color theme enabled")
	}
	// lipgloss may strip ANSI when stdout is not a TTY; badge must not panic.
	_ = StatusBadge("pending_approval")
}

func TestPanel_plain(t *testing.T) {
	Init(true)
	out := Panel("Title", "body")
	if out == "" {
		t.Fatal("empty panel")
	}
}
