package cmd

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/audit"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/spf13/cobra"
)

type fiscalFlags struct {
	organizationID string
	companyID      string
	companyRUC     string
	period         string
	userID         string
	rootAgent      string
	autoLevel      string
	outputFormat   string
}

func bindFiscalFlags(cmd *cobra.Command, f *fiscalFlags) {
	bindFiscalScopeFlags(cmd, f)
	cmd.Flags().StringVar(&f.rootAgent, "root", "", "root agent id (default: auto from task)")
	cmd.Flags().StringVar(&f.autoLevel, "auto", "medium", "autonomy: low|medium|high (Droid-style)")
}

func bindFiscalScopeFlags(cmd *cobra.Command, f *fiscalFlags) {
	cmd.Flags().StringVar(&f.organizationID, "org", "", "organization id (x-organization-id)")
	cmd.Flags().StringVar(&f.companyID, "company", "", "company id")
	cmd.Flags().StringVar(&f.companyRUC, "ruc", "", "company RUC (11 digits)")
	cmd.Flags().StringVar(&f.period, "period", "", "fiscal period YYYY-MM")
	cmd.Flags().StringVar(&f.userID, "user", "", "user id")
	cmd.Flags().StringVar(&f.outputFormat, "format", "text", "output: text|json")
}

func fiscalFromConfig(cfg *config.Config) harness.FiscalContext {
	return audit.FiscalFromConfig(cfg)
}

func mergeFiscal(cfg *config.Config, f fiscalFlags) (harness.FiscalContext, error) {
	return audit.MergeFiscal(cfg, fiscalOverrides(f))
}

func fiscalOverrides(f fiscalFlags) audit.FiscalOverrides {
	return audit.FiscalOverrides{
		OrganizationID: f.organizationID,
		CompanyID:      f.companyID,
		CompanyRUC:     f.companyRUC,
		Period:         f.period,
		UserID:         f.userID,
	}
}

func readTaskArg(args []string, filePath string) (string, error) {
	if filePath != "" {
		data, err := os.ReadFile(filePath)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}
	if len(args) == 0 {
		return "", fmt.Errorf("task required as argument or --file")
	}
	if len(args) == 1 {
		return args[0], nil
	}
	return fmt.Sprintf("%s", joinArgs(args)), nil
}

func joinArgs(args []string) string {
	out := args[0]
	for i := 1; i < len(args); i++ {
		out += " " + args[i]
	}
	return out
}
