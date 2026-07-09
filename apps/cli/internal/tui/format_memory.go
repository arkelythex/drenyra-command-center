package tui

import (
	"context"
	"fmt"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/memory"
)

// FormatMemoryView renders Hermes-style memory for TUI/CLI.
func FormatMemoryView(s memory.Snapshot) string {
	th := T()
	var blocks []string

	header := fmt.Sprintf("MEMORY %d/%d (%.0f%%) · %d entries | USER %d/%d (%.0f%%) · %d entries",
		s.MemoryUsed, s.MemoryLimit, s.MemoryPct(), s.MemoryEntries,
		s.UserUsed, s.UserLimit, s.UserPct(), s.UserEntries)
	blocks = append(blocks, th.SecondaryText.Render(header), "")

	if s.MemoryBlocks != "" {
		blocks = append(blocks, SectionTitle("MEMORY.md (injected block)"), s.MemoryBlocks, "")
	}
	if s.UserBlocks != "" {
		blocks = append(blocks, SectionTitle("USER.md (injected block)"), s.UserBlocks, "")
	}

	if status, err := memory.LocalDBStatusReadOnly(context.Background()); err == nil {
		blocks = append(blocks,
			SectionTitle("Local SQLite memory DB"),
			fmt.Sprintf("%s · sessions %d · runs %d · memories %d · decisions %d · bugs %d", status.Path, status.Sessions, status.Runs, status.Memories, status.Decisions, status.Bugs),
			th.MutedText.Render("Search: drenyra memory db-search <query>"),
			"")
	}

	blocks = append(blocks,
		th.MutedText.Render("Hermes CLI: drenyra memory add|replace|remove memory|user …"),
		th.MutedText.Render("Edit files: drenyra memory edit [memory|user]"),
		th.MutedText.Render("Config: ~/.drenyra/config.yaml → memory:"),
		th.MutedText.Render("IDE: Engram (Gentle AI) project drenyra — set memory.provider: engram"),
	)

	body := strings.Join(blocks, "\n")
	if th.Enabled {
		return th.ContentBox.Render(body)
	}
	return body
}
