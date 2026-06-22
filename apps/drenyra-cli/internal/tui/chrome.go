package tui

import (
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// Design refs: Charm Glow (list), k9s (status bar), lazygit (selection accent),
// Gum (minimal chrome), Opencode (quiet hierarchy).

// KeyBind is one shortcut shown in the footer.
type KeyBind struct {
	Key  string
	Desc string
}

// RenderHeader — k9s / opencode style: one compact status line.
func RenderHeader(termWidth int, breadcrumb string, chips []string) string {
	th := T()
	if !th.Enabled {
		return "DRENYRA CLI  " + breadcrumb
	}

	brand := th.Logo.Render("DRENYRA")
	sep := th.MutedText.Render(" │ ")
	path := th.Breadcrumb.Render(breadcrumb)

	left := lipgloss.JoinHorizontal(lipgloss.Center, brand, sep, path)

	meta := ""
	if len(chips) > 0 {
		meta = th.SecondaryText.Render(strings.Join(chips, " · "))
	}

	w := termWidth
	if w < 24 {
		w = 24
	}
	row := lipgloss.JoinHorizontal(
		lipgloss.Top,
		left,
		lipgloss.PlaceHorizontal(w-lipgloss.Width(left)-lipgloss.Width(meta), lipgloss.Right, meta),
	)

	return th.HeaderBar.Width(termWidth).Render(row)
}

// RenderKeyBar — Charm Help / Gum style: dim keys, middle-dot separators.
func RenderKeyBar(bindings []KeyBind) string {
	th := T()
	if !th.Enabled {
		var parts []string
		for _, b := range bindings {
			parts = append(parts, b.Key+" "+b.Desc)
		}
		return strings.Join(parts, " · ")
	}
	var parts []string
	for _, b := range bindings {
		parts = append(parts,
			th.KeyCap.Render(b.Key)+
				th.SecondaryText.Render(" "+b.Desc),
		)
	}
	inner := strings.Join(parts, th.MutedText.Render("  ·  "))
	return th.FooterBar.Render("  " + inner)
}

// ContentFrame — lazygit detail pane: subtle border, not loud brand box.
func ContentFrame(body string, width, height int) string {
	th := T()
	if !th.Enabled || width < 8 {
		return body
	}
	style := th.ContentBox.Width(width).MaxHeight(height)
	if height > 0 {
		style = style.Height(height)
	}
	return style.Render(body)
}

// PadBody adds breathing room without an extra border (Glow list pattern).
func PadBody(body string, width int) string {
	th := T()
	if !th.Enabled {
		return body
	}
	return th.BodyPad.Width(width).Render(body)
}

// CenterBlock centers loading state (spinner).
func CenterBlock(content string, width, height int) string {
	if width < 4 || height < 2 {
		return content
	}
	return lipgloss.Place(width, height, lipgloss.Center, lipgloss.Center, content)
}

// SectionTitle is a Glow-style list section label.
func SectionTitle(text string) string {
	th := T()
	if !th.Enabled {
		return text
	}
	return th.SectionTitle.Render(text)
}
