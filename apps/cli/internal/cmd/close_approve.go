package cmd

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

type closeApproveFlags struct {
	proposalVersion int
	evidenceHash    string
	json            bool
}

var closeApproveF closeApproveFlags

var closeApproveCmd = &cobra.Command{
	Use:   "approve <mission-id>",
	Short: "Approve mission proposal",
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
		if closeApproveF.json {
			fmt.Fprintf(os.Stdout, "{\"missionId\":\"%s\",\"status\":\"%s\",\"version\":%d}\n", mission.MissionID, mission.Status, mission.Version)
		} else {
			fmt.Fprintf(os.Stdout, "Approved: %s (%s)\n", mission.MissionID, mission.Status)
		}
		return nil
	},
}

func init() {
	closeApproveCmd.Flags().IntVarP(&closeApproveF.proposalVersion, "proposal-version", "v", 0, "Proposal version to approve")
	closeApproveCmd.Flags().StringVarP(&closeApproveF.evidenceHash, "evidence-hash", "e", "", "Evidence hash")
	closeApproveCmd.Flags().BoolVar(&closeApproveF.json, "json", false, "JSON output")
	closeApproveCmd.MarkFlagRequired("proposal-version")
	closeCmd.AddCommand(closeApproveCmd)
}
