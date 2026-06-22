package tui

import (
	"fmt"
	"os"
	"strings"
)

// RenderError prints a styled CLI error to stderr.
func RenderError(err error) {
	if err == nil {
		return
	}
	th := T()
	title := "Error"
	body := err.Error()
	if hint := hintFor(err); hint != "" {
		body += "\n\n" + hint
	}
	if th.Enabled {
		panel := th.Panel.Render(
			th.Err.Render("✗ "+title) + "\n\n" + th.Value.Render(body),
		)
		fmt.Fprintln(os.Stderr, panel)
		return
	}
	fmt.Fprintf(os.Stderr, "error: %s\n", err)
}

func hintFor(err error) string {
	msg := strings.ToLower(err.Error())
	switch {
	case strings.Contains(msg, "connection refused"), strings.Contains(msg, "dial tcp"):
		return "Hint: start Drenyra API → cd drenyra/apps/api && bun src/index.ts\n       or set ARKELYTHEX_API_URL"
	case strings.Contains(msg, "404"), strings.Contains(msg, "not_found"):
		return "Hint: ensure fiscal-command-center harness routes are mounted in app-core"
	case strings.Contains(msg, "invalid ruc"), strings.Contains(msg, "fiscal context"):
		return "Hint: drenyra init  or  --ruc --period --org --company --user"
	case strings.Contains(msg, "timeout"), strings.Contains(msg, "deadline"):
		return "Hint: only one process on port 3000; check with ss -tlnp | rg 3000"
	default:
		return ""
	}
}
