package tui

import (
	"fmt"
	"strings"
)

// Banner prints the Drenyra CLI header.
func Banner(subtitle string) {
	th := T()
	title := "◆ DRENYRA CLI"
	if th.Enabled {
		fmt.Println(th.Banner.Render(title))
		if subtitle != "" {
			fmt.Println(th.Subtitle.Render(subtitle))
		}
		fmt.Println()
		return
	}
	fmt.Println(title)
	if subtitle != "" {
		fmt.Println(subtitle)
	}
	fmt.Println()
}

// Panel renders a titled box.
func Panel(title string, body string) string {
	th := T()
	content := body
	if title != "" {
		content = th.Header.Render(title) + "\n" + body
	}
	if th.Enabled {
		return th.Panel.Render(content)
	}
	if title != "" {
		return title + "\n" + body
	}
	return body
}

// Check prints a diagnostic row.
func Check(ok bool, label, detail string) string {
	th := T()
	icon := "○"
	if ok {
		icon = "✓"
	} else {
		icon = "✗"
	}
	if th.Enabled {
		iconStyle := th.Err
		if ok {
			iconStyle = th.OK
		}
		return iconStyle.Render(icon) + "  " + th.Label.Render(label+":") + " " + th.Value.Render(detail)
	}
	return fmt.Sprintf("%s  %-12s %s", icon, label+":", detail)
}

// StatusBadge colors harness status strings.
func StatusBadge(status string) string {
	th := T()
	if !th.Enabled {
		return status
	}
	switch status {
	case "done":
		return th.OK.Render(status)
	case "partial":
		return th.InfoStyle.Render(status)
	case "pending_approval":
		return th.Warn.Render(status)
	case "blocked":
		return th.Err.Render(status)
	default:
		return th.MutedText.Render(status)
	}
}

// TierBadge formats agent tier labels.
func TierBadge(tier string) string {
	th := T()
	if !th.Enabled {
		return tier
	}
	return th.Badge.Render(tier)
}

// KV renders a key-value row.
func KV(key, value string) string {
	th := T()
	if th.Enabled {
		return th.Label.Render(key) + th.Value.Render(value)
	}
	return fmt.Sprintf("%-16s %s", key+":", value)
}

// Table renders a simple aligned table.
func Table(headers []string, rows [][]string) string {
	if len(rows) == 0 {
		return ""
	}
	th := T()
	widths := make([]int, len(headers))
	for i, h := range headers {
		widths[i] = len(h)
	}
	for _, row := range rows {
		for i, cell := range row {
			if i < len(widths) && len(cell) > widths[i] {
				widths[i] = len(cell)
			}
		}
	}

	var b strings.Builder
	if th.Enabled {
		for i, h := range headers {
			if i > 0 {
				b.WriteString("  ")
			}
			b.WriteString(th.TableHead.Width(widths[i]).Render(pad(h, widths[i])))
		}
		b.WriteString("\n")
		for _, row := range rows {
			for i, cell := range row {
				if i > 0 {
					b.WriteString("  ")
				}
				style := th.TableCell
				if i == 0 {
					style = th.TableCell.Copy().Bold(true)
				}
				b.WriteString(style.Width(widths[i]).Render(pad(cell, widths[i])))
			}
			b.WriteString("\n")
		}
		return b.String()
	}

	for i, h := range headers {
		if i > 0 {
			b.WriteString("  ")
		}
		b.WriteString(pad(h, widths[i]))
	}
	b.WriteString("\n")
	for _, row := range rows {
		for i, cell := range row {
			if i > 0 {
				b.WriteString("  ")
			}
			b.WriteString(pad(cell, widths[i]))
		}
		b.WriteString("\n")
	}
	return b.String()
}

func pad(s string, w int) string {
	if len(s) >= w {
		return s
	}
	return s + strings.Repeat(" ", w-len(s))
}
