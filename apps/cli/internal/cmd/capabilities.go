package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

// ProtocolFeatures represents the server capabilities response.
type ProtocolFeatures struct {
	ProtocolVersion      string   `json:"protocolVersion"`
	MinimumClientVersion string   `json:"minimumClientVersion"`
	Features             []string `json:"features"`
	DeprecatedFields     []string `json:"deprecatedFields,omitempty"`
}

var capabilitiesCmd = &cobra.Command{
	Use:   "capabilities",
	Short: "Show protocol capabilities",
	Long: `Show the mission protocol version and available features.

Queries the server for supported protocol version,
minimum client version, and feature list.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		jsonOutput, _ := cmd.Flags().GetBool("json")
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}

		// Try server first
		client := harness.NewMissionsClient(cfg.Harness.API)
		features, err := client.GetCapabilities(cmd.Context())
		if err == nil {
			if jsonOutput {
				enc := json.NewEncoder(os.Stdout)
				enc.SetIndent("", "  ")
				return enc.Encode(features)
			}
			fmt.Fprintf(os.Stderr, "Protocol version:      %s\n", features.ProtocolVersion)
			fmt.Fprintf(os.Stderr, "Minimum client:        %s\n", features.MinimumClientVersion)
			fmt.Fprintf(os.Stderr, "Available features:\n")
			for _, f := range features.Features {
				fmt.Fprintf(os.Stderr, "  - %s\n", f)
			}
			return nil
		}

		// Fallback: show built-in defaults
		fallback := ProtocolFeatures{
			ProtocolVersion:      "1.0",
			MinimumClientVersion: "1.0",
			Features: []string{
				"mission.create.http.v1",
				"mission.read.http.v1",
				"mission.list.http.v1",
				"mission.execute.http.v1",
				"mission.approve.http.v1",
				"mission.reject.http.v1",
				"mission.reconcile.http.v1",
				"mission.gates.read.http.v1",
				"mission.exceptions.read.http.v1",
				"mission.watch.sse.v1",
				"mission.watch.cursor.v1",
				"idempotency.key.v1",
				"idempotency.replay.v1",
				"concurrency.optimistic.v1",
				"receipt.verify.hash.v1",
				"approval.multi-signer.v1",
				"protocol.capabilities.v1",
			},
		}
		if jsonOutput {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(fallback)
		}
		fmt.Fprintf(os.Stderr, "Protocol version:      %s (local fallback)\n", fallback.ProtocolVersion)
		fmt.Fprintf(os.Stderr, "Minimum client:        %s\n", fallback.MinimumClientVersion)
		fmt.Fprintf(os.Stderr, "Available features:\n")
		for _, f := range fallback.Features {
			fmt.Fprintf(os.Stderr, "  - %s\n", f)
		}
		fmt.Fprintf(os.Stderr, "\nNote: server unreachable, showing local defaults\n")
		return nil
	},
}

func init() {
	capabilitiesCmd.Flags().Bool("json", false, "JSON output")
	rootCmd.AddCommand(capabilitiesCmd)
}
