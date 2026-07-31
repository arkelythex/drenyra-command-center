package cmd

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

var closeExceptionsF = struct{ json bool }{}

var closeExceptionsCmd = &cobra.Command{
	Use:   "exceptions <mission-id>",
	Short: "Show accounting exceptions",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}
		client := harness.NewMissionsClient(cfg.Harness.API)
		exceptions, err := client.GetExceptions(cmd.Context(), args[0])
		if err != nil {
			return fmt.Errorf("get exceptions: %w", err)
		}
		for _, e := range exceptions {
			if closeExceptionsF.json {
				fmt.Fprintf(os.Stdout, "{\"code\":\"%s\",\"severity\":\"%s\",\"subject\":\"%s\"}\n", e.Code, e.Severity, e.SubjectRef)
			} else {
				fmt.Fprintf(os.Stdout, "[%s] %s: %s\n", e.Severity, e.Code, e.SubjectRef)
			}
		}
		return nil
	},
}

func init() {
	closeExceptionsCmd.Flags().BoolVar(&closeExceptionsF.json, "json", false, "JSON output")
	closeCmd.AddCommand(closeExceptionsCmd)
}
