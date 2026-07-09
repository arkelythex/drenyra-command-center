package output

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/fiscalwork"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
)

// Format is text or json (Pi/Droid exec style).
type Format string

const (
	FormatText Format = "text"
	FormatJSON Format = "json"
)

// WriteExecute prints harness execute response.
func WriteExecute(format Format, resp *harness.ExecuteResponse, models map[string]string, task string) error {
	switch format {
	case FormatJSON:
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		payload := map[string]any{
			"traceId":          resp.TraceID,
			"rootAgentId":      resp.RootAgentID,
			"status":           resp.Status,
			"executiveSummary": resp.ExecutiveSummary,
			"message":          resp.Message,
			"tree":             resp.Tree,
			"models":           models,
		}
		return enc.Encode(payload)
	default:
		tui.RenderExecute(resp, models, task)
		return nil
	}
}

// WriteSpawn prints harness spawn response.
func WriteSpawn(format Format, node *harness.RunNode) error {
	switch format {
	case FormatJSON:
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(node)
	default:
		tui.RenderSpawn(node)
		return nil
	}
}

func WriteFiscalWorkInspect(format Format, result *harness.FiscalWorkInspectResult) error {
	switch format {
	case FormatJSON:
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	default:
		tui.Banner("Fiscal work inspect")
		_, err := os.Stdout.WriteString(tui.FormatFiscalWorkInspect(result) + "\n\n")
		return err
	}
}

func WriteFiscalWorkInspectEnvelope(format Format, envelope fiscalwork.InspectEnvelope) error {
	switch format {
	case FormatJSON:
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(envelope)
	default:
		fmt.Fprintf(os.Stdout, "status: %s\nreason: %s\ntrace: %s\n", envelope.Status, envelope.ReasonCode, envelope.TraceID)
		if envelope.Summary != "" {
			fmt.Fprintf(os.Stdout, "summary: %s\n", envelope.Summary)
		}
		if envelope.Data != nil {
			fmt.Fprintf(os.Stdout, "workItem: %s\ncaseStatus: %s\n", envelope.Data.Case.ID, envelope.Data.Case.Status)
		}
		if len(envelope.EvidenceRefs) > 0 {
			fmt.Fprintf(os.Stdout, "evidenceRefs: %s\n", strings.Join(envelope.EvidenceRefs, ","))
		}
		if envelope.RedactedDetail != "" {
			fmt.Fprintf(os.Stdout, "detail: %s\n", envelope.RedactedDetail)
		}
		return nil
	}
}

func WriteCommandEnvelopeAudit(format Format, result *harness.CommandEnvelopeAuditResponse) error {
	switch format {
	case FormatJSON:
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(result)
	default:
		tui.Banner("Command-envelope audit")
		_, err := os.Stdout.WriteString(tui.FormatCommandEnvelopeAudit(result) + "\n\n")
		return err
	}
}
