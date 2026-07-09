package cmd

import (
	"context"
	"fmt"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/fiscalwork"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/output"
	"github.com/spf13/cobra"
)

var workInspectFiscal fiscalFlags
var workAuditFiscal fiscalFlags

var workCmd = &cobra.Command{
	Use:   "work",
	Short: "Inspect fiscal work and browse capability audit logs",
}

var workInspectCmd = &cobra.Command{
	Use:   "inspect <workItemId>",
	Short: "Inspect one scoped fiscal work item",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}
		envelope, err := runWorkInspect(cmd.Context(), cfg, args[0], workInspectFiscal)
		if err != nil {
			return err
		}
		return output.WriteFiscalWorkInspectEnvelope(output.Format(workInspectFiscal.outputFormat), envelope)
	},
}

var workAuditCmd = &cobra.Command{
	Use:   "audit",
	Short: "Browse command-envelope capability audit events",
	Example: `  drenyra work audit
  drenyra work audit --decision denied
  drenyra work audit --case fc-20260618-abc123 --limit 20`,
	RunE: func(cmd *cobra.Command, args []string) error {
		decision, _ := cmd.Flags().GetString("decision")
		caseID, _ := cmd.Flags().GetString("case")
		limit, _ := cmd.Flags().GetInt("limit")
		return runWorkAudit(workAuditFiscal, decision, caseID, limit)
	},
}

func init() {
	bindFiscalScopeFlags(workInspectCmd, &workInspectFiscal)
	bindFiscalScopeFlags(workAuditCmd, &workAuditFiscal)
	workAuditCmd.Flags().String("decision", "all", "capability decision: allowed|denied|all")
	workAuditCmd.Flags().String("case", "", "optional fiscal case id")
	workAuditCmd.Flags().Int("limit", 50, "maximum audit events (max 200)")

	workCmd.AddCommand(workInspectCmd)
	workCmd.AddCommand(workAuditCmd)
}

func runWorkInspect(ctx context.Context, cfg *config.Config, workItemID string, f fiscalFlags) (fiscalwork.InspectEnvelope, error) {
	fiscalCtx, err := mergeFiscal(cfg, f)
	if err != nil {
		return fiscalwork.InspectEnvelope{}, err
	}
	client := fiscalwork.NewClient(cfg.Harness.API)
	return client.Inspect(ctx, workItemID, toFiscalWorkContext(fiscalCtx))
}

func runWorkAudit(f fiscalFlags, decision string, caseID string, limit int) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	fiscalCtx, err := mergeFiscal(cfg, f)
	if err != nil {
		return err
	}
	if limit > 200 {
		limit = 200
	}

	query := harness.CommandEnvelopeAuditQuery{
		Decision: harness.CommandEnvelopeAuditDecision(decision),
		CaseID:   caseID,
		Limit:    limit,
	}

	result, err := harness.NewClient(cfg.Harness.API, fiscalCtx).ListCommandEnvelopeAudit(context.Background(), query)
	if err != nil {
		return fmt.Errorf("audit query failed: %w", err)
	}
	return output.WriteCommandEnvelopeAudit(output.Format(f.outputFormat), result)
}

func toFiscalWorkContext(ctx harness.FiscalContext) fiscalwork.FiscalContext {
	return fiscalwork.FiscalContext{
		OrganizationID: ctx.OrganizationID,
		CompanyID:      ctx.CompanyID,
		CompanyRUC:     ctx.CompanyRUC,
		Period:         ctx.Period,
		UserID:         ctx.UserID,
	}
}
