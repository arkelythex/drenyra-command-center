package cmd

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var memoryCmd = &cobra.Command{
	Use:   "memory",
	Short: "Hermes-style persistent memory (MEMORY.md + USER.md)",
	Long: `Curated memory like NousResearch/hermes-agent:
  ~/.drenyra/memories/MEMORY.md  — agent notes (§ entries)
  ~/.drenyra/memories/USER.md    — user profile

Configure limits in ~/.drenyra/config.yaml under memory:`,
}

func init() {
	showCmd := &cobra.Command{
		Use:   "show",
		Short: "Show memory snapshot and Hermes-style blocks",
		RunE: func(cmd *cobra.Command, args []string) error {
			snap, err := memory.LoadSnapshotReadOnly()
			if err != nil {
				return err
			}
			tui.Banner("Persistent memory")
			fmt.Println(tui.FormatMemoryView(snap))
			return nil
		},
	}

	statusCmd := &cobra.Command{
		Use:   "status",
		Short: "Show capacity usage (like hermes memory status)",
		RunE: func(cmd *cobra.Command, args []string) error {
			snap, err := memory.LoadSnapshotReadOnly()
			if err != nil {
				return err
			}
			fmt.Println(memory.StatusLine(snap))
			if snap.NeedsConsolidation() {
				fmt.Println(tui.T().Warn.Render("Above 80% — consolidate with: drenyra memory replace"))
			}
			cfg, _ := config.Load()
			if cfg != nil && cfg.Memory.Provider == "engram" {
				fmt.Println(tui.T().MutedText.Render("External provider: engram (IDE) — additive to builtin files"))
			}
			return nil
		},
	}

	addCmd := &cobra.Command{
		Use:   "add [memory|user] [content]",
		Short: "Add a memory entry (Hermes memory tool: add)",
		Args:  cobra.MinimumNArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runMemoryMutate(memory.MutateAdd, args)
		},
	}

	replaceCmd := &cobra.Command{
		Use:   "replace [memory|user] [old_text] [new_content]",
		Short: "Replace entry by substring match (Hermes: replace)",
		Args:  cobra.MinimumNArgs(3),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runMemoryMutate(memory.MutateReplace, args)
		},
	}

	removeCmd := &cobra.Command{
		Use:   "remove [memory|user] [old_text]",
		Short: "Remove entry by substring match (Hermes: remove)",
		Args:  cobra.MinimumNArgs(2),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runMemoryMutate(memory.MutateRemove, args)
		},
	}

	pathsCmd := &cobra.Command{
		Use:   "paths",
		Short: "Print MEMORY.md and USER.md paths",
		RunE: func(cmd *cobra.Command, args []string) error {
			mem, user, err := memory.Paths()
			if err != nil {
				return err
			}
			fmt.Println(mem)
			fmt.Println(user)
			return nil
		},
	}

	dbStatusCmd := &cobra.Command{
		Use:   "db-status",
		Short: "Show local SQLite memory database status",
		RunE: func(cmd *cobra.Command, args []string) error {
			status, err := memory.LocalDBStatus(context.Background())
			if err != nil {
				return err
			}
			fmt.Println(tui.Panel("Local memory DB", fmt.Sprintf("path: %s\nsessions: %d\nruns: %d\nmemories: %d\ndecisions: %d\nbugs: %d", status.Path, status.Sessions, status.Runs, status.Memories, status.Decisions, status.Bugs)))
			return nil
		},
	}

	dbSearchCmd := &cobra.Command{
		Use:   "db-search [query]",
		Short: "Search local SQLite/FTS memory database",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			limit, _ := cmd.Flags().GetInt("limit")
			results, err := memory.SearchLocalDB(context.Background(), args[0], limit)
			if err != nil {
				return err
			}
			if len(results) == 0 {
				fmt.Println(tui.T().MutedText.Render("No local memory DB matches."))
				return nil
			}
			rows := make([][]string, 0, len(results))
			for _, result := range results {
				rows = append(rows, []string{result.Kind, result.Title, truncate(result.Content, 72)})
			}
			fmt.Println(tui.Panel("Local memory search", tui.Table([]string{"KIND", "TITLE", "MATCH"}, rows)))
			return nil
		},
	}
	dbSearchCmd.Flags().Int("limit", 20, "maximum search results")

	editCmd := &cobra.Command{
		Use:   "edit [memory|user]",
		Short: "Open store file in $EDITOR",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := memory.EnsureDefaults(); err != nil {
				return err
			}
			target := memory.TargetMemory
			if len(args) > 0 {
				t, err := memory.ParseTarget(args[0])
				if err != nil {
					return err
				}
				target = t
			}
			st, err := memory.DefaultStore()
			if err != nil {
				return err
			}
			path, err := st.PathFor(target)
			if err != nil {
				return err
			}
			editor := os.Getenv("EDITOR")
			if editor == "" {
				editor = "nano"
			}
			c := exec.Command(editor, path)
			c.Stdin = os.Stdin
			c.Stdout = os.Stdout
			c.Stderr = os.Stderr
			if err := c.Run(); err != nil {
				return err
			}
			return memory.RebuildMarkdownMemory(context.Background())
		},
	}

	memoryCmd.AddCommand(showCmd, statusCmd, addCmd, replaceCmd, removeCmd, pathsCmd, dbStatusCmd, dbSearchCmd, editCmd)
	rootCmd.AddCommand(memoryCmd)
}

func runMemoryMutate(kind memory.MutateKind, args []string) error {
	st, err := memory.DefaultStore()
	if err != nil {
		return err
	}
	target, err := memory.ParseTarget(args[0])
	if err != nil {
		return err
	}
	rest := args[1:]
	var res memory.Result
	switch kind {
	case memory.MutateAdd:
		res, err = st.Add(target, strings.Join(rest, " "))
	case memory.MutateReplace:
		if len(rest) < 2 {
			return fmt.Errorf("usage: replace %s <old_text> <new_content>", target)
		}
		res, err = st.Replace(target, rest[0], strings.Join(rest[1:], " "))
	case memory.MutateRemove:
		res, err = st.Remove(target, strings.Join(rest, " "))
	}
	if err != nil {
		return err
	}
	if err := memory.RebuildMemoryTarget(context.Background(), target); err != nil {
		return err
	}
	fmt.Println(tui.T().OK.Render("✓ " + res.Message))
	fmt.Println("  " + res.Usage + " · " + fmt.Sprintf("%d entries", res.EntryCount))
	return nil
}
