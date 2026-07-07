package tui

import (
	"fmt"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/harness"
)

func FormatCommandEnvelopeAudit(result *harness.CommandEnvelopeAuditResponse) string {
	rows := make([][]string, 0, len(result.Events))
	for _, event := range result.Events {
		rows = append(rows, []string{
			event.OccurredAt,
			event.EventType,
			event.CaseID,
			event.ActorID,
			event.Message,
		})
	}
	body := KV("decision", result.Decision) + "\n" + KV("count", fmt.Sprintf("%d", result.Count))
	if len(rows) > 0 {
		body += "\n\n" + Table([]string{"OCCURRED", "TYPE", "CASE", "ACTOR", "MESSAGE"}, rows)
	}
	return Panel("Command-envelope audit", body)
}
