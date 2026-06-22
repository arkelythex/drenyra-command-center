package cmd

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/output"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var configCmd = &cobra.Command{
	Use:   "config",
	Short: "Inspect and validate CLI configuration",
}

var configShowFormat string

var configShowCmd = &cobra.Command{
	Use:   "show",
	Short: "Show merged configuration",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		paths, err := config.Paths()
		if err != nil {
			return err
		}
		format := output.Format(configShowFormat)
		if format == output.FormatJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(cfg)
		}
		tui.RenderConfig(cfg, paths)
		return nil
	},
}

var configPathCmd = &cobra.Command{
	Use:   "path",
	Short: "Print config file paths",
	RunE: func(cmd *cobra.Command, args []string) error {
		paths, err := config.Paths()
		if err != nil {
			return err
		}
		format, _ := cmd.Flags().GetString("format")
		if output.Format(format) == output.FormatJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			globalExists := fileExists(paths.Global)
			projectExists := paths.Project != "" && fileExists(paths.Project)
			return enc.Encode(map[string]any{
				"global":        paths.Global,
				"globalExists":  globalExists,
				"project":       paths.Project,
				"projectExists": projectExists,
			})
		}
		tui.RenderConfigPaths(paths)
		return nil
	},
}

var configValidateCmd = &cobra.Command{
	Use:   "validate",
	Short: "Validate merged configuration",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		issues := cfg.Validate()
		format, _ := cmd.Flags().GetString("format")
		if output.Format(format) == output.FormatJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			payload := map[string]any{
				"valid":  config.Valid(issues),
				"issues": issues,
			}
			if err := enc.Encode(payload); err != nil {
				return err
			}
			if !config.Valid(issues) {
				return errors.New("config validation failed")
			}
			return nil
		}
		tui.RenderConfigValidation(issues)
		if !config.Valid(issues) {
			return fmt.Errorf("config validation failed")
		}
		return nil
	},
}

func init() {
	configShowCmd.Flags().StringVar(&configShowFormat, "format", "text", "output: text|json")
	configPathCmd.Flags().String("format", "text", "output: text|json")
	configValidateCmd.Flags().String("format", "text", "output: text|json")

	configCmd.AddCommand(configShowCmd)
	configCmd.AddCommand(configPathCmd)
	configCmd.AddCommand(configValidateCmd)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}
