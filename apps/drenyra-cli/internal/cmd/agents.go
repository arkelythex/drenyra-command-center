package cmd

import (
	"context"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var agentsCmd = &cobra.Command{
	Use:   "agents",
	Short: "List delegation agents",
}

func init() {
	agentsCmd.AddCommand(&cobra.Command{
		Use:   "tree",
		Short: "Print delegation tree (local graph)",
		Run: func(cmd *cobra.Command, args []string) {
			tui.PrintAgentStack()
		},
	})
	agentsCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List agents from harness API",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			client := harness.NewClient(cfg.Harness.API, fiscalFromConfig(cfg))
			var data *harness.AgentsListData
			err = tui.RunSpinner("Fetching agents from harness…", func() error {
				var fetchErr error
				data, fetchErr = client.ListAgents(context.Background())
				return fetchErr
			})
			if err != nil {
				return err
			}
			tui.ClearLine()
			tui.RenderAgentsList(data.MaxDepth, data.Agents)
			return nil
		},
	})
}
