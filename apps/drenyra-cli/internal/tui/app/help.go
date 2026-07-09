package app

import (
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
)

func helpContent(current screen, loading bool, focusMenu bool) string {
	return tui.Panel("Help · Drenyra CLI", strings.Join([]string{
		"OpenCode-inspired TUI: Bubble Tea state, contextual keys, and visible workflow control.",
		"",
		"CONTEXT KEYS",
		formatKeyGroup(keyBarFor(current, loading, focusMenu)),
		"",
		"PROMPT (bottom)",
		"  Type a fiscal/swarm task and press Enter",
		"  /doctor   /agents   /models   /memory   /resume",
		"  /history  /menu     /quit     /clear",
		"  ctrl+p    command palette",
		"  ctrl+b    toggle Plan/Build mode",
		"  ? or /?   this contextual help",
		"  esc esc   clear prompt",
		"",
		"NAVIGATION",
		"  ↑↓        recall past tasks (home prompt), move lists, or scroll views",
		"  tab       switch between prompt and action menu on Home",
		"  ctrl+p    open command palette from any idle screen",
		"  ctrl+b    toggle Plan/Build mode from any idle screen",
		"  enter     select / submit",
		"  esc       back / home",
		"  q         quit when menu/view is focused; typed as text in the prompt",
		"  ctrl+l    clear scroll area",
		"",
		"MODES",
		"  Build     execute the task normally through the harness",
		"  Plan      read-only planning guard; asks agents not to apply code or data changes",
		"",
		"WORKFLOWS (outside TUI)",
		"  drenyra workflow list",
		"  drenyra workflow run review-sunat [context]",
		"  drenyra workflow run pre-pr [context]",
		"  drenyra workflow run bugfix-tdd [context]",
		"  drenyra workflow run architecture-check [context]",
		"",
		"MEMORY (Hermes agent parity)",
		"  ~/.drenyra/config.yaml → memory: limits & provider",
		"  ~/.drenyra/memories/MEMORY.md — § entries, agent notes",
		"  ~/.drenyra/memories/USER.md   — § entries, user profile",
		"  /memory opens the local DB browser: type query, Enter search, ↑↓ results, Esc home",
		"  drenyra memory add|replace|remove memory|user …",
		"  drenyra memory db-search <query>",
		"  Engram (IDE): memory.provider: engram in config",
		"",
		"CLI (outside TUI)",
		"  drenyra-pi run \"task\" --auto medium",
		"  drenyra-pi exec \"task\" --format json",
		"  drenyra-pi serve       # NDJSON RPC",
	}, "\n"))
}

func formatKeyGroup(keys []tui.KeyBind) string {
	if len(keys) == 0 {
		return "  No active key bindings"
	}
	lines := make([]string, 0, len(keys))
	for _, key := range keys {
		lines = append(lines, "  "+key.Key+strings.Repeat(" ", max(1, 10-len(key.Key)))+key.Desc)
	}
	return strings.Join(lines, "\n")
}
