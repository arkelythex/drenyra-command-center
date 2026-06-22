package cmd

import (
	"fmt"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/version"
	"github.com/spf13/cobra"
)

var versionLong bool

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print CLI version and build metadata",
	Run: func(cmd *cobra.Command, args []string) {
		if versionLong {
			fmt.Println(version.Long())
			return
		}
		tui.Banner("Version")
		body := tui.KV("version", version.Version) + "\n"
		body += tui.KV("commit", version.Commit) + "\n"
		body += tui.KV("built", version.Date)
		fmt.Println(tui.Panel("Build", body))
		fmt.Println()
	},
}

func init() {
	versionCmd.Flags().BoolVar(&versionLong, "long", false, "print full build metadata (plain text)")
}
