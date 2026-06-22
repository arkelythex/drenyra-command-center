package tui

import (
	"os"

	"github.com/charmbracelet/lipgloss"
	"golang.org/x/term"
)

// Theme — Drenyra CLI TUI styles (WCAG-tuned palette, Glow/k9s/lazygit layout patterns).
type Theme struct {
	Enabled bool
	Palette Palette

	Primary       lipgloss.Color
	Accent        lipgloss.Color
	Surface       lipgloss.Color
	Surface2      lipgloss.Color
	Surface3      lipgloss.Color
	Surface4      lipgloss.Color
	Text          lipgloss.Color
	TextSecondary lipgloss.Color
	Muted         lipgloss.Color
	Success       lipgloss.Color
	Warning       lipgloss.Color
	Danger        lipgloss.Color
	Info          lipgloss.Color
	Border        lipgloss.Color

	Banner        lipgloss.Style
	Logo          lipgloss.Style
	Title         lipgloss.Style
	Subtitle      lipgloss.Style
	Breadcrumb    lipgloss.Style
	SectionTitle  lipgloss.Style
	Label         lipgloss.Style
	Value         lipgloss.Style
	MutedText     lipgloss.Style
	SecondaryText lipgloss.Style
	Panel         lipgloss.Style
	Header        lipgloss.Style
	HeaderBar     lipgloss.Style
	FooterBar     lipgloss.Style
	ContentBox    lipgloss.Style
	BodyPad       lipgloss.Style
	OK            lipgloss.Style
	Warn          lipgloss.Style
	Err           lipgloss.Style
	InfoStyle     lipgloss.Style
	Badge         lipgloss.Style
	KeyCap        lipgloss.Style
	Separator     lipgloss.Style
	SelectedRow   lipgloss.Style
	TreeLine      lipgloss.Style
	TreeAgent     lipgloss.Style
	TreeTier      lipgloss.Style
	TableHead     lipgloss.Style
	TableCell     lipgloss.Style
	Trace         lipgloss.Style
}

var (
	active            Theme
	activeInitialized bool
)

func Init(forcePlain bool) {
	if activeInitialized {
		return
	}
	plain := forcePlain || os.Getenv("NO_COLOR") != "" || !isStdoutTTY()
	active = newTheme(!plain)
	activeInitialized = true
}

func T() Theme { return active }

func isStdoutTTY() bool {
	return term.IsTerminal(int(os.Stdout.Fd()))
}

func newTheme(color bool) Theme {
	if !color {
		return Theme{Enabled: false, Palette: DefaultPalette()}
	}

	p := DefaultPalette()
	th := Theme{
		Enabled:       true,
		Palette:       p,
		Primary:       lipgloss.Color(p.PrimaryBright),
		Accent:        lipgloss.Color(p.Accent),
		Surface:       lipgloss.Color(p.Surface),
		Surface2:      lipgloss.Color(p.Surface2),
		Surface3:      lipgloss.Color(p.Surface3),
		Surface4:      lipgloss.Color(p.Surface4),
		Text:          lipgloss.Color(p.Text),
		TextSecondary: lipgloss.Color(p.TextSecondary),
		Muted:         lipgloss.Color(p.Muted),
		Success:       lipgloss.Color(p.Success),
		Warning:       lipgloss.Color(p.Warning),
		Danger:        lipgloss.Color(p.Danger),
		Info:          lipgloss.Color(p.Info),
		Border:        lipgloss.Color(p.Border),
	}

	th.Logo = lipgloss.NewStyle().Foreground(th.Primary).Bold(true)
	th.Banner = th.Logo.Copy()

	th.Title = lipgloss.NewStyle().Foreground(th.Text).Bold(true)
	th.Subtitle = lipgloss.NewStyle().Foreground(th.TextSecondary)
	th.Breadcrumb = lipgloss.NewStyle().Foreground(th.TextSecondary)
	th.SectionTitle = lipgloss.NewStyle().Foreground(th.TextSecondary).Bold(true)

	th.Label = lipgloss.NewStyle().Foreground(th.Muted).Width(14)
	th.Value = lipgloss.NewStyle().Foreground(th.Text)
	th.MutedText = lipgloss.NewStyle().Foreground(th.Muted)
	th.SecondaryText = lipgloss.NewStyle().Foreground(th.TextSecondary)

	th.Panel = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(th.Border).
		Padding(1, 2)

	th.Header = lipgloss.NewStyle().Foreground(th.Accent).Bold(true)

	th.HeaderBar = lipgloss.NewStyle().
		BorderBottom(true).
		BorderForeground(th.Border).
		Padding(0, 1).
		Background(th.Surface2)

	th.FooterBar = lipgloss.NewStyle().
		BorderTop(true).
		BorderForeground(th.Border).
		Padding(0, 1).
		Background(th.Surface2)

	th.ContentBox = lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(th.Border).
		Padding(1, 2).
		Background(th.Surface)

	th.BodyPad = lipgloss.NewStyle().Padding(1, 2).Background(th.Surface)

	th.KeyCap = lipgloss.NewStyle().
		Foreground(th.Accent).
		Bold(true)

	th.Separator = lipgloss.NewStyle().Foreground(th.Border)

	th.SelectedRow = lipgloss.NewStyle().
		BorderStyle(lipgloss.ThickBorder()).
		BorderLeft(true).
		BorderForeground(th.Primary).
		PaddingLeft(1)

	th.OK = lipgloss.NewStyle().Foreground(th.Success).Bold(true)
	th.Warn = lipgloss.NewStyle().Foreground(th.Warning).Bold(true)
	th.Err = lipgloss.NewStyle().Foreground(th.Danger).Bold(true)
	th.InfoStyle = lipgloss.NewStyle().Foreground(th.Info)

	th.Badge = lipgloss.NewStyle().
		Foreground(th.Muted).
		Italic(true)

	th.TreeLine = lipgloss.NewStyle().Foreground(th.Muted)
	th.TreeAgent = lipgloss.NewStyle().Foreground(th.Text).Bold(true)
	th.TreeTier = lipgloss.NewStyle().Foreground(th.Accent)

	th.TableHead = lipgloss.NewStyle().Foreground(th.Accent).Bold(true)
	th.TableCell = lipgloss.NewStyle().Foreground(th.Text)
	th.Trace = lipgloss.NewStyle().Foreground(th.Muted).Italic(true)

	return th
}
