package app

import (
	"strings"
	"testing"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
)

func TestFormatKeyGroup(t *testing.T) {
	got := formatKeyGroup([]tui.KeyBind{
		{Key: "enter", Desc: "run"},
		{Key: "?", Desc: "help"},
	})

	for _, want := range []string{"enter", "run", "?", "help"} {
		if !strings.Contains(got, want) {
			t.Fatalf("formatKeyGroup() = %q, want to contain %q", got, want)
		}
	}
}

func TestHelpContentUsesContextualKeys(t *testing.T) {
	tests := []struct {
		name      string
		screen    screen
		focusMenu bool
		want      string
	}{
		{name: "home prompt", screen: screenMenu, focusMenu: false, want: "recall"},
		{name: "home menu", screen: screenMenu, focusMenu: true, want: "navigate"},
		{name: "result", screen: screenResult, focusMenu: false, want: "scroll"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := helpContent(tt.screen, false, tt.focusMenu)
			if !strings.Contains(got, "CONTEXT KEYS") {
				t.Fatalf("helpContent() missing contextual heading: %q", got)
			}
			if !strings.Contains(got, tt.want) {
				t.Fatalf("helpContent() = %q, want to contain %q", got, tt.want)
			}
			if strings.Contains(got, "drenyra"+" run") {
				t.Fatalf("helpContent() used legacy CLI name: %q", got)
			}
		})
	}
}
