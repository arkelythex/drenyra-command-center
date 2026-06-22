package cmd

import (
	"github.com/spf13/cobra"
)

// execCmd is headless mode (Droid exec / Pi print style).
var execFiscal = fiscalFlags{outputFormat: "json"}

var execCmd = &cobra.Command{
	Use:   "exec [task]",
	Short: "Headless harness execution for CI/scripts",
	Args:  cobra.ArbitraryArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		filePath, _ := cmd.Flags().GetString("file")
		format, _ := cmd.Flags().GetString("format")
		execFiscal.outputFormat = format
		return executeHarness(args, filePath, execFiscal)
	},
}

func init() {
	bindFiscalFlags(execCmd, &execFiscal)
	execCmd.Flags().StringP("file", "f", "", "read task from file")
	_ = execCmd.Flags().Set("format", "json")
}
