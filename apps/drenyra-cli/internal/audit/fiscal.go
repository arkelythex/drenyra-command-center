package audit

import (
	"fmt"
	"regexp"
	"strconv"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
)

var (
	rucPattern    = regexp.MustCompile(`^\d{11}$`)
	periodPattern = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)
)

// FiscalOverrides are user-provided values that override config defaults.
type FiscalOverrides struct {
	OrganizationID string
	CompanyID      string
	CompanyRUC     string
	Period         string
	UserID         string
}

// FiscalFromConfig returns fiscal defaults from Drenyra CLI config.
func FiscalFromConfig(cfg *config.Config) harness.FiscalContext {
	return harness.FiscalContext{
		OrganizationID: cfg.Fiscal.OrganizationID,
		CompanyID:      cfg.Fiscal.CompanyID,
		CompanyRUC:     cfg.Fiscal.CompanyRUC,
		Period:         cfg.Fiscal.Period,
		UserID:         cfg.Fiscal.UserID,
	}
}

// MergeFiscal applies explicit overrides on top of config defaults and validates the result.
func MergeFiscal(cfg *config.Config, overrides FiscalOverrides) (harness.FiscalContext, error) {
	ctx := FiscalFromConfig(cfg)
	if overrides.OrganizationID != "" {
		ctx.OrganizationID = overrides.OrganizationID
	}
	if overrides.CompanyID != "" {
		ctx.CompanyID = overrides.CompanyID
	}
	if overrides.CompanyRUC != "" {
		ctx.CompanyRUC = overrides.CompanyRUC
	}
	if overrides.Period != "" {
		ctx.Period = overrides.Period
	}
	if overrides.UserID != "" {
		ctx.UserID = overrides.UserID
	}
	return ctx, ValidateFiscal(ctx)
}

// ValidateFiscal enforces the minimum tenant/company/RUC context required by harness requests.
func ValidateFiscal(ctx harness.FiscalContext) error {
	if !rucPattern.MatchString(ctx.CompanyRUC) {
		return fmt.Errorf("invalid RUC %q (need 11 digits)", ctx.CompanyRUC)
	}
	if !validRUCChecksum(ctx.CompanyRUC) {
		return fmt.Errorf("invalid RUC %q (checksum failed)", ctx.CompanyRUC)
	}
	if !periodPattern.MatchString(ctx.Period) {
		return fmt.Errorf("invalid period %q (need YYYY-MM)", ctx.Period)
	}
	if ctx.OrganizationID == "" || ctx.CompanyID == "" || ctx.UserID == "" {
		return fmt.Errorf("missing fiscal context — set flags or ~/.arkelythex/config.yaml")
	}
	return nil
}

func validRUCChecksum(ruc string) bool {
	if len(ruc) != 11 {
		return false
	}
	prefix := ruc[:2]
	if prefix != "10" && prefix != "15" && prefix != "17" && prefix != "20" {
		return false
	}
	weights := []int{5, 4, 3, 2, 7, 6, 5, 4, 3, 2}
	sum := 0
	for i, weight := range weights {
		digit, err := strconv.Atoi(ruc[i : i+1])
		if err != nil {
			return false
		}
		sum += digit * weight
	}
	check := 11 - (sum % 11)
	if check == 10 {
		check = 0
	} else if check == 11 {
		check = 1
	}
	last, err := strconv.Atoi(ruc[10:11])
	return err == nil && last == check
}
