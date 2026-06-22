package cmd

import (
	"sort"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/router"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var modelsCmd = &cobra.Command{
	Use:   "models",
	Short: "Model routing table (Opper-style per agent)",
}

func init() {
	modelsCmd.AddCommand(&cobra.Command{
		Use:   "list",
		Short: "List agent → model mappings from config",
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			ids := make([]string, 0, len(cfg.Agents))
			for id := range cfg.Agents {
				ids = append(ids, id)
			}
			sort.Strings(ids)
			routes := make([]router.ResolvedModel, 0, len(ids))
			for _, id := range ids {
				r, err := router.Resolve(cfg, id)
				if err != nil {
					return err
				}
				routes = append(routes, r)
			}
			tui.RenderModelsList(cfg.Providers.Default, cfg.Routing.Fallback, routes)
			return nil
		},
	})
	modelsCmd.AddCommand(&cobra.Command{
		Use:   "route [agent-id]",
		Short: "Show resolved model for one agent",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			cfg, err := config.Load()
			if err != nil {
				return err
			}
			r, err := router.Resolve(cfg, args[0])
			if err != nil {
				return err
			}
			tui.RenderModelRoute(r)
			return nil
		},
	})
}
