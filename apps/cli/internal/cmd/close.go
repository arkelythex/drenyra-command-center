package cmd

import (
	"github.com/spf13/cobra"
)

var closeCmd = &cobra.Command{
	Use:   "close",
	Short: "Manage monthly close missions",
	Long:  "Create, inspect, and approve monthly close missions via the Drenyra mission protocol.",
}

func init() {
	rootCmd.AddCommand(closeCmd)
}
