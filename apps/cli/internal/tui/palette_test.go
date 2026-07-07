package tui

import "testing"

// WCAG AA on dark terminal: 4.5:1 normal text, 3:1 UI / large text.
func TestPalette_contrastOnSurface(t *testing.T) {
	p := DefaultPalette()
	bg := p.Surface

	cases := []struct {
		name string
		fg   string
		min  float64
	}{
		{"text", p.Text, 10},
		{"textSecondary", p.TextSecondary, 6},
		{"muted", p.Muted, 4.5},
		{"primaryBright", p.PrimaryBright, 4.5},
		{"accent", p.Accent, 4.5},
		{"success", p.Success, 4.5},
		{"warning", p.Warning, 4.5},
		{"danger", p.Danger, 4.5},
		{"border", p.Border, 3},
	}

	for _, tc := range cases {
		got := contrastRatio(tc.fg, bg)
		if got < tc.min {
			t.Errorf("%s on surface: got %.2f want ≥ %.1f (%s on %s)", tc.name, got, tc.min, tc.fg, bg)
		}
	}
}

func TestPalette_oldMutedFailedAA(t *testing.T) {
	old := contrastRatio("#8A7D6B", "#0E0A08")
	new := contrastRatio(DefaultPalette().Muted, "#0E0A08")
	if new <= old {
		t.Fatalf("expected improved muted contrast: old=%.2f new=%.2f", old, new)
	}
	if new < 4.5 {
		t.Fatalf("new muted still below AA: %.2f", new)
	}
}
