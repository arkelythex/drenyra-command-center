package cmd

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
	"github.com/charmbracelet/lipgloss"
	"github.com/spf13/cobra"
)

// ─── Parent: drenyra fiscal ─────────────────────────────────────────

var fiscalCmd = &cobra.Command{
	Use:   "fiscal",
	Short: "Fiscal intelligence commands",
	Long: `Fiscal intelligence and analysis tools for the Drenyra ecosystem.

Provides access to all 5 Phase 2 intelligence pillars:
  - anomalies   Detect fiscal anomalies (RUC breach, IGV, duplicates)
  - cashflow    Analyze cashflow patterns and anomalies
  - compliance  Check fiscal compliance (SIRE, detracciones, calendar)
  - suppliers   Assess supplier risk (concentration, delays, aging)
  - classify    Classify documents by format, type, and SUNAT series
  - roi         ROI calculations (NPV, IRR, payback, scenarios)
  - check-ruc   Validate RUC checksum (Módulo 11)

Pipe JSON data via --file or stdin. Use --json for machine-readable output.`,
}

// ─── Shared flags ────────────────────────────────────────────────────

type fiscalCmdFlags struct {
	scope  fiscalFlags
	file   string
	stdin  bool
}

func bindFiscalCmdFlags(cmd *cobra.Command, f *fiscalCmdFlags) {
	bindFiscalFlags(cmd, &f.scope)
	cmd.Flags().StringVar(&f.file, "file", "", "JSON input file path")
	cmd.Flags().BoolVar(&f.stdin, "stdin", false, "read JSON from stdin")
}

func loadInput(f *fiscalCmdFlags, dest any) error {
	var data []byte
	var err error

	switch {
	case f.stdin:
		data, err = io.ReadAll(os.Stdin)
		if err != nil {
			return fmt.Errorf("reading stdin: %w", err)
		}
	case f.file != "":
		data, err = os.ReadFile(f.file)
		if err != nil {
			return fmt.Errorf("reading %q: %w", f.file, err)
		}
	default:
		return fmt.Errorf("use --file <path> or --stdin to provide JSON input")
	}

	if err := json.Unmarshal(data, dest); err != nil {
		return fmt.Errorf("invalid JSON: %w", err)
	}
	return nil
}

// apiBase derives the API base URL from the harness config by stripping
// the harness-specific suffix.
func apiBase(cfg *config.Config) string {
	base := strings.TrimRight(cfg.Harness.API, "/")
	base = strings.TrimSuffix(base, "/api/fiscal-command-center/harness")
	base = strings.TrimSuffix(base, "/api/drenyra")
	return base
}

func apiPOST(ctx context.Context, cfg *config.Config, path string, body, dest any) error {
	url := apiBase(cfg) + path

	payload, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshalling request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	if cfg.Fiscal.OrganizationID != "" {
		req.Header.Set("x-organization-id", cfg.Fiscal.OrganizationID)
		req.Header.Set("x-company-id", cfg.Fiscal.CompanyID)
		req.Header.Set("x-company-ruc", cfg.Fiscal.CompanyRUC)
	}

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("API request failed: %w", err)
	}
	defer res.Body.Close()

	raw, err := io.ReadAll(res.Body)
	if err != nil {
		return fmt.Errorf("reading response: %w", err)
	}
	if res.StatusCode >= 400 {
		return fmt.Errorf("API error %d: %s", res.StatusCode, string(raw))
	}

	// Try to unwrap { success: true, data: ... } envelope first
	var envelope struct {
		Success bool            `json:"success"`
		Data    json.RawMessage `json:"data"`
		Error   string          `json:"error"`
	}
	if err := json.Unmarshal(raw, &envelope); err == nil && envelope.Success {
		if dest != nil {
			return json.Unmarshal(envelope.Data, dest)
		}
		return nil
	}
	// Fallback: raw response is the data
	return json.Unmarshal(raw, dest)
}

// ─── RUC validation (local) ──────────────────────────────────────────

var rucPrefixPattern = regexp.MustCompile(`^(10|15|17|20)`)

var fiscalCheckRUCCmd = &cobra.Command{
	Use:   "check-ruc <ruc>",
	Short: "Validate a Peruvian RUC using Módulo 11 checksum",
	Args:  cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		ruc := args[0]
		result := validateRUCLocal(ruc)
		if fiscalCheckRUCFlags.scope.outputFormat == "json" {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(result)
		}
		if result.Valid {
			fmt.Println(tui.Check(true, "RUC", ruc))
		} else {
			fmt.Println(tui.Check(false, "RUC", fmt.Sprintf("%s — %s", ruc, result.Reason)))
		}
		return nil
	},
}

var fiscalCheckRUCFlags struct {
	scope fiscalFlags
}

type rucValidationResult struct {
	RUC    string `json:"ruc"`
	Valid  bool   `json:"valid"`
	Reason string `json:"reason,omitempty"`
}

func validateRUCLocal(ruc string) rucValidationResult {
	if len(ruc) != 11 {
		return rucValidationResult{RUC: ruc, Valid: false, Reason: "must be exactly 11 digits"}
	}
	if !rucPrefixPattern.MatchString(ruc) {
		return rucValidationResult{RUC: ruc, Valid: false, Reason: "invalid prefix (must start with 10, 15, 17, or 20)"}
	}
	if !validRUCChecksum(ruc) {
		return rucValidationResult{RUC: ruc, Valid: false, Reason: "Módulo 11 checksum failed"}
	}
	return rucValidationResult{RUC: ruc, Valid: true, Reason: "Módulo 11 checksum valid"}
}

func validRUCChecksum(ruc string) bool {
	if len(ruc) != 11 {
		return false
	}
	weights := []int{5, 4, 3, 2, 7, 6, 5, 4, 3, 2}
	sum := 0
	for i, weight := range weights {
		digit, err := strconv.Atoi(ruc[i : i+1])
		if err != nil {
			return false
		}
		sum += digit * weight
	}
	check := 11 - (sum % 11)
	if check == 10 {
		check = 0
	} else if check == 11 {
		check = 1
	}
	last, err := strconv.Atoi(ruc[10:11])
	return err == nil && last == check
}

// ─── Anomalies ───────────────────────────────────────────────────────

var fiscalAnomaliesFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalAnomaliesCmd = &cobra.Command{
	Use:   "anomalies",
	Short: "Detect fiscal anomalies",
	Long: `Detect fiscal anomalies across multiple strategies:
  - RUC breach (Art. 12 TUO IGV — threshold S/ 5,000 PEN)
  - IGV miscalculation (expected 18% vs actual)
  - Duplicate invoices (same serie+numero, suspicious rapid emission)

Provide JSON input via --file <path> or --stdin.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalAnomaliesFlags.file, stdin: fiscalAnomaliesFlags.stdin}, &input); err != nil {
			return err
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/intelligence/anomalies/detect", input, &result); err != nil {
			return err
		}

		return renderAnomalyResult(fiscalAnomaliesFlags.scope.outputFormat, result)
	},
}

// ─── Cashflow ────────────────────────────────────────────────────────

var fiscalCashflowFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalCashflowCmd = &cobra.Command{
	Use:   "cashflow",
	Short: "Analyze cashflow patterns and anomalies",
	Long: `Analyze cashflow transaction data for:
  - Z-score statistical outliers
  - Trend reversals (positive→negative or vice versa)
  - Income drops (>30% below rolling average)
  - Expense spikes (>50% above rolling average)

Provide transaction JSON via --file <path> or --stdin.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalCashflowFlags.file, stdin: fiscalCashflowFlags.stdin}, &input); err != nil {
			return err
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/intelligence/cashflow/analyze", input, &result); err != nil {
			return err
		}

		return renderAnomalyResult(fiscalCashflowFlags.scope.outputFormat, result)
	},
}

// ─── Compliance ──────────────────────────────────────────────────────

var fiscalComplianceFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalComplianceCmd = &cobra.Command{
	Use:   "compliance",
	Short: "Check fiscal compliance",
	Long: `Validate compliance across:
  - SIRE filing deadlines (R.S. 000155-2021/SUNAT, 7-day window)
  - SPOT detracción rates (42 official rate codes)
  - Tax calendar obligations per regime

Provide compliance data JSON via --file <path> or --stdin.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalComplianceFlags.file, stdin: fiscalComplianceFlags.stdin}, &input); err != nil {
			return err
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/intelligence/compliance/check", input, &result); err != nil {
			return err
		}

		return renderAnomalyResult(fiscalComplianceFlags.scope.outputFormat, result)
	},
}

// ─── Suppliers ───────────────────────────────────────────────────────

var fiscalSuppliersFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalSuppliersCmd = &cobra.Command{
	Use:   "suppliers",
	Short: "Assess supplier risk",
	Long: `Analyze supplier risk across 5 dimensions:
  - Concentration risk (top supplier dependency)
  - Payment delay trends
  - New supplier high-value alerts
  - Debt aging profiles
  - Duplicate detection (RUC + bank account)

Provide suppliers + transactions JSON via --file <path> or --stdin.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalSuppliersFlags.file, stdin: fiscalSuppliersFlags.stdin}, &input); err != nil {
			return err
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/intelligence/suppliers/analyze", input, &result); err != nil {
			return err
		}

		return renderAnomalyResult(fiscalSuppliersFlags.scope.outputFormat, result)
	},
}

// ─── Document Classification ─────────────────────────────────────────

var fiscalClassifyFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalClassifyCmd = &cobra.Command{
	Use:   "classify",
	Short: "Classify fiscal documents",
	Long: `Classify documents by format, content type, and SUNAT series:
  - Format: IMAGE, XML, PDF
  - Content: invoice, receipt, identity, contract, bank_statement, sunat_xml
  - SUNAT series: F, B, E, FC, BC prefixes
  - Completeness scoring with missing field detection

Provide documents JSON via --file <path> or --stdin.`,
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalClassifyFlags.file, stdin: fiscalClassifyFlags.stdin}, &input); err != nil {
			return err
		}

		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/intelligence/documents/classify", input, &result); err != nil {
			return err
		}

		return renderClassifyResult(fiscalClassifyFlags.scope.outputFormat, result)
	},
}

// ─── ROI Parent + Subcommands ────────────────────────────────────────

var fiscalROICmd = &cobra.Command{
	Use:   "roi",
	Short: "ROI calculations (NPV, IRR, payback, scenarios)",
	Long: `Financial analysis tools for investment decisions:
  - calculate  ROI percentage and net return
  - payback    Payback period in years
  - npv        Net Present Value with discount rate
  - irr        Internal Rate of Return (Newton's method)
  - scenario   Compare multiple scenarios side by side`,
}

var fiscalROICalculateFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalROICalculateCmd = &cobra.Command{
	Use:   "calculate",
	Short: "Calculate ROI percentage and net return",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalROICalculateFlags.file, stdin: fiscalROICalculateFlags.stdin}, &input); err != nil {
			return err
		}
		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/fiscal/roi/calculate", input, &result); err != nil {
			return err
		}
		return renderROIResult(fiscalROICalculateFlags.scope.outputFormat, result)
	},
}

var fiscalROIPaybackFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalROIPaybackCmd = &cobra.Command{
	Use:   "payback",
	Short: "Calculate payback period in years",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalROIPaybackFlags.file, stdin: fiscalROIPaybackFlags.stdin}, &input); err != nil {
			return err
		}
		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/fiscal/roi/payback", input, &result); err != nil {
			return err
		}
		return renderROIResult(fiscalROIPaybackFlags.scope.outputFormat, result)
	},
}

var fiscalROINPVFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalROINPVCmd = &cobra.Command{
	Use:   "npv",
	Short: "Calculate Net Present Value",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalROINPVFlags.file, stdin: fiscalROINPVFlags.stdin}, &input); err != nil {
			return err
		}
		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/fiscal/roi/npv", input, &result); err != nil {
			return err
		}
		return renderROIResult(fiscalROINPVFlags.scope.outputFormat, result)
	},
}

var fiscalROIIRRFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalROIIRRCmd = &cobra.Command{
	Use:   "irr",
	Short: "Calculate Internal Rate of Return (Newton's method)",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalROIIRRFlags.file, stdin: fiscalROIIRRFlags.stdin}, &input); err != nil {
			return err
		}
		var result map[string]any
		if err := apiPOST(cmd.Context(), cfg, "/api/fiscal/roi/irr", input, &result); err != nil {
			return err
		}
		return renderROIResult(fiscalROIIRRFlags.scope.outputFormat, result)
	},
}

var fiscalROIScenarioFlags struct {
	scope fiscalFlags
	file  string
	stdin bool
}

var fiscalROIScenarioCmd = &cobra.Command{
	Use:   "scenario",
	Short: "Compare multiple investment scenarios",
	RunE: func(cmd *cobra.Command, _ []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		var input map[string]any
		if err := loadInput(&fiscalCmdFlags{file: fiscalROIScenarioFlags.file, stdin: fiscalROIScenarioFlags.stdin}, &input); err != nil {
			return err
		}
		var result []any
		if err := apiPOST(cmd.Context(), cfg, "/api/fiscal/roi/scenario", input, &result); err != nil {
			return err
		}
		return renderROIScenarioResult(fiscalROIScenarioFlags.scope.outputFormat, result)
	},
}

// ─── Renderers ───────────────────────────────────────────────────────

func renderAnomalyResult(format string, result map[string]any) error {
	if format == "json" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	}

	anomalies, _ := result["anomalies"].([]any)
	summary, _ := result["summary"].(map[string]any)

	tui.Banner("ANOMALY DETECTION")
	fmt.Println()

	// Summary header
	if summary != nil {
		total, _ := summary["total"].(float64)
		execMs, _ := summary["executionTimeMs"].(float64)
		fmt.Printf("  %s anomalies found in %s\n\n",
			tui.T().Header.Render(fmt.Sprintf("%.0f", total)),
			tui.T().MutedText.Render(fmt.Sprintf("%.0f ms", execMs)))

		if bySeverity, ok := summary["bySeverity"].(map[string]any); ok {
			fmt.Println(tui.Panel(" Severity", renderSeverityBreakdown(bySeverity)))
			fmt.Println()
		}
		if byStrategy, ok := summary["byStrategy"].(map[string]any); ok {
			fmt.Println(tui.Panel(" By Strategy", renderStrategyBreakdown(byStrategy)))
			fmt.Println()
		}
	}

	// Individual anomalies
	for i, a := range anomalies {
		anomaly, ok := a.(map[string]any)
		if !ok {
			continue
		}
		renderSingleAnomaly(i+1, anomaly)
	}

	return nil
}

func renderSingleAnomaly(idx int, a map[string]any) {
	severity, _ := a["severity"].(string)
	method, _ := a["detectionMethod"].(string)
	reasoning, _ := a["reasoning"].(string)
	entityType, _ := a["entityType"].(string)
	entityID, _ := a["entityId"].(string)
	confidence, _ := a["confidence"].(float64)
	metric, _ := a["metric"].(string)
	expected, _ := a["expectedValue"].(float64)
	actual, _ := a["actualValue"].(float64)

	fmt.Printf("  %s  %s\n",
		tui.TierBadge(severity),
		tui.T().Header.Render(fmt.Sprintf("#%d: %s", idx, method)))

	if entityType != "" && entityID != "" {
		fmt.Printf("    %s %s/%s\n",
			tui.T().MutedText.Render("on"),
			entityType, entityID)
	}
	if metric != "" {
		fmt.Printf("    %s %s — expected %.2f, actual %.2f\n",
			tui.T().MutedText.Render("metric:"),
			metric, expected, actual)
	}
	fmt.Printf("    %s %.0f%%\n",
		tui.T().MutedText.Render("confidence:"),
		confidence*100)
	fmt.Printf("    %s\n", reasoning)
	fmt.Println()
}

func renderSeverityBreakdown(bySeverity map[string]any) string {
	var b strings.Builder
	for _, s := range []string{"critical", "high", "medium", "low"} {
		if count, ok := bySeverity[s]; ok {
			c, _ := count.(float64)
			if c > 0 {
				b.WriteString(fmt.Sprintf("  %s  %s\n",
					tui.StatusBadge(s),
					tui.T().MutedText.Render(fmt.Sprintf("%.0f", c))))
			}
		}
	}
	return b.String()
}

func renderStrategyBreakdown(byStrategy map[string]any) string {
	var b strings.Builder
	for name, count := range byStrategy {
		c, _ := count.(float64)
		b.WriteString(fmt.Sprintf("  %s    %s\n",
			tui.T().MutedText.Render(fmt.Sprintf("%.0f", c)),
			name))
	}
	return b.String()
}

func renderClassifyResult(format string, result map[string]any) error {
	if format == "json" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	}

	results, _ := result["results"].([]any)
	summary, _ := result["summary"].(map[string]any)

	tui.Banner("DOCUMENT CLASSIFICATION")
	fmt.Println()

	if summary != nil {
		total, _ := summary["total"].(float64)
		fmt.Printf("  %s documents classified\n\n",
			tui.T().Header.Render(fmt.Sprintf("%.0f", total)))
	}

	for i, r := range results {
		res, ok := r.(map[string]any)
		if !ok {
			continue
		}

		docID, _ := res["documentId"].(string)
		detectedType, _ := res["detectedType"].(string)
		detectedFormat, _ := res["detectedFormat"].(string)
		confidence, _ := res["confidence"].(float64)
		completeness, _ := res["completenessScore"].(float64)
		sunatType, _ := res["sunatType"].(string)

		fmt.Printf("  %s. %s\n",
			tui.T().Header.Render(fmt.Sprintf("#%d", i+1)),
			tui.T().MutedText.Render(docID))
		fmt.Printf("    type: %s  format: %s", detectedType, detectedFormat)
		if sunatType != "" {
			fmt.Printf("  SUNAT: %s", sunatType)
		}
		fmt.Println()
		fmt.Printf("    confidence: %s  completeness: %s\n",
			renderConfidenceBar(confidence),
			renderConfidenceBar(completeness))

		if missing, ok := res["missingFields"].([]any); ok && len(missing) > 0 {
			fields := make([]string, len(missing))
			for j, m := range missing {
				fields[j] = fmt.Sprintf("%v", m)
			}
			fmt.Printf("    missing: %s\n", tui.T().Warn.Render(strings.Join(fields, ", ")))
		}
		fmt.Println()
	}

	return nil
}

func renderROIResult(format string, result map[string]any) error {
	if format == "json" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	}

	tui.Banner("ROI CALCULATION")
	fmt.Println()

	// Try common ROI output fields
	for key, val := range result {
		switch v := val.(type) {
		case float64:
			if strings.Contains(strings.ToLower(key), "roi") || strings.Contains(strings.ToLower(key), "percentage") {
				fmt.Printf("  %s  %s\n", tui.T().Header.Render(fmt.Sprintf("%.2f%%", v*100)), tui.T().MutedText.Render(key))
			} else if strings.Contains(strings.ToLower(key), "npv") {
				fmt.Printf("  %s  %s\n", tui.T().Header.Render(fmt.Sprintf("PEN %.2f", v)), tui.T().MutedText.Render(key))
			} else if strings.Contains(strings.ToLower(key), "irr") {
				fmt.Printf("  %s  %s\n", tui.T().Header.Render(fmt.Sprintf("%.2f%%", v*100)), tui.T().MutedText.Render(key))
			} else if strings.Contains(strings.ToLower(key), "payback") {
				fmt.Printf("  %s  %s\n", tui.T().Header.Render(fmt.Sprintf("%.2f years", v)), tui.T().MutedText.Render(key))
			} else if strings.Contains(strings.ToLower(key), "net") {
				fmt.Printf("  %s  %s\n", tui.T().Header.Render(fmt.Sprintf("PEN %.2f", v)), tui.T().MutedText.Render(key))
			} else {
				fmt.Printf("  %s  %s\n", tui.T().Header.Render(fmt.Sprintf("%.4f", v)), tui.T().MutedText.Render(key))
			}
		case string:
			fmt.Printf("  %s  %s\n", tui.T().MutedText.Render(key+":"), v)
		default:
			fmt.Printf("  %s  %v\n", tui.T().MutedText.Render(key+":"), v)
		}
	}
	fmt.Println()

	return nil
}

func renderROIScenarioResult(format string, results []any) error {
	if format == "json" {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(results)
	}

	tui.Banner("SCENARIO COMPARISON")
	fmt.Println()

	for i, s := range results {
		scenario, ok := s.(map[string]any)
		if !ok {
			continue
		}

		name, _ := scenario["name"].(string)
		if name == "" {
			name = fmt.Sprintf("Scenario %d", i+1)
		}
		fmt.Printf("  %s\n", tui.T().Header.Render(name))

		for key, val := range scenario {
			if key == "name" {
				continue
			}
			switch v := val.(type) {
			case float64:
				if strings.Contains(strings.ToLower(key), "roi") || strings.Contains(strings.ToLower(key), "irr") {
					fmt.Printf("    %s: %s\n", key, tui.T().Header.Render(fmt.Sprintf("%.2f%%", v*100)))
				} else if strings.Contains(strings.ToLower(key), "payback") {
					fmt.Printf("    %s: %s\n", key, tui.T().Header.Render(fmt.Sprintf("%.2f years", v)))
				} else if strings.Contains(strings.ToLower(key), "npv") || strings.Contains(strings.ToLower(key), "net") {
					fmt.Printf("    %s: %s\n", key, tui.T().Header.Render(fmt.Sprintf("PEN %.2f", v)))
				} else {
					fmt.Printf("    %s: %.4f\n", key, v)
				}
			default:
				fmt.Printf("    %s: %v\n", key, v)
			}
		}
		fmt.Println()
	}

	return nil
}

func renderConfidenceBar(score float64) string {
	barLen := 10
	filled := int(score * float64(barLen))
	if filled > barLen {
		filled = barLen
	}
	bar := strings.Repeat("█", filled) + strings.Repeat("░", barLen-filled)
	pct := int(score * 100)

	var style lipgloss.Style
	switch {
	case pct >= 80:
		style = tui.T().OK
	case pct >= 50:
		style = tui.T().Warn
	default:
		style = tui.T().Err
	}

	return fmt.Sprintf("%s %d%%", style.Render(bar), pct)
}

// ─── Registration ────────────────────────────────────────────────────

func init() {
	rootCmd.AddCommand(fiscalCmd)

	// check-ruc
	bindFiscalFlags(fiscalCheckRUCCmd, &fiscalCheckRUCFlags.scope)
	fiscalCmd.AddCommand(fiscalCheckRUCCmd)

	// anomalies
	bindFiscalFlags(fiscalAnomaliesCmd, &fiscalAnomaliesFlags.scope)
	fiscalAnomaliesCmd.Flags().StringVar(&fiscalAnomaliesFlags.file, "file", "", "JSON input file")
	fiscalAnomaliesCmd.Flags().BoolVar(&fiscalAnomaliesFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalCmd.AddCommand(fiscalAnomaliesCmd)

	// cashflow
	bindFiscalFlags(fiscalCashflowCmd, &fiscalCashflowFlags.scope)
	fiscalCashflowCmd.Flags().StringVar(&fiscalCashflowFlags.file, "file", "", "JSON input file")
	fiscalCashflowCmd.Flags().BoolVar(&fiscalCashflowFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalCmd.AddCommand(fiscalCashflowCmd)

	// compliance
	bindFiscalFlags(fiscalComplianceCmd, &fiscalComplianceFlags.scope)
	fiscalComplianceCmd.Flags().StringVar(&fiscalComplianceFlags.file, "file", "", "JSON input file")
	fiscalComplianceCmd.Flags().BoolVar(&fiscalComplianceFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalCmd.AddCommand(fiscalComplianceCmd)

	// suppliers
	bindFiscalFlags(fiscalSuppliersCmd, &fiscalSuppliersFlags.scope)
	fiscalSuppliersCmd.Flags().StringVar(&fiscalSuppliersFlags.file, "file", "", "JSON input file")
	fiscalSuppliersCmd.Flags().BoolVar(&fiscalSuppliersFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalCmd.AddCommand(fiscalSuppliersCmd)

	// classify
	bindFiscalFlags(fiscalClassifyCmd, &fiscalClassifyFlags.scope)
	fiscalClassifyCmd.Flags().StringVar(&fiscalClassifyFlags.file, "file", "", "JSON input file")
	fiscalClassifyCmd.Flags().BoolVar(&fiscalClassifyFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalCmd.AddCommand(fiscalClassifyCmd)

	// roi parent
	fiscalCmd.AddCommand(fiscalROICmd)

	// roi subcommands
	bindFiscalFlags(fiscalROICalculateCmd, &fiscalROICalculateFlags.scope)
	fiscalROICalculateCmd.Flags().StringVar(&fiscalROICalculateFlags.file, "file", "", "JSON input file")
	fiscalROICalculateCmd.Flags().BoolVar(&fiscalROICalculateFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalROICmd.AddCommand(fiscalROICalculateCmd)

	bindFiscalFlags(fiscalROIPaybackCmd, &fiscalROIPaybackFlags.scope)
	fiscalROIPaybackCmd.Flags().StringVar(&fiscalROIPaybackFlags.file, "file", "", "JSON input file")
	fiscalROIPaybackCmd.Flags().BoolVar(&fiscalROIPaybackFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalROICmd.AddCommand(fiscalROIPaybackCmd)

	bindFiscalFlags(fiscalROINPVCmd, &fiscalROINPVFlags.scope)
	fiscalROINPVCmd.Flags().StringVar(&fiscalROINPVFlags.file, "file", "", "JSON input file")
	fiscalROINPVCmd.Flags().BoolVar(&fiscalROINPVFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalROICmd.AddCommand(fiscalROINPVCmd)

	bindFiscalFlags(fiscalROIIRRCmd, &fiscalROIIRRFlags.scope)
	fiscalROIIRRCmd.Flags().StringVar(&fiscalROIIRRFlags.file, "file", "", "JSON input file")
	fiscalROIIRRCmd.Flags().BoolVar(&fiscalROIIRRFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalROICmd.AddCommand(fiscalROIIRRCmd)

	bindFiscalFlags(fiscalROIScenarioCmd, &fiscalROIScenarioFlags.scope)
	fiscalROIScenarioCmd.Flags().StringVar(&fiscalROIScenarioFlags.file, "file", "", "JSON input file")
	fiscalROIScenarioCmd.Flags().BoolVar(&fiscalROIScenarioFlags.stdin, "stdin", false, "read JSON from stdin")
	fiscalROICmd.AddCommand(fiscalROIScenarioCmd)
}


