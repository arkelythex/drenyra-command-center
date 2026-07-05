package app

import (
	"context"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/audit"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/execution"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/history"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	tea "github.com/charmbracelet/bubbletea"
)

func truncateTask(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-3] + "..."
}

func executeTaskCmd(cfg *config.Config, task, autoLevel string, mode agentMode) tea.Cmd {
	return func() tea.Msg {
		result, err := execution.NewEngine(cfg).Execute(context.Background(), execution.ExecuteInput{
			Task:      task,
			AutoLevel: autoLevel,
			Mode:      mode,
		})
		if err != nil {
			return executeDoneMsg{err: err}
		}
		return executeDoneMsg{resp: result.Response, models: result.Models}
	}
}

func doctorChecksCmd(cfg *config.Config) tea.Cmd {
	return func() tea.Msg {
		checks := []tui.DoctorCheck{}
		allOK := true

		globalPath, _ := config.GlobalPath()
		if _, err := os.Stat(globalPath); err != nil {
			checks = append(checks, tui.DoctorCheck{OK: false, Label: "config", Detail: globalPath + " (run: drenyra init)"})
			allOK = false
		} else {
			checks = append(checks, tui.DoctorCheck{OK: true, Label: "config", Detail: globalPath})
		}

		checks = append(checks,
			tui.DoctorCheck{OK: true, Label: "harness API", Detail: cfg.Harness.API},
			tui.DoctorCheck{OK: true, Label: "fiscal RUC", Detail: cfg.Fiscal.CompanyRUC},
			tui.DoctorCheck{OK: true, Label: "period", Detail: cfg.Fiscal.Period},
			tui.DoctorCheck{OK: true, Label: "organization", Detail: cfg.Fiscal.OrganizationID},
		)

		fiscalCtx := audit.FiscalFromConfig(cfg)
		if err := audit.ValidateFiscal(fiscalCtx); err != nil {
			checks = append(checks, tui.DoctorCheck{OK: false, Label: "fiscal context", Detail: err.Error()})
			allOK = false
		}

		client := harness.NewClient(cfg.Harness.API, fiscalCtx)
		if err := client.Ping(context.Background()); err != nil {
			checks = append(checks, tui.DoctorCheck{OK: false, Label: "harness ping", Detail: err.Error()})
			allOK = false
		} else {
			checks = append(checks, tui.DoctorCheck{OK: true, Label: "harness ping", Detail: "ok"})
		}

		if err := memory.EnsureDefaults(); err != nil {
			checks = append(checks, tui.DoctorCheck{OK: false, Label: "memory", Detail: err.Error()})
			allOK = false
		} else {
			snap, _ := memory.LoadSnapshot()
			checks = append(checks, tui.DoctorCheck{
				OK:     true,
				Label:  "memory",
				Detail: memory.StatusLine(snap) + " · " + snap.MemoryPath,
			})
		}

		if last, err := history.Last(); err == nil && last != nil {
			checks = append(checks, tui.DoctorCheck{
				OK:     true,
				Label:  "last run",
				Detail: truncateTask(last.Task, 40) + " · " + last.Status,
			})
		}

		return doctorDoneMsg{checks: checks, allOK: allOK}
	}
}
