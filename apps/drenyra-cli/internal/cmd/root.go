package cmd

import (
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/version"
	"github.com/spf13/cobra"
)

var (
	noColor bool
	verbose bool
)

var rootCmd = &cobra.Command{
	Use:   "drenyra",
	Short: "Drenyra CLI — terminal companion for Drenyra App",
	Long: `Drenyra CLI — production harness client for Drenyra App.

Drenyra App is the agentic React application with the polished product UI.
Drenyra CLI is its terminal companion: model routing, fiscal agents,
automation, RPC, and operational workflows.

  status     System dashboard (default)
  tui        Interactive full-screen UI (recommended)
  run        Execute task with styled output + spinner
  exec       Headless JSON for CI/scripts
  serve      NDJSON RPC on stdin/stdout
  spawn      Single-agent harness spawn
  doctor     Config + API health
  agents     Delegation tree / registry
  models     Per-agent model routing (Opper-style)
  workflow   Built-in Drenyra product workflows
  work       Inspect fiscal work + browse audit logs
  config     Show / validate configuration
  history    Recent task runs
  command-audit Inspect command capability audit events

Global: --no-color  --verbose  --version

Docs: docs/05-development/drenyra-cli.md`,
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		tui.Init(noColor)
	},
	RunE: func(cmd *cobra.Command, args []string) error {
		// `drenyra` with no args shows Pi CLI-style status dashboard
		return runStatus(cmd.Context())
	},
}

// Execute runs the CLI.
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		tui.RenderError(err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.Version = version.Short()
	rootCmd.SetVersionTemplate(version.Long() + "\n")

	rootCmd.PersistentFlags().BoolVar(&noColor, "no-color", false, "disable colors and TUI styling")
	rootCmd.PersistentFlags().BoolVar(&verbose, "verbose", false, "verbose logging to stderr")

	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(doctorCmd)
	rootCmd.AddCommand(agentsCmd)
	rootCmd.AddCommand(runCmd)
	rootCmd.AddCommand(execCmd)
	rootCmd.AddCommand(modelsCmd)
	rootCmd.AddCommand(workflowCmd)
	rootCmd.AddCommand(workCmd)
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(configCmd)
	rootCmd.AddCommand(spawnCmd)
	rootCmd.AddCommand(commandAuditCmd)
	rootCmd.AddCommand(serveCmd)
}
