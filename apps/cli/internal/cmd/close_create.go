package cmd

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

type closeCreateFlags struct {
	company string
	period  string
	json    bool
}

var closeCreateF closeCreateFlags

var closeCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a monthly close mission",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}
		client := harness.NewMissionsClient(cfg.Harness.API)

		mission, err := client.GetMission(cmd.Context(), "")
		if err != nil {
			return fmt.Errorf("create mission: %w", err)
		}
		if closeCreateF.json {
			fmt.Fprintln(os.Stdout, "{\"missionId\":\""+mission.MissionID+"\",\"status\":\"DRAFT\"}")
		} else {
			fmt.Fprintf(os.Stdout, "Mission created: %s (DRAFT)\n", mission.MissionID)
		}
		return nil
	},
}

func init() {
	closeCreateCmd.Flags().StringVarP(&closeCreateF.company, "company", "c", "", "Company ID (required)")
	closeCreateCmd.Flags().StringVarP(&closeCreateF.period, "period", "p", "", "Fiscal period YYYY-MM (required)")
	closeCreateCmd.Flags().BoolVar(&closeCreateF.json, "json", false, "JSON output")
	closeCreateCmd.MarkFlagRequired("company")
	closeCreateCmd.MarkFlagRequired("period")
	closeCmd.AddCommand(closeCreateCmd)
}
