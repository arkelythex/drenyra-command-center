package config

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

var (
	rucPattern    = regexp.MustCompile(`^\d{11}$`)
	periodPattern = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)
)

// ValidationIssue is one config validation finding.
type ValidationIssue struct {
	Field   string
	Message string
	OK      bool
}

// Validate checks loaded config for required fields and formats.
func (c *Config) Validate() []ValidationIssue {
	var issues []ValidationIssue

	if c.Version < 1 {
		issues = append(issues, ValidationIssue{"version", "must be >= 1", false})
	} else {
		issues = append(issues, ValidationIssue{"version", fmt.Sprintf("%d", c.Version), true})
	}

	if c.Harness.API == "" {
		issues = append(issues, ValidationIssue{"harness.api", "required", false})
	} else {
		issues = append(issues, ValidationIssue{"harness.api", c.Harness.API, true})
	}

	checkFiscal := func(field, value string, pattern *regexp.Regexp, hint string) {
		if value == "" {
			issues = append(issues, ValidationIssue{field, "required", false})
			return
		}
		if pattern != nil && !pattern.MatchString(value) {
			issues = append(issues, ValidationIssue{field, fmt.Sprintf("invalid (%s)", hint), false})
			return
		}
		issues = append(issues, ValidationIssue{field, value, true})
	}

	checkFiscal("fiscal.organization_id", c.Fiscal.OrganizationID, nil, "")
	checkFiscal("fiscal.company_id", c.Fiscal.CompanyID, nil, "")
	checkFiscal("fiscal.company_ruc", c.Fiscal.CompanyRUC, rucPattern, "11 digits")
	checkFiscal("fiscal.period", c.Fiscal.Period, periodPattern, "YYYY-MM")
	checkFiscal("fiscal.user_id", c.Fiscal.UserID, nil, "")

	if c.Providers.Default == "" {
		issues = append(issues, ValidationIssue{"providers.default", "required", false})
	} else {
		issues = append(issues, ValidationIssue{"providers.default", c.Providers.Default, true})
	}

	if len(c.Agents) == 0 {
		issues = append(issues, ValidationIssue{"agents", "no agent routes configured", false})
	} else {
		issues = append(issues, ValidationIssue{"agents", fmt.Sprintf("%d routes", len(c.Agents)), true})
	}

	if home, err := os.UserHomeDir(); err == nil {
		memDir := filepath.Join(home, ".drenyra", "memories")
		if _, err := os.Stat(memDir); err != nil {
			issues = append(issues, ValidationIssue{"memory", "run: drenyra init", false})
		} else {
			issues = append(issues, ValidationIssue{"memory", memDir, true})
		}
	}

	return issues
}

// Valid reports whether all validation issues passed.
func Valid(issues []ValidationIssue) bool {
	for _, i := range issues {
		if !i.OK {
			return false
		}
	}
	return true
}
