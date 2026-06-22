package app

import "testing"

func TestFilterCommandPalette(t *testing.T) {
	entries := defaultCommandPaletteEntries()
	tests := []struct {
		name  string
		query string
		want  []string
	}{
		{name: "empty returns all", query: "", want: []string{"doctor", "agents", "models", "memory", "history", "resume", "menu", "clear", "help", "quit"}},
		{name: "matches id", query: "mod", want: []string{"models"}},
		{name: "matches description", query: "health", want: []string{"doctor"}},
		{name: "case insensitive", query: "MEMORY", want: []string{"memory"}},
		{name: "no match", query: "missing", want: []string{}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := filterCommandPalette(entries, tt.query)
			if len(got) != len(tt.want) {
				t.Fatalf("len(filterCommandPalette()) = %d, want %d (%#v)", len(got), len(tt.want), got)
			}
			for i, want := range tt.want {
				if got[i].ID != want {
					t.Fatalf("filtered[%d] = %q, want %q", i, got[i].ID, want)
				}
			}
		})
	}
}

func TestClampPaletteCursor(t *testing.T) {
	entries := defaultCommandPaletteEntries()[:2]
	tests := []struct {
		name   string
		cursor int
		want   int
	}{
		{name: "negative", cursor: -1, want: 0},
		{name: "inside", cursor: 1, want: 1},
		{name: "past end", cursor: 4, want: 1},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := clampPaletteCursor(tt.cursor, entries); got != tt.want {
				t.Fatalf("clampPaletteCursor(%d) = %d, want %d", tt.cursor, got, tt.want)
			}
		})
	}
}

func TestSelectedCommandPaletteAction(t *testing.T) {
	entries := []commandPaletteEntry{
		{ID: "doctor", Action: slashDoctor},
		{ID: "help", Action: slashHelp},
	}

	action, ok := selectedCommandPaletteAction(entries, 9)
	if !ok {
		t.Fatal("expected selection")
	}
	if action != slashHelp {
		t.Fatalf("selected action = %v, want %v", action, slashHelp)
	}

	if _, ok := selectedCommandPaletteAction(nil, 0); ok {
		t.Fatal("expected empty selection to fail")
	}
}
