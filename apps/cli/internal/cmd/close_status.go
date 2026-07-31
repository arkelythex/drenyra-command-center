package cmd

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

type closeStatusFlags struct {
	json bool
}

var closeStatusF closeStatusFlags

var closeStatusCmd = &cobra.Command{
	Use:   "status <mission-id>",
	Short: "Show mission status",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}
		client := harness.NewMissionsClient(cfg.Harness.API)
		mission, err := client.GetMission(cmd.Context(), args[0])
		if err != nil {
			return fmt.Errorf("get mission: %w", err)
		}
		if closeStatusF.json {
			fmt.Fprintln(os.Stdout, "{\"id\":\""+mission.MissionID+"\",\"status\":\""+string(mission.Status)+"\",\"version\":"+fmt.Sprint(mission.Version)+"}")
		} else {
			fmt.Fprintf(os.Stdout, "Mission: %s\n", mission.MissionID)
			fmt.Fprintf(os.Stdout, "Status:  %s\n", mission.Status)
			fmt.Fprintf(os.Stdout, "Version: %d\n", mission.Version)
			fmt.Fprintf(os.Stdout, "Progress: %d%%\n", mission.Progress)
			if mission.Proposal != nil {
				fmt.Fprintf(os.Stdout, "Proposal: v%d (%s)\n", mission.Proposal.Version, mission.Proposal.RiskLevel)
			}
			if mission.ReceiptHash != "" {
				fmt.Fprintf(os.Stdout, "Receipt:  %s\n", mission.ReceiptHash[:16]+"...")
			}
		}
		return nil
	},
}

func init() {
	closeStatusCmd.Flags().BoolVar(&closeStatusF.json, "json", false, "JSON output")
	closeCmd.AddCommand(closeStatusCmd)
}
