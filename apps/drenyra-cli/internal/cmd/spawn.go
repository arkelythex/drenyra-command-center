package cmd

import (
	"context"
	"fmt"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/output"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var spawnFiscal fiscalFlags

var spawnCmd = &cobra.Command{
	Use:   "spawn",
	Short: "Spawn a single harness agent (POST /spawn)",
	RunE: func(cmd *cobra.Command, args []string) error {
		agentID, _ := cmd.Flags().GetString("agent")
		task, _ := cmd.Flags().GetString("task")
		filePath, _ := cmd.Flags().GetString("file")
		depth, _ := cmd.Flags().GetInt("depth")
		parentRunID, _ := cmd.Flags().GetString("parent-run")
		format := spawnFiscal.outputFormat

		if agentID == "" {
			return fmt.Errorf("--agent is required")
		}

		if task == "" && filePath == "" {
			var err error
			task, err = readTaskArg(args, filePath)
			if err != nil {
				return fmt.Errorf("--task or --file is required")
			}
		} else if filePath != "" {
			var err error
			task, err = readTaskArg(nil, filePath)
			if err != nil {
				return err
			}
		}

		cfg, err := config.Load()
		if err != nil {
			return err
		}

		fiscalCtx, err := mergeFiscal(cfg, spawnFiscal)
		if err != nil {
			return err
		}

		req := harness.SpawnRequest{
			AgentID:     agentID,
			Task:        task,
			Depth:       depth,
			ParentRunID: parentRunID,
		}

		client := harness.NewClient(cfg.Harness.API, fiscalCtx)
		outFmt := output.Format(format)

		if outFmt == output.FormatJSON {
			node, err := client.Spawn(context.Background(), req)
			if err != nil {
				return err
			}
			return output.WriteSpawn(outFmt, node)
		}

		var node *harness.RunNode
		label := "Spawning agent " + agentID + "…"
		err = tui.RunSpinner(label, func() error {
			var spawnErr error
			node, spawnErr = client.Spawn(context.Background(), req)
			return spawnErr
		})
		if err != nil {
			return err
		}
		tui.ClearLine()
		return output.WriteSpawn(output.FormatText, node)
	},
}

func init() {
	bindFiscalFlags(spawnCmd, &spawnFiscal)
	spawnCmd.Flags().String("agent", "", "agent id to spawn (required)")
	spawnCmd.Flags().String("task", "", "task for the agent")
	spawnCmd.Flags().StringP("file", "f", "", "read task from file")
	spawnCmd.Flags().Int("depth", 0, "delegation depth")
	spawnCmd.Flags().String("parent-run", "", "parent run id")
	_ = spawnCmd.MarkFlagRequired("agent")
}
