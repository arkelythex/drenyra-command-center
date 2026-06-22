package cmd

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/output"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var commandAuditFlags struct {
	fiscal    fiscalFlags
	caseID    string
	commandID string
	eventType string
}

var commandAuditCmd = &cobra.Command{
	Use:   "command-audit",
	Short: "Inspect Drenyra command capability audit events",
}

var commandAuditListCmd = &cobra.Command{
	Use:   "list",
	Short: "List scoped command capability audit events",
	Args:  cobra.NoArgs,
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		fiscal, err := mergeFiscal(cfg, commandAuditFlags.fiscal)
		if err != nil {
			return err
		}
		if commandAuditFlags.eventType != "" && commandAuditFlags.eventType != "CAPABILITY_ALLOWED" && commandAuditFlags.eventType != "CAPABILITY_DENIED" {
			return fmt.Errorf("invalid --event %q", commandAuditFlags.eventType)
		}
		client := harness.NewClient(cfg.Harness.API, fiscal)
		events, err := client.CommandAuditEvents(context.Background(), harness.CommandAuditFilter{
			CaseID:    commandAuditFlags.caseID,
			CommandID: commandAuditFlags.commandID,
			EventType: commandAuditFlags.eventType,
		})
		if err != nil {
			return err
		}
		if output.Format(commandAuditFlags.fiscal.outputFormat) == output.FormatJSON {
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(events)
		}
		renderCommandAuditEvents(events)
		return nil
	},
}

func init() {
	bindFiscalFlags(commandAuditListCmd, &commandAuditFlags.fiscal)
	commandAuditListCmd.Flags().StringVar(&commandAuditFlags.caseID, "case", "", "filter by fiscal case id")
	commandAuditListCmd.Flags().StringVar(&commandAuditFlags.commandID, "command", "", "filter by command id (for example review-sunat)")
	commandAuditListCmd.Flags().StringVar(&commandAuditFlags.eventType, "event", "", "filter by event: CAPABILITY_ALLOWED|CAPABILITY_DENIED")
	commandAuditCmd.AddCommand(commandAuditListCmd)
}

func renderCommandAuditEvents(events []harness.CommandAuditEvent) {
	if len(events) == 0 {
		fmt.Println(tui.T().MutedText.Render("No command audit events found for this fiscal scope."))
		return
	}
	for _, event := range events {
		commandID, _ := event.Metadata["commandId"].(string)
		toolID, _ := event.Metadata["toolId"].(string)
		traceID, _ := event.Metadata["traceId"].(string)
		fmt.Printf("%s  %s  %s\n", tui.T().Header.Render(event.EventType), commandID, event.OccurredAt)
		fmt.Printf("  tool: %s\n  trace: %s\n", toolID, traceID)
		if event.CaseID != "" {
			fmt.Printf("  case: %s\n", event.CaseID)
		}
	}
}
