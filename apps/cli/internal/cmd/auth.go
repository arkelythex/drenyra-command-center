package cmd

import (
	"fmt"
	"os"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

// ─── Auth root command ──────────────────────────────────────────────

var authCmd = &cobra.Command{
	Use:   "auth",
	Short: "Manage authentication",
	Long: `Authenticate with the Drenyra API.

Two modes:
  user        Interactive login via browser (device authorization flow)
  automation  Service account token for CI/scripts

Tokens are stored in the config file. In CI, use the DRENYRA_API_TOKEN
environment variable instead.`,
}

func init() {
	rootCmd.AddCommand(authCmd)
}

// ─── auth login ─────────────────────────────────────────────────────

var authLoginCmd = &cobra.Command{
	Use:   "login",
	Short: "Authenticate with the Drenyra API",
	Long: `Authenticate with the Drenyra API.

By default, prompts for an API token. Use --mode automation or
set the DRENYRA_API_TOKEN environment variable for CI/scripts.

Examples:
  drenyra auth login                          # interactive token prompt
  drenyra auth login --mode automation        # expect token from env or flag
  DRENYRA_API_TOKEN=xxx drenyra auth login    # token from environment
`,
	RunE: func(cmd *cobra.Command, args []string) error {
		mode, _ := cmd.Flags().GetString("mode")

		// Try environment variable first
		token := os.Getenv("DRENYRA_API_TOKEN")

		if token == "" && mode == "interactive" {
			// TODO: device authorization flow / browser login
			// For now, prompt for token
			fmt.Fprint(os.Stderr, "Enter API token: ")
			var input string
			fmt.Scanln(&input)
			token = strings.TrimSpace(input)
		}

		if token == "" && mode == "automation" {
			return harness.ParseMissionError(
				"UNAUTHORIZED",
				"DRENYRA_API_TOKEN environment variable is required for automation mode",
				401, nil,
			)
		}

		if token == "" {
			return harness.ParseMissionError(
				"UNAUTHORIZED",
				"No API token provided. Use --token, set DRENYRA_API_TOKEN, or enter it interactively.",
				401, nil,
			)
		}

		// Save token to config
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("load config: %w", err)
		}
		cfg.Harness.APIKey = token
		if err := cfg.Write(); err != nil {
			return fmt.Errorf("save config: %w", err)
		}
		fmt.Fprintln(os.Stderr, "Authentication saved.")
		return nil
	},
}

// ─── auth status ────────────────────────────────────────────────────

var authStatusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show authentication status",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("load config: %w", err)
		}

		// Check env var first (overrides config)
		token := os.Getenv("DRENYRA_API_TOKEN")
		source := "config file"
		if token != "" {
			source = "DRENYRA_API_TOKEN env"
		} else {
			token = cfg.Harness.APIKey
		}

		if token == "" {
			fmt.Fprintln(os.Stderr, "Status: NOT AUTHENTICATED")
			fmt.Fprintln(os.Stderr, "Run 'drenyra auth login' to authenticate.")
			return harness.ParseMissionError(
				"UNAUTHORIZED",
				"Not authenticated",
				401, nil,
			)
		}

		fmt.Fprintf(os.Stderr, "Status: AUTHENTICATED\n")
		fmt.Fprintf(os.Stderr, "Source: %s\n", source)
		fmt.Fprintf(os.Stderr, "Token:  %s…\n", token[:min(8, len(token))])
		return nil
	},
}

// ─── auth logout ────────────────────────────────────────────────────

var authLogoutCmd = &cobra.Command{
	Use:   "logout",
	Short: "Clear stored authentication",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("load config: %w", err)
		}
		cfg.Harness.APIKey = ""
		if err := cfg.Write(); err != nil {
			return fmt.Errorf("save config: %w", err)
		}
		fmt.Fprintln(os.Stderr, "Authentication cleared.")
		return nil
	},
}

func init() {
	authLoginCmd.Flags().StringP("mode", "m", "interactive", "Auth mode: interactive, automation")
	authLoginCmd.Flags().StringP("token", "t", "", "API token (overrides env and interactive)")
	authCmd.AddCommand(authLoginCmd)
	authCmd.AddCommand(authStatusCmd)
	authCmd.AddCommand(authLogoutCmd)
}
