package cmd

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
	"github.com/spf13/cobra"
)

// ─── Parent: drenyra pipeline ───────────────────────────────────────

var pipelineCmd = &cobra.Command{
	Use:   "pipeline",
	Short: "Fiscal compliance pipeline (solicitud→auditoría)",
	Long: `Execute and manage the fiscal compliance pipeline.

The pipeline runs 6 phases sequentially:
  solicitud → análisis → diseño → plan → migración → auditoría

Each phase has gates, review guard, and compliance chains.

Commands:
  run      Start a new compliance pipeline
  status   Check pipeline status by changeId
  resume   Resume a paused/completed pipeline
  list     List active pipeline changes`,
}

// ─── Pipeline run ────────────────────────────────────────────────────

var pipelineRunCmd = &cobra.Command{
	Use:   "run <change-id>",
	Short: "Start a new compliance pipeline",
	Long: `Start a new fiscal compliance pipeline.

Example:
  drenyra pipeline run cambio-igv-001 \
    --ruc 20123456786 \
    --periodo 2026-08 \
    --titulo "IGV Rate Change 18% → 19%" \
    --normativa "Ley N° 12345" \
    --mode auto

  drenyra pipeline run cambio-igv-001 \
    --interactive \
    --json`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		changeID := args[0]
		mode, _ := cmd.Flags().GetString("mode")
		ruc, _ := cmd.Flags().GetString("ruc")
		periodo, _ := cmd.Flags().GetString("periodo")
		titulo, _ := cmd.Flags().GetString("titulo")
		normativa, _ := cmd.Flags().GetString("normativa")
		descripcion, _ := cmd.Flags().GetString("descripcion")
		outputJSON, _ := cmd.Flags().GetBool("json")

		if ruc == "" {
			ruc = cfg.Fiscal.CompanyRUC
		}
		if periodo == "" {
			periodo = cfg.Fiscal.Period
		}
		if titulo == "" {
			titulo = fmt.Sprintf("Cambio: %s", changeID)
		}

		if mode == "" {
			mode = "auto"
		}

		if outputJSON {
			fmt.Fprintf(os.Stderr, "Iniciando pipeline %s (RUC: %s, período: %s)...\n", changeID, ruc, periodo)
		} else {
			tui.Banner("COMPLIANCE PIPELINE")
			fmt.Println()
			fmt.Printf("  %s  %s\n", tui.T().Header.Render(changeID), tui.T().MutedText.Render(titulo))
			fmt.Printf("  %s RUC %s · %s\n", tui.T().MutedText.Render("Scope:"), ruc, periodo)
			fmt.Printf("  %s %s\n", tui.T().MutedText.Render("Mode:"), mode)
			fmt.Println()
		}

		body := map[string]any{
			"changeId": changeID,
			"scope": map[string]string{
				"organizationId": cfg.Fiscal.OrganizationID,
				"companyId":      cfg.Fiscal.CompanyID,
				"companyRuc":     ruc,
				"period":         periodo,
			},
			"metadata": map[string]string{
				"title":         titulo,
				"regulationRef": normativa,
				"description":   descripcion,
			},
			"mode": mode,
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/compliance/pipeline/run", body, &result); err != nil {
			return fmt.Errorf("pipeline execution failed: %w", err)
		}

		if outputJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		}

		status, _ := result["status"].(string)
		message, _ := result["message"].(string)
		blockedAt, _ := result["blockedAtFase"].(string)

		fmt.Println()
		switch status {
		case "COMPLETED":
			fmt.Printf("  %s Pipeline completed\n", tui.Check(true, "Status", "COMPLETED"))
		case "PREFLIGHT_BLOCKED":
			fmt.Printf("  %s Preflight blocked: %s\n", tui.Check(false, "Status", "BLOCKED"), message)
		case "AWAITING_APPROVAL":
			fmt.Printf("  %s Approval required at fase: %s\n", tui.Check(false, "Status", "PENDING"), blockedAt)
		case "FAILED":
			fmt.Printf("  %s Pipeline failed: %s\n", tui.Check(false, "Status", "FAILED"), message)
		case "BLOCKED":
			fmt.Printf("  %s Pipeline blocked at %s\n", tui.Check(false, "Status", "BLOCKED"), blockedAt)
		default:
			fmt.Printf("  %s  %s\n", tui.T().Header.Render(status), message)
		}
		fmt.Println()

		return nil
	},
}

// ─── Pipeline status ─────────────────────────────────────────────────

var pipelineStatusCmd = &cobra.Command{
	Use:   "status <change-id>",
	Short: "Check pipeline execution status",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		changeID := args[0]
		outputJSON, _ := cmd.Flags().GetBool("json")

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/compliance/pipeline/status", map[string]string{
			"changeId": changeID,
		}, &result); err != nil {
			return fmt.Errorf("status check failed: %w", err)
		}

		if outputJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		}

		tui.Banner("PIPELINE STATUS")
		fmt.Println()
		for key, val := range result {
			fmt.Printf("  %s: %v\n", tui.T().MutedText.Render(key+":"), val)
		}
		fmt.Println()
		return nil
	},
}

// ─── Pipeline list ───────────────────────────────────────────────────

var pipelineListCmd = &cobra.Command{
	Use:   "list",
	Short: "List active pipeline changes",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		outputJSON, _ := cmd.Flags().GetBool("json")

		var result []any
		if err := apiPOST(cmd.Context(), cfg, "/api/compliance/pipeline/list", map[string]string{
			"companyRuc": cfg.Fiscal.CompanyRUC,
		}, &result); err != nil {
			return fmt.Errorf("list failed: %w", err)
		}

		if outputJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		}

		tui.Banner("ACTIVE PIPELINES")
		fmt.Println()

		if len(result) == 0 {
			fmt.Printf("  %s No active pipelines\n", tui.T().MutedText.Render("—"))
			fmt.Println()
			return nil
		}

		for i, r := range result {
			item, ok := r.(map[string]any)
			if !ok {
				continue
			}

			changeID, _ := item["changeId"].(string)
			status, _ := item["status"].(string)
			fase, _ := item["currentFase"].(string)
			title, _ := item["title"].(string)

			badge := statusBadge(status)
			fmt.Printf("  %d. %s %s\n", i+1, badge, tui.T().Header.Render(changeID))
			if title != "" {
				fmt.Printf("     %s\n", tui.T().MutedText.Render(title))
			}
			fmt.Printf("     Fase: %s\n", fase)
			fmt.Println()
		}

		return nil
	},
}

func statusBadge(status string) string {
	switch status {
	case "COMPLETED":
		return tui.T().OK.Render("✓")
	case "AWAITING_APPROVAL":
		return tui.T().Warn.Render("◷")
	case "RUNNING":
		return tui.T().Header.Render("●")
	case "FAILED", "BLOCKED", "PREFLIGHT_BLOCKED":
		return tui.T().Err.Render("✗")
	default:
		return "?"
	}
}

// ─── Shared flags ────────────────────────────────────────────────────

func init() {
	// Pipeline flags
	pipelineRunCmd.Flags().String("mode", "auto", "Execution mode: auto | interactive | supervised")
	pipelineRunCmd.Flags().String("ruc", "", "Company RUC (default: from config)")
	pipelineRunCmd.Flags().String("periodo", "", "Fiscal period YYYY-MM (default: from config)")
	pipelineRunCmd.Flags().String("titulo", "", "Change title")
	pipelineRunCmd.Flags().String("normativa", "", "Regulation reference (law/article)")
	pipelineRunCmd.Flags().String("descripcion", "", "Change description")
	pipelineRunCmd.Flags().Bool("json", false, "JSON output")

	pipelineStatusCmd.Flags().Bool("json", false, "JSON output")
	pipelineListCmd.Flags().Bool("json", false, "JSON output")

	// Register
	pipelineCmd.AddCommand(pipelineRunCmd)
	pipelineCmd.AddCommand(pipelineStatusCmd)
	pipelineCmd.AddCommand(pipelineListCmd)
	rootCmd.AddCommand(pipelineCmd)
}
