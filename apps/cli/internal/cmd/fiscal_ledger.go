package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

// ─── Fiscal Ledger: classify ─────────────────────────────────────────

var fiscalLedgerClassifyFlags struct {
	file  string
	stdin bool
}

var fiscalLedgerClassifyCmd = &cobra.Command{
	Use:   "ledger-classify",
	Short: "Classify a transaction with fiscal impact (FGL)",
	Long: `Classify a transaction using the Fiscal General Ledger engine.
Determines IGV treatment, detracción, SIRE category, and fiscal period.

Examples:
  drenyra fiscal ledger-classify --stdin
  drenyra fiscal ledger-classify --file transaccion.json

Input JSON:
{
  "tipoComprobante": "01",
  "serie": "F001",
  "montoTotal": 118.00,
  "moneda": "PEN",
  "descripcion": "Servicios legales",
  "tipo": "VENTA",
  "fechaEmision": "2026-07-09"
}`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{
			file:  fiscalLedgerClassifyFlags.file,
			stdin: fiscalLedgerClassifyFlags.stdin,
		}, &input); err != nil {
			return err
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/fiscal/ledger/classify", input, &result); err != nil {
			return fmt.Errorf("classification failed: %w", err)
		}

		outputJSON, _ := cmd.Flags().GetBool("json")
		if outputJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		}

		classification, _ := result["classification"].(map[string]any)

		tui.Banner("FISCAL CLASSIFICATION")
		fmt.Println()

		if classification != nil {
			fmt.Printf("  %s %v\n", tui.T().Header.Render("IGV:"), classification["igvTreatment"])
			fmt.Printf("  %s %v\n", tui.T().Header.Render("Type:"), classification["igvType"])
			fmt.Printf("  %s %v%%\n", tui.T().Header.Render("Rate:"), classification["igvRate"])
			fmt.Printf("  %s S/ %v\n", tui.T().Header.Render("Base:"), classification["baseImponible"])
			fmt.Printf("  %s S/ %v\n", tui.T().Header.Render("IGV:"), classification["igvAmount"])

			if det, ok := classification["detraccion"].(map[string]any); ok {
				if aplica, _ := det["aplica"].(bool); aplica {
					fmt.Printf("\n  %s Code %v · %v%% · S/ %v\n",
						tui.T().Warn.Render("Detracción:"),
						det["codigo"], det["porcentaje"], det["monto"])
				}
			}

			fmt.Printf("\n  %s %v\n", tui.T().MutedText.Render("SIRE:"), classification["sireCategory"])
			fmt.Printf("  %s %v\n", tui.T().MutedText.Render("Period:"), classification["periodo"])
		}
		fmt.Println()
		return nil
	},
}

func init() {
	fiscalLedgerClassifyCmd.Flags().StringVar(&fiscalLedgerClassifyFlags.file, "file", "", "JSON input file path")
	fiscalLedgerClassifyCmd.Flags().BoolVar(&fiscalLedgerClassifyFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalLedgerClassifyCmd.Flags().Bool("json", false, "JSON output")
	fiscalLedgerClassifyCmd.Flags().String("ruc", "", "Company RUC")
	fiscalLedgerClassifyCmd.Flags().String("periodo", "", "Fiscal period")
	fiscalCmd.AddCommand(fiscalLedgerClassifyCmd)
}
