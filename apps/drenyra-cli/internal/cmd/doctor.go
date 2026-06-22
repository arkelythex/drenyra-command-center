package cmd

import (
	"context"
	"errors"
	"os"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/audit"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/history"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/spf13/cobra"
)

var doctorCmd = &cobra.Command{
	Use:   "doctor",
	Short: "Check config and harness API connectivity",
	RunE: func(cmd *cobra.Command, args []string) error {
		cfg, err := config.Load()
		if err != nil {
			return err
		}

		checks := []tui.DoctorCheck{}
		allOK := true

		globalPath, _ := config.GlobalPath()
		if _, err := os.Stat(globalPath); err != nil {
			checks = append(checks, tui.DoctorCheck{false, "config", globalPath + " (run: drenyra init)"})
			allOK = false
		} else {
			checks = append(checks, tui.DoctorCheck{true, "config", globalPath})
		}

		checks = append(checks, tui.DoctorCheck{true, "harness API", cfg.Harness.API})
		fiscalCtx := audit.FiscalFromConfig(cfg)
		fiscalValid := true
		if err := audit.ValidateFiscal(fiscalCtx); err != nil {
			checks = append(checks, tui.DoctorCheck{false, "fiscal context", err.Error()})
			checks = append(checks, tui.DoctorCheck{false, "harness ping", "skipped until fiscal context is valid"})
			allOK = false
			fiscalValid = false
		} else {
			checks = append(checks, tui.DoctorCheck{true, "fiscal context", cfg.Fiscal.CompanyRUC + " · " + cfg.Fiscal.Period + " · org " + cfg.Fiscal.OrganizationID})
		}

		var pingErr error
		if fiscalValid {
			client := harness.NewClient(cfg.Harness.API, fiscalCtx)
			err = tui.RunSpinner("Pinging harness API…", func() error {
				pingErr = client.Ping(context.Background())
				return pingErr
			})
			if err != nil {
				return err
			}
			tui.ClearLine()

			if pingErr != nil {
				checks = append(checks, tui.DoctorCheck{false, "harness ping", pingErr.Error()})
				allOK = false
			} else {
				checks = append(checks, tui.DoctorCheck{true, "harness ping", "ok"})
			}
		}

		if err := memory.EnsureDefaults(); err != nil {
			checks = append(checks, tui.DoctorCheck{false, "memory", err.Error()})
			allOK = false
		} else {
			snap, _ := memory.LoadSnapshot()
			detail := memory.StatusLine(snap)
			if snap.NeedsConsolidation() {
				detail += " — run: drenyra memory edit"
			}
			checks = append(checks, tui.DoctorCheck{true, "memory", detail})
		}

		if last, err := history.Last(); err == nil && last != nil {
			checks = append(checks, tui.DoctorCheck{true, "last run", last.Task})
		}

		tui.RenderDoctor(checks, allOK)
		if !allOK {
			if pingErr != nil {
				return pingErr
			}
			return errors.New("doctor checks failed")
		}
		return nil
	},
}
