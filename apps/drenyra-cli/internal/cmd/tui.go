package cmd

import (
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui/app"
	"github.com/spf13/cobra"
)

var tuiCmd = &cobra.Command{
	Use:   "tui",
	Short: "Launch interactive Bubble Tea TUI",
	Long:  "Full-screen terminal UI for running harness tasks, doctor checks, and browsing agents/models.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return app.RunInteractive()
	},
}

func init() {
	rootCmd.AddCommand(tuiCmd)
}
