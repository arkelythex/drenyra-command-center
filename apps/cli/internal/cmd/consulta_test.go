package cmd

import (
	"strings"
	"testing"
)

func TestResultTitle(t *testing.T) {
	tests := []struct {
		tipo string
		want string
	}{
		{"igv-consulta", "IGV"},
		{"detracciones-consulta", "Detracciones"},
		{"sire-resumen", "Resumen SIRE"},
		{"unknown", "Consulta no reconocida"},
	}

	for _, tt := range tests {
		data := &consultaData{
			Tipo:    tt.tipo,
			Periodo: "2026-07",
		}
		title := resultTitle(data)
		if !strings.Contains(title, tt.want) {
			t.Errorf("resultTitle(%s) = %q, want containing %q", tt.tipo, title, tt.want)
		}
	}
}

func TestResultTitle_NoPeriod(t *testing.T) {
	data := &consultaData{
		Tipo: "igv-consulta",
	}
	title := resultTitle(data)
	if !strings.Contains(title, "período") {
		t.Errorf("resultTitle without period = %q, want containing 'período'", title)
	}
}

func TestToFloat64(t *testing.T) {
	if got := toFloat64(42); got != 42.0 {
		t.Errorf("toFloat64(int 42) = %f, want 42.0", got)
	}
	if got := toFloat64(3.14); got != 3.14 {
		t.Errorf("toFloat64(float 3.14) = %f, want 3.14", got)
	}
	if got := toFloat64("not a number"); got != 0 {
		t.Errorf("toFloat64(string) = %f, want 0", got)
	}
}

func TestRenderResult_Text(t *testing.T) {
	data := &consultaData{
		Tipo:      "igv-consulta",
		Ruc:       "20123456789",
		Periodo:   "2026-07",
		Confianza: 0.92,
		Resultado: map[string]any{"monto": 18234.5, "moneda": "PEN"},
		Fuentes: []evidenceSource{
			{Serie: "F001", Numero: 123, Monto: 450, Moneda: "PEN", CdrHash: "abc123", Fecha: "2026-07-05"},
		},
		EvidenceArtifacts: []evidenceRef{
			{ID: "evt-001", Kind: "PHASE_OUTPUT", Phase: "analysis", Hash: "0xabc123def456"},
		},
	}

	if err := renderResult(data, false); err != nil {
		t.Fatalf("renderResult text: %v", err)
	}
}

func TestRenderResult_JSON(t *testing.T) {
	data := &consultaData{
		Tipo:      "igv-consulta",
		Ruc:       "20123456789",
		Periodo:   "2026-07",
		Confianza: 0.92,
	}

	if err := renderResult(data, true); err != nil {
		t.Fatalf("renderResult json: %v", err)
	}
}

func TestRenderResult_Error(t *testing.T) {
	data := &consultaData{
		Tipo:       "igv-consulta",
		Periodo:    "2026-07",
		Error:      "No hay suficiente evidencia",
		Sugerencia: "Ejecutá el pipeline de compliance",
	}

	if err := renderResult(data, false); err != nil {
		t.Fatalf("renderResult error: %v", err)
	}
}
