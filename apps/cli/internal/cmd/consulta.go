package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/spf13/cobra"
)

// ─── Types ──────────────────────────────────────────────────────────────

type consultaInput struct {
	Texto   string `json:"texto"`
	Ruc     string `json:"ruc,omitempty"`
	Periodo string `json:"periodo,omitempty"`
	Modo    string `json:"modo,omitempty"`
	Output  string `json:"output,omitempty"`
}

type consultaResponse struct {
	Ok   bool          `json:"ok"`
	Data *consultaData `json:"data,omitempty"`
	Err  string        `json:"error,omitempty"`
}

type consultaData struct {
	Tipo              string           `json:"tipo"`
	Ruc               string           `json:"ruc"`
	Periodo           string           `json:"periodo"`
	Resultado         map[string]any   `json:"resultado"`
	Confianza         float64          `json:"confianza"`
	Fuentes           []evidenceSource `json:"fuentes"`
	EvidenceArtifacts []evidenceRef    `json:"evidenceArtifacts"`
	Error             string           `json:"error,omitempty"`
	Sugerencia        string           `json:"sugerencia,omitempty"`
}

type evidenceSource struct {
	Tipo    string  `json:"tipo"`
	Serie   string  `json:"serie"`
	Numero  int     `json:"numero"`
	Monto   float64 `json:"monto"`
	Moneda  string  `json:"moneda"`
	CdrHash string  `json:"cdrHash,omitempty"`
	Fecha   string  `json:"fecha"`
}

type evidenceRef struct {
	ID    string `json:"id"`
	Kind  string `json:"kind"`
	Phase string `json:"phase"`
	Hash  string `json:"hash"`
}

// ─── Command ────────────────────────────────────────────────────────────

var consultaFlags struct {
	ruc     string
	periodo string
	jsonOut bool
	mode    string
	apiURL  string
}

var consultaCmd = &cobra.Command{
	Use:   "consulta <texto>",
	Short: "Natural language fiscal query",
	Long: `Query Drenyra's fiscal data using natural language.

Examples:
  drenyra consulta "IGV de julio 2026" --ruc 20123456789
  drenyra consulta "detracciones pendientes" --ruc 20123456789 --periodo 2026-07
  drenyra consulta "resumen SIRE del período" --json
  drenyra consulta "analizame este período" --mode supervised

The query is classified by intent (IGV, detracciones, SIRE, etc.),
routed to the appropriate fiscal pipeline, and returns structured
results with evidence artifacts.`,
	Args: cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		input := consultaInput{
			Texto:   args[0],
			Ruc:     consultaFlags.ruc,
			Periodo: consultaFlags.periodo,
			Modo:    consultaFlags.mode,
		}
		if consultaFlags.jsonOut {
			input.Output = "json"
		}

		return runConsulta(input)
	},
}

func runConsulta(input consultaInput) error {
	// 1. Try API first
	apiURL := consultaFlags.apiURL
	if apiURL == "" {
		apiURL = "http://localhost:3000/api/consulta"
	}

	result, err := callConsultaAPI(apiURL, input)
	if err == nil && result != nil {
		return renderResult(result, input.Output == "json")
	}

	// 2. API unavailable: show suggestion
	if err != nil {
		fmt.Fprintf(os.Stderr, "⚠ API not available at %s\n", apiURL)
		fmt.Fprintf(os.Stderr, "  %v\n\n", err)
	}

	// 3. Fallback: try Bun script
	if err := tryBunFallback(input); err != nil {
		fmt.Fprintln(os.Stderr, "⚠ Bun fallback also failed.")
		fmt.Fprintln(os.Stderr, "  Make sure the API server is running, or install Bun.")
		return fmt.Errorf("consulta failed")
	}

	return nil
}

func callConsultaAPI(url string, input consultaInput) (*consultaData, error) {
	body, err := json.Marshal(input)
	if err != nil {
		return nil, fmt.Errorf("marshal input: %w", err)
	}

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("API request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read response: %w", err)
	}

	var apiResp consultaResponse
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return nil, fmt.Errorf("parse response: %w", err)
	}

	if !apiResp.Ok {
		return nil, fmt.Errorf("API error: %s", apiResp.Err)
	}

	return apiResp.Data, nil
}

func tryBunFallback(input consultaInput) error {
	// Look for the fiscal-query-engine package
	candidates := []string{
		"packages/fiscal-query-engine/src/cli-fallback.ts",
		"../../packages/fiscal-query-engine/src/cli-fallback.ts",
	}

	scriptPath := ""
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			scriptPath = c
			break
		}
	}

	if scriptPath == "" {
		// Create a temp inline script
		return runInlineBun(input)
	}

	return runBunScript(scriptPath, input)
}

func runInlineBun(input consultaInput) error {
	// Inline classification via Bun
	script := fmt.Sprintf(`
		const { classifyQuery, matchIntentPatterns, formatAsText, formatAsJson, routeIntent, buildQueryResult, buildErrorResponse }
			= await import('%s/packages/fiscal-query-engine/src/index.ts');

		const input = %s;
		const classification = await classifyQuery({ texto: input.texto, ruc: input.ruc, periodo: input.periodo });
		const route = routeIntent(classification);

		if (classification.suggestions && classification.suggestions.length > 0) {
			const result = buildErrorResponse(classification, 'Consulta ambigua', classification.suggestions.join('\\n'));
			console.log(input.output === 'json' ? formatAsJson(result) : formatAsText(result));
			process.exit(classification.confidence > 0 ? 0 : 1);
		}

		const result = buildQueryResult(classification, null);
		result.resultado.monto = 0;  // placeholder - real data comes from pipeline
		result.resultado.moneda = 'PEN';

		console.log(input.output === 'json' ? formatAsJson(result) : formatAsText(result));
	`, projectRoot(), mustJSON(input))

	return runBun("-e", script)
}

func runBunScript(path string, input consultaInput) error {
	inputJSON, _ := json.Marshal(input)
	cmd := runBun("run", path, string(inputJSON))
	return cmd
}

func renderResult(data *consultaData, jsonOut bool) error {
	if jsonOut {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(data)
	}

	// Text output (matching evidence-formatter.ts format)
	fmt.Println()
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("📋 %s\n", resultTitle(data))
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("  RUC: %s\n", data.Ruc)
	fmt.Printf("  Período: %s\n", data.Periodo)

	if data.Error != "" {
		fmt.Printf("\n⚠ %s\n", data.Error)
		if data.Sugerencia != "" {
			fmt.Printf("  Sugerencia: %s\n", data.Sugerencia)
		}
	} else {
		if monto, ok := data.Resultado["monto"]; ok {
			fmt.Printf("\n  Monto: PEN %.2f\n", toFloat64(monto))
		}
		fmt.Printf("  Confianza: %d%%\n", int(data.Confianza*100))
		fmt.Printf("  Confianza: [%s%s] %d%%\n",
			strings.Repeat("█", int(data.Confianza*20)),
			strings.Repeat("░", 20-int(data.Confianza*20)),
			int(data.Confianza*100))
	}

	if len(data.Fuentes) > 0 {
		fmt.Printf("\n📎 Evidencia (%d fuente(s)):\n", len(data.Fuentes))
		top := data.Fuentes
		if len(top) > 5 {
			top = top[:5]
		}
		for _, f := range top {
			cdr := "CDR —"
			if f.CdrHash != "" {
				cdr = "CDR ✓"
			}
			fmt.Printf("  • %s-%03d | %s %.2f | %s | %s\n",
				f.Serie, f.Numero, f.Moneda, f.Monto, cdr, f.Fecha)
		}
		if len(data.Fuentes) > 5 {
			fmt.Printf("  ... y %d más\n", len(data.Fuentes)-5)
		}
	}

	if len(data.EvidenceArtifacts) > 0 {
		hash := data.EvidenceArtifacts[0].Hash
		if len(hash) > 16 {
			hash = hash[:16]
		}
		fmt.Printf("\n🔗 Hash: %s...\n", hash)
	}

	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println()
	return nil
}

func resultTitle(data *consultaData) string {
	titles := map[string]string{
		"igv-consulta":          "IGV",
		"detracciones-consulta": "Detracciones",
		"sire-resumen":          "Resumen SIRE",
		"retenciones-consulta":  "Retenciones",
		"pipeline-run":          "Pipeline ejecutado",
		"factura-lookup":        "Documento",
		"unknown":               "Consulta no reconocida",
	}
	title, ok := titles[data.Tipo]
	if !ok {
		title = "Resultado"
	}
	period := data.Periodo
	if period == "" {
		period = "período"
	}
	return fmt.Sprintf("%s — %s", title, period)
}

func toFloat64(v any) float64 {
	switch n := v.(type) {
	case float64:
		return n
	case int:
		return float64(n)
	case json.Number:
		f, _ := n.Float64()
		return f
	default:
		return 0
	}
}

func projectRoot() string {
	// Walk up to find package root with go.mod
	dir, _ := os.Getwd()
	for i := 0; i < 10; i++ {
		if _, err := os.Stat(dir + "/go.mod"); err == nil {
			return dir
		}
		parent := dir[:strings.LastIndex(dir, "/")]
		if parent == dir {
			break
		}
		dir = parent
	}
	return "."
}

func mustJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

func runBun(args ...string) error {
	// Find bun
	bunPath := "bun"
	if _, err := os.Stat("/usr/local/bin/bun"); err == nil {
		bunPath = "/usr/local/bin/bun"
	} else if _, err := os.Stat("/home/linuxbrew/.linuxbrew/bin/bun"); err == nil {
		bunPath = "/home/linuxbrew/.linuxbrew/bin/bun"
	}

	cmd := exec.Command(bunPath, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func init() {
	consultaCmd.Flags().StringVar(&consultaFlags.ruc, "ruc", "", "RUC (11 dígitos)")
	consultaCmd.Flags().StringVar(&consultaFlags.periodo, "periodo", "", "Período (YYYY-MM)")
	consultaCmd.Flags().BoolVar(&consultaFlags.jsonOut, "json", false, "Output en JSON")
	consultaCmd.Flags().StringVar(&consultaFlags.mode, "mode", "auto", "Modo: auto|interactive|supervised")
	consultaCmd.Flags().StringVar(&consultaFlags.apiURL, "api", "", "API URL (default: http://localhost:3000/api/consulta)")
}
