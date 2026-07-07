package tui

// Terminal palette tuned for WCAG 2.2 AA on dark surfaces (2026).
//
// Targets on Surface (#0E0A08):
//   - Primary text:  ≥ 12:1  (text)
//   - Secondary:     ≥ 7:1   (textSecondary)
//   - Muted / hints: ≥ 4.5:1 (muted) — old #8A7D6B was ~3.8:1 (fail)
//   - UI chrome:     ≥ 3:1   (border vs surface) — APCA/Zed-style non-text rule
//
// Brand copper/lúcuma preserved; luminance lifted for terminal readability
// (same approach as Ghostty/Zed dynamic contrast and Base16 WCAG palettes).
//
// Web tokens: packages/ui/src/styles/tokens.css — TUI uses brighter pairs only here.
type Palette struct {
	Surface       string
	Surface2      string
	Surface3      string
	Surface4      string
	Text          string
	TextSecondary string
	Muted         string
	Primary       string
	PrimaryBright string
	Accent        string
	Success       string
	Warning       string
	Danger        string
	Info          string
	Border        string
	BorderStrong  string
}

// DefaultPalette is the contrast-verified Drenyra CLI TUI palette.
func DefaultPalette() Palette {
	return Palette{
		Surface:       "#0E0A08",
		Surface2:      "#14100D",
		Surface3:      "#221B15",
		Surface4:      "#3A3028",
		Text:          "#F7F1E8",
		TextSecondary: "#D9CBB8",
		Muted:         "#B5A899",
		Primary:       "#B97A45",
		PrimaryBright: "#E8B878",
		Accent:        "#F2DE9A",
		Success:       "#9FBE94",
		Warning:       "#E8C06A",
		Danger:        "#E89585",
		Info:          "#E8C06A",
		Border:        "#6E5C4A",
		BorderStrong:  "#8A7664",
	}
}
