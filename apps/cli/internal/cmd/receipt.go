package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

var receiptVerifyF = struct {
	json    bool
	offline string
	signed  bool
}{}

var receiptVerifyCmd = &cobra.Command{
	Use:   "verify <mission-id | file>",
	Short: "Verify receipt integrity",
	Long: `Verify a mission receipt.

Server verification (default):
  drenyra receipt verify mis_123

Offline hash verification:
  drenyra receipt verify ./receipt.json --offline
  Verifies SHA-256 content hash locally.

Offline signed receipt verification:
  drenyra receipt verify ./signed-receipt.json --offline --signed
  Verifies BOTH SHA-256 integrity and Ed25519 signature locally.
`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		// Offline mode: verify a local receipt file
		if receiptVerifyF.offline != "" {
			if receiptVerifyF.signed {
				return verifyLocalSignedReceipt(args[0])
			}
			return verifyLocalReceipt(args[0])
		}

		// Server verification
		cfg, err := config.Load()
		if err != nil {
			return fmt.Errorf("config: %w", err)
		}
		client := harness.NewMissionsClient(cfg.Harness.API)
		if cfg.Harness.APIKey != "" {
			client.AuthToken = cfg.Harness.APIKey
		}

		receipt, err := client.VerifyReceipt(cmd.Context(), args[0])
		if err != nil {
			return fmt.Errorf("verify receipt: %w", err)
		}
		if receiptVerifyF.json {
			fmt.Fprintf(os.Stdout, `{"valid":%t,"receiptHash":"%s","missionId":"%s"}`, receipt.Valid, receipt.ReceiptHash, receipt.MissionID)
			fmt.Fprintln(os.Stdout)
		} else {
			if receipt.Valid {
				short := receipt.ReceiptHash
				if len(short) > 16 {
					short = short[:16] + "..."
				}
				fmt.Fprintf(os.Stdout, "Receipt VALID: %s\n", short)
			} else {
				fmt.Fprintf(os.Stdout, "Receipt INVALID or not found for mission %s\n", receipt.MissionID)
			}
		}
		return nil
	},
}

func verifyLocalReceipt(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read receipt file: %w", err)
	}

	var envelope struct {
		Content     *harness.ReceiptContent `json:"content"`
		ReceiptHash string                  `json:"receiptHash"`
	}
	if err := json.Unmarshal(data, &envelope); err != nil {
		return fmt.Errorf("parse receipt file: %w", err)
	}

	if envelope.Content == nil || envelope.ReceiptHash == "" {
		return fmt.Errorf("invalid receipt file: missing 'content' or 'receiptHash'")
	}

	result, err := harness.VerifyReceiptLocally(envelope.Content, envelope.ReceiptHash)
	if err != nil {
		return fmt.Errorf("verify receipt: %w", err)
	}

	if receiptVerifyF.json {
		out, _ := json.MarshalIndent(result, "", "  ")
		fmt.Fprintln(os.Stdout, string(out))
	} else {
		if result.Valid {
			fmt.Fprintf(os.Stdout, "Receipt VALID (offline)\n")
			fmt.Fprintf(os.Stdout, "  Hash: %s\n", result.ComputedHash)
		} else {
			fmt.Fprintf(os.Stdout, "Receipt INVALID (offline)\n")
			fmt.Fprintf(os.Stdout, "  Computed: %s\n", result.ComputedHash)
			fmt.Fprintf(os.Stdout, "  Expected: %s\n", result.AssertedHash)
		}
	}
	return nil
}

func verifyLocalSignedReceipt(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read signed receipt file: %w", err)
	}

	receipt, err := harness.ParseSignedReceipt(data)
	if err != nil {
		return fmt.Errorf("parse signed receipt: %w", err)
	}

	result, err := harness.VerifySignedReceiptLocally(receipt)
	if err != nil {
		return fmt.Errorf("verify signed receipt: %w", err)
	}

	if receiptVerifyF.json {
		out, _ := json.MarshalIndent(result, "", "  ")
		fmt.Fprintln(os.Stdout, string(out))
	} else {
		fmt.Fprintf(os.Stdout, "Signed receipt verification (offline)\n")
		fmt.Fprintf(os.Stdout, "  Protocol:      %s\n", result.ProtocolVersion)
		fmt.Fprintf(os.Stdout, "  Signer key:    %s\n", result.KeyID)
		fmt.Fprintf(os.Stdout, "  Hash:          %v\n", result.HashValid)
		fmt.Fprintf(os.Stdout, "  Signature:     %v\n", result.SignatureValid)
		if result.Valid {
			fmt.Fprintf(os.Stdout, "  Result:        VALID\n")
		} else {
			fmt.Fprintf(os.Stdout, "  Result:        INVALID\n")
		}
	}
	return nil
}

func init() {
	receiptVerifyCmd.Flags().BoolVar(&receiptVerifyF.json, "json", false, "JSON output")
	receiptVerifyCmd.Flags().StringVarP(&receiptVerifyF.offline, "offline", "o", "", "Verify a local receipt file")
	receiptVerifyCmd.Flags().BoolVar(&receiptVerifyF.signed, "signed", false, "Verify a signed receipt (Ed25519)")
	rootCmd.AddCommand(receiptVerifyCmd)
}
