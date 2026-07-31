package cmd

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

var closeGatesF = struct{ json bool }{}

var closeGatesCmd = &cobra.Command{
	Use:   "gates <mission-id>",
	Short: "Show readiness gates",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}
		client := harness.NewMissionsClient(cfg.Harness.API)
		gates, err := client.GetGates(cmd.Context(), args[0])
		if err != nil {
			return fmt.Errorf("get gates: %w", err)
		}
		for _, g := range gates {
			if closeGatesF.json {
				fmt.Fprintf(os.Stdout, "{\"gate\":\"%s\",\"status\":\"%s\"}\n", g.GateName, g.Status)
			} else {
				fmt.Fprintf(os.Stdout, "%-30s %s\n", g.GateName, g.Status)
			}
		}
		return nil
	},
}

func init() {
	closeGatesCmd.Flags().BoolVar(&closeGatesF.json, "json", false, "JSON output")
	closeCmd.AddCommand(closeGatesCmd)
}
