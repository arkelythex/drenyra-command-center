package audit

import (
	"strings"
	"testing"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
)

func TestMergeFiscalAppliesOverrides(t *testing.T) {
	cfg := config.Default()
	got, err := MergeFiscal(cfg, FiscalOverrides{CompanyRUC: "20100070970", Period: "2026-05"})
	if err != nil {
		t.Fatalf("MergeFiscal() error = %v", err)
	}
	if got.CompanyRUC != "20100070970" || got.Period != "2026-05" {
		t.Fatalf("MergeFiscal() = %#v", got)
	}
	if got.OrganizationID != cfg.Fiscal.OrganizationID || got.CompanyID != cfg.Fiscal.CompanyID || got.UserID != cfg.Fiscal.UserID {
		t.Fatalf("MergeFiscal() lost defaults: %#v", got)
	}
}

func TestValidateFiscalRejectsInvalidContext(t *testing.T) {
	tests := []struct {
		name string
		ctx  harness.FiscalContext
		want string
	}{
		{name: "ruc", ctx: harness.FiscalContext{OrganizationID: "org", CompanyID: "company", CompanyRUC: "bad", Period: "2026-05", UserID: "user"}, want: "invalid RUC"},
		{name: "checksum", ctx: harness.FiscalContext{OrganizationID: "org", CompanyID: "company", CompanyRUC: "20123456789", Period: "2026-05", UserID: "user"}, want: "checksum failed"},
		{name: "period", ctx: harness.FiscalContext{OrganizationID: "org", CompanyID: "company", CompanyRUC: "20100070970", Period: "2026-13", UserID: "user"}, want: "invalid period"},
		{name: "missing", ctx: harness.FiscalContext{CompanyRUC: "20100070970", Period: "2026-05"}, want: "missing fiscal context"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateFiscal(tt.ctx)
			if err == nil || !strings.Contains(err.Error(), tt.want) {
				t.Fatalf("ValidateFiscal() error = %v, want %q", err, tt.want)
			}
		})
	}
}
