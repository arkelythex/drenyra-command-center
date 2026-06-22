package cmd

import (
	"fmt"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Write ~/.arkelythex/config.yaml with defaults",
	RunE: func(cmd *cobra.Command, args []string) error {
		if err := config.WriteGlobal(config.Default()); err != nil {
			return err
		}
		if err := memory.EnsureDefaults(); err != nil {
			return err
		}
		path, _ := config.GlobalPath()
		mem, user, _ := memory.Paths()
		tui.RenderInitSuccess(path)
		fmt.Println(tui.T().MutedText.Render("Memory: " + mem))
		fmt.Println(tui.T().MutedText.Render("        " + user))
		return nil
	},
}
