package cmd

import (
	"fmt"
	"time"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/history"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var historyCmd = &cobra.Command{
	Use:   "history",
	Short: "Task run history",
}

func init() {
	listCmd := &cobra.Command{
		Use:   "list",
		Short: "Show recent harness tasks",
		RunE: func(cmd *cobra.Command, args []string) error {
			limit, _ := cmd.Flags().GetInt("limit")
			entries, err := history.Recent(limit)
			if err != nil {
				return err
			}
			tui.Banner("Run history")
			if len(entries) == 0 {
				fmt.Println(tui.T().MutedText.Render("No runs yet. Use: drenyra run \"your task\""))
				return nil
			}
			rows := make([][]string, 0, len(entries))
			for _, e := range entries {
				rows = append(rows, []string{
					e.At.Format(time.RFC3339),
					truncate(e.Task, 48),
					e.RootAgent,
					e.Status,
				})
			}
			body := tui.Table([]string{"WHEN", "TASK", "ROOT", "STATUS"}, rows)
			fmt.Println(tui.Panel("Recent runs", body))
			return nil
		},
	}
	searchCmd := &cobra.Command{
		Use:   "search [query]",
		Short: "Search past tasks (Hermes session_search style)",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			query := ""
			if len(args) > 0 {
				query = args[0]
			}
			limit, _ := cmd.Flags().GetInt("limit")
			entries, err := history.Search(query, limit)
			if err != nil {
				return err
			}
			tui.Banner("Session search")
			if len(entries) == 0 {
				fmt.Println(tui.T().MutedText.Render("No matches."))
				return nil
			}
			rows := make([][]string, 0, len(entries))
			for _, e := range entries {
				rows = append(rows, []string{
					e.At.Format(time.RFC3339),
					truncate(e.Task, 48),
					e.RootAgent,
					e.AutoLevel,
					e.Status,
				})
			}
			fmt.Println(tui.Panel("Matches", tui.Table([]string{"WHEN", "TASK", "ROOT", "AUTO", "STATUS"}, rows)))
			return nil
		},
	}
	searchCmd.Flags().Int("limit", 20, "max entries")

	listCmd.Flags().Int("limit", 20, "max entries")
	historyCmd.AddCommand(listCmd, searchCmd)
	rootCmd.AddCommand(historyCmd)
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-3] + "..."
}
