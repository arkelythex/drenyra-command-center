package cmd

import (
	"context"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/execution"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/output"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var runFiscal fiscalFlags

var runCmd = &cobra.Command{
	Use:   "run [task]",
	Short: "Execute task via Drenyra harness (interactive-friendly)",
	Args:  cobra.ArbitraryArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		filePath, _ := cmd.Flags().GetString("file")
		return executeHarness(args, filePath, runFiscal)
	},
}

func init() {
	bindFiscalFlags(runCmd, &runFiscal)
	runCmd.Flags().StringP("file", "f", "", "read task from file")
}

func executeHarness(args []string, filePath string, f fiscalFlags) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	task, err := readTaskArg(args, filePath)
	if err != nil {
		return err
	}

	engine := execution.NewEngine(cfg)
	input := execution.ExecuteInput{
		Task:            task,
		RootAgentID:     f.rootAgent,
		AutoLevel:       f.autoLevel,
		FiscalOverrides: fiscalOverrides(f),
	}

	format := output.Format(f.outputFormat)
	if format == output.FormatJSON {
		result, err := engine.Execute(context.Background(), input)
		if err != nil {
			return err
		}
		return output.WriteExecute(format, result.Response, result.Models, result.Task)
	}

	var result execution.ExecuteResult
	err = tui.RunSpinner("Executing harness (auto="+f.autoLevel+")…", func() error {
		var execErr error
		result, execErr = engine.Execute(context.Background(), input)
		return execErr
	})
	if err != nil {
		return err
	}
	tui.ClearLine()

	return output.WriteExecute(output.FormatText, result.Response, result.Models, result.Task)
}
