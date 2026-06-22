package tui

import (
	"fmt"
	"os"

	"github.com/charmbracelet/bubbles/spinner"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type workDoneMsg struct{ err error }

type spinnerModel struct {
	spin spinner.Model
	msg  string
	work func() error
	done bool
	err  error
}

func (m spinnerModel) Init() tea.Cmd {
	return tea.Batch(m.spin.Tick, m.runWork())
}

func (m spinnerModel) runWork() tea.Cmd {
	return func() tea.Msg {
		return workDoneMsg{err: m.work()}
	}
}

func (m spinnerModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case spinner.TickMsg:
		if m.done {
			return m, tea.Quit
		}
		var cmd tea.Cmd
		m.spin, cmd = m.spin.Update(msg)
		return m, cmd
	case workDoneMsg:
		m.done = true
		m.err = msg.err
		return m, tea.Quit
	case tea.KeyMsg:
		return m, tea.Quit
	}
	return m, nil
}

func (m spinnerModel) View() string {
	th := T()
	line := m.spin.View() + " " + m.msg
	if th.Enabled {
		return lipgloss.NewStyle().Foreground(th.Primary).Render(line)
	}
	return line
}

// RunSpinner runs work with a Bubble Tea spinner on stderr (TTY only).
func RunSpinner(label string, work func() error) error {
	if !T().Enabled {
		return work()
	}

	m := spinnerModel{
		spin: spinner.New(
			spinner.WithSpinner(spinner.Line),
			spinner.WithStyle(lipgloss.NewStyle().Foreground(T().Primary)),
		),
		msg:  label,
		work: work,
	}

	p := tea.NewProgram(m, tea.WithOutput(os.Stderr), tea.WithoutSignalHandler())
	final, err := p.Run()
	if err != nil {
		return err
	}
	if sm, ok := final.(spinnerModel); ok && sm.err != nil {
		return sm.err
	}
	return nil
}

// ClearLine clears the spinner line on stderr.
func ClearLine() {
	if T().Enabled {
		fmt.Fprint(os.Stderr, "\r\033[K")
	}
}
