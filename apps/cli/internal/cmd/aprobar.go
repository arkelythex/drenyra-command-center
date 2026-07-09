package cmd

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/spf13/cobra"
)

// ─── Types ──────────────────────────────────────────────────────────────

type recommendationData struct {
	ID            string      `json:"id"`
	PipelineRunID string      `json:"pipelineRunId"`
	TipoAccion    string      `json:"tipoAccion"`
	Ruc           string      `json:"ruc"`
	Periodo       string      `json:"periodo"`
	Descripcion   string      `json:"descripcion"`
	Monto         float64     `json:"monto"`
	Moneda        string      `json:"moneda"`
	Confianza     float64     `json:"confianza"`
	Fuentes       []recSource `json:"fuentes"`
	Status        string      `json:"status"`
	Creado        string      `json:"creado"`
	AprobadoPor   string      `json:"aprobadoPor,omitempty"`
	AprobadoEn    string      `json:"aprobadoEn,omitempty"`
	MotivoRechazo string      `json:"motivoRechazo,omitempty"`
}

type recSource struct {
	Tipo    string  `json:"tipo"`
	Serie   string  `json:"serie"`
	Numero  int     `json:"numero"`
	Monto   float64 `json:"monto"`
	Moneda  string  `json:"moneda"`
	CdrHash string  `json:"cdrHash,omitempty"`
	Fecha   string  `json:"fecha"`
}

type approvalSummaryData struct {
	Total           int                  `json:"total"`
	Pending         int                  `json:"pending"`
	Approved        int                  `json:"approved"`
	Rejected        int                  `json:"rejected"`
	Escalated       int                  `json:"escalated"`
	Recommendations []recommendationData `json:"recommendations"`
}

// ─── Parent: drenyra [aprobar|rechazar|recomendaciones] ─────────────────

var aprobarFlags struct {
	ruc     string
	periodo string
	jsonOut bool
	motivo  string
	apiURL  string
}

var aprobarCmd = &cobra.Command{
	Use:   "aprobar <recommendation-id>",
	Short: "Approve a pending fiscal recommendation",
	Long: `Approve a recommendation and execute the fiscal action.

Example:
  drenyra aprobar REC-001
  drenyra aprobar REC-001 --reason "Periodo correcto, IGV verificado"`,
	Args: cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		return runApprove(args[0])
	},
}

var rechazarCmd = &cobra.Command{
	Use:   "rechazar <recommendation-id>",
	Short: "Reject a pending fiscal recommendation",
	Long: `Reject a recommendation with a required reason.

Example:
  drenyra rechazar REC-001 --motivo "El período debería incluir agosto"`,
	Args: cobra.ExactArgs(1),
	RunE: func(_ *cobra.Command, args []string) error {
		if aprobarFlags.motivo == "" {
			return fmt.Errorf("--motivo es obligatorio para rechazar")
		}
		return runReject(args[0], aprobarFlags.motivo)
	},
}

var recomendacionesCmd = &cobra.Command{
	Use:   "recomendaciones",
	Short: "List pending fiscal recommendations",
	Long: `List pending recommendations filtered by RUC and/or period.

Example:
  drenyra recomendaciones
  drenyra recomendaciones --ruc 20123456789
  drenyra recomendaciones --periodo 2026-07 --json`,
	Args: cobra.NoArgs,
	RunE: func(_ *cobra.Command, _ []string) error {
		return runRecomendaciones()
	},
}

// ─── Run functions ──────────────────────────────────────────────────────

func runApprove(id string) error {
	apiURL := aprobarFlags.apiURL
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}

	// Call API
	url := fmt.Sprintf("%s/api/approval/%s/approve", apiURL, id)
	resp, err := httpPost(url, nil)
	if err != nil {
		return fmt.Errorf("API call failed: %w\nMake sure the API server is running.", err)
	}

	var result struct {
		Ok   bool                `json:"ok"`
		Data *recommendationData `json:"data,omitempty"`
		Err  string              `json:"error,omitempty"`
	}
	if err := json.Unmarshal(resp, &result); err != nil {
		return fmt.Errorf("parse response: %w", err)
	}

	if !result.Ok {
		return fmt.Errorf("API error: %s", result.Err)
	}

	if result.Data == nil {
		return fmt.Errorf("recommendation %s not found or already processed", id)
	}

	fmt.Println()
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("✅ %s aprobada\n", id)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("  Acción: %s\n", result.Data.Descripcion)
	fmt.Printf("  Monto: %s %.2f\n", result.Data.Moneda, result.Data.Monto)
	fmt.Printf("  Confianza: %d%%\n", int(result.Data.Confianza*100))
	fmt.Printf("  Aprobado por: %s\n", result.Data.AprobadoPor)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println()

	return nil
}

func runReject(id string, motivo string) error {
	apiURL := aprobarFlags.apiURL
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}

	body := map[string]string{"motivo": motivo}
	bodyJSON, _ := json.Marshal(body)

	url := fmt.Sprintf("%s/api/approval/%s/reject", apiURL, id)
	resp, err := httpPostJSON(url, bodyJSON)
	if err != nil {
		return fmt.Errorf("API call failed: %w\nMake sure the API server is running.", err)
	}

	var result struct {
		Ok   bool                `json:"ok"`
		Data *recommendationData `json:"data,omitempty"`
		Err  string              `json:"error,omitempty"`
	}
	if err := json.Unmarshal(resp, &result); err != nil {
		return fmt.Errorf("parse response: %w", err)
	}

	if !result.Ok {
		return fmt.Errorf("API error: %s", result.Err)
	}

	fmt.Println()
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("❌ %s rechazada\n", id)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("  Motivo: %s\n", motivo)
	fmt.Printf("  Acción NO ejecutada\n")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println()

	return nil
}

func runRecomendaciones() error {
	apiURL := aprobarFlags.apiURL
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}

	var err error
	var resp []byte

	if aprobarFlags.ruc != "" || aprobarFlags.periodo != "" {
		q := ""
		if aprobarFlags.ruc != "" {
			q += "?ruc=" + aprobarFlags.ruc
		}
		if aprobarFlags.periodo != "" {
			if q == "" {
				q = "?"
			} else {
				q += "&"
			}
			q += "periodo=" + aprobarFlags.periodo
		}
		resp, err = httpGet(apiURL + "/api/approval/pending" + q)
	} else {
		resp, err = httpGet(apiURL + "/api/approval/pending")
	}

	if err != nil {
		return fmt.Errorf("API call failed: %w\nMake sure the API server is running.", err)
	}

	var result struct {
		Ok   bool                 `json:"ok"`
		Data *approvalSummaryData `json:"data,omitempty"`
		Err  string               `json:"error,omitempty"`
	}
	if err := json.Unmarshal(resp, &result); err != nil {
		return fmt.Errorf("parse response: %w", err)
	}

	if !result.Ok {
		return fmt.Errorf("API error: %s", result.Err)
	}

	if aprobarFlags.jsonOut {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result.Data)
	}

	if result.Data == nil || len(result.Data.Recommendations) == 0 {
		fmt.Println()
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		fmt.Println("📋 No hay recomendaciones pendientes")
		fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
		fmt.Println()
		return nil
	}

	fmt.Println()
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("📋 Recomendaciones Pendientes (%d)\n", result.Data.Pending)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Printf("  Total: %d | ✅ %d | ❌ %d | ⏳ %d\n",
		result.Data.Total, result.Data.Approved, result.Data.Rejected, result.Data.Pending)
	fmt.Println()

	for _, rec := range result.Data.Recommendations {
		if rec.Status != "pending" {
			continue
		}
		fmt.Printf("  %s | %s | %s %.2f | Confianza: %d%%\n",
			rec.ID, rec.Descripcion, rec.Moneda, rec.Monto, int(rec.Confianza*100))

		// Show top 2 sources
		top := rec.Fuentes
		if len(top) > 2 {
			top = top[:2]
		}
		for _, f := range top {
			fmt.Printf("    📎 %s-%03d | %s\n", f.Serie, f.Numero, f.Fecha)
		}
		if len(rec.Fuentes) > 2 {
			fmt.Printf("    ... y %d más\n", len(rec.Fuentes)-2)
		}
		fmt.Printf("    Creado: %s\n", formatTime(rec.Creado))
		fmt.Println()
	}

	fmt.Println("  Usar: drenyra aprobar <id> | drenyra rechazar <id> --motivo \"...\"")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	fmt.Println()

	return nil
}

// ─── Helpers ────────────────────────────────────────────────────────────

func httpPost(url string, body []byte) ([]byte, error) {
	return httpPostJSON(url, body)
}

func httpPostJSON(url string, body []byte) ([]byte, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func httpGet(url string) ([]byte, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func formatTime(iso string) string {
	t, err := time.Parse(time.RFC3339, iso)
	if err != nil {
		return iso
	}
	return t.Format("2006-01-02 15:04")
}

// ─── Init ───────────────────────────────────────────────────────────────

func init() {
	// Shared flags
	aprobarCmd.PersistentFlags().StringVar(&aprobarFlags.apiURL, "api", "", "API URL (default: http://localhost:3000)")
	rechazarCmd.PersistentFlags().StringVar(&aprobarFlags.apiURL, "api", "", "API URL (default: http://localhost:3000)")
	recomendacionesCmd.PersistentFlags().StringVar(&aprobarFlags.apiURL, "api", "", "API URL (default: http://localhost:3000)")

	// Reject specific
	rechazarCmd.Flags().StringVar(&aprobarFlags.motivo, "motivo", "", "Motivo del rechazo (obligatorio)")

	// List specific
	recomendacionesCmd.Flags().StringVar(&aprobarFlags.ruc, "ruc", "", "Filtrar por RUC")
	recomendacionesCmd.Flags().StringVar(&aprobarFlags.periodo, "periodo", "", "Filtrar por período")
	recomendacionesCmd.Flags().BoolVar(&aprobarFlags.jsonOut, "json", false, "Output en JSON")
}
