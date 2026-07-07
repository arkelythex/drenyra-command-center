package app

import (
	"fmt"
	"os"

	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/tui"
	tea "github.com/charmbracelet/bubbletea"
)

// RunInteractive launches the full-screen Bubble Tea TUI.
func RunInteractive() error {
	tui.Init(false)
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	tuiCfg, err := config.LoadTUI()
	if err != nil {
		return err
	}

	m := newModel(cfg, tuiCfg)
	options := []tea.ProgramOption{tea.WithAltScreen(), tea.WithMouseCellMotion()}
	p := tea.NewProgram(m, options...)
	final, err := p.Run()
	if err != nil {
		return err
	}
	if _, ok := final.(model); ok {
		fmt.Fprintln(os.Stderr, "Tip: resume with  drenyra tui  ·  run tasks via  drenyra run \"…\" --auto medium")
		return nil
	}
	return fmt.Errorf("unexpected model type")
}
