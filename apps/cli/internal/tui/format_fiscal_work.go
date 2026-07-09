package tui

import (
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
)

func FormatFiscalWorkInspect(result *harness.FiscalWorkInspectResult) string {
	var meta strings.Builder
	meta.WriteString(KV("trace", result.TraceID) + "\n")
	meta.WriteString(KV("status", StatusBadge(result.Status)) + "\n")
	meta.WriteString(KV("reason", result.Reason) + "\n")
	meta.WriteString(KV("capability", result.Capability) + "\n")
	if result.WorkItemID != "" {
		meta.WriteString(KV("work_item", result.WorkItemID) + "\n")
	}
	if result.RedactedDetail != "" {
		meta.WriteString(KV("detail", result.RedactedDetail) + "\n")
	}

	body := strings.TrimRight(meta.String(), "\n")
	if result.Data == nil {
		return Panel("Fiscal work inspection", body)
	}

	body += "\n\n" + fiscalWorkInspectData(*result.Data)
	return Panel("Fiscal work inspection", body)
}

func fiscalWorkInspectData(data harness.FiscalWorkInspectData) string {
	evidenceRefs := strings.Join(data.EvidenceRefs, ", ")
	if evidenceRefs == "" {
		evidenceRefs = "—"
	}
	approval := data.ProposalOrApprovalState
	if approval == "" {
		approval = "—"
	}
	return strings.Join([]string{
		KV("work_status", data.WorkItemStatus),
		KV("risk", data.RiskLevel),
		KV("approval", approval),
		KV("evidence", evidenceRefs),
		KV("summary", data.AccountantSummary),
	}, "\n")
}
