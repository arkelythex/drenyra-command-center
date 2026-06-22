package app

import (
	"fmt"
	"sort"
	"strings"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/config"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/history"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/memory"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/router"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/tui"
	"github.com/charmbracelet/bubbles/list"
	"github.com/charmbracelet/bubbles/spinner"
	"github.com/charmbracelet/bubbles/textinput"
	"github.com/charmbracelet/bubbles/viewport"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type screen int

const (
	screenMenu screen = iota
	screenRunTask
	screenRunAuto
	screenRunning
	screenResult
	screenDoctor
	screenContent
	screenHelp
	screenApproval
	screenCommandPalette
	screenMemoryBrowser
)

type model struct {
	cfg    *config.Config
	tuiCfg config.TUIConfig

	width  int
	height int
	screen screen

	menu         list.Model
	autoList     list.Model
	taskInput    textinput.Model
	paletteInput textinput.Model
	memoryInput  textinput.Model
	viewport     viewport.Model
	spinner      spinner.Model

	task      string
	autoLevel string
	agentMode agentMode

	execResp   *harness.ExecuteResponse
	execModels map[string]string
	execErr    error

	loading      bool
	loadingLabel string
	content      string

	focusMenu bool // false = bottom prompt (Antigravity-style default)
	escStreak int  // esc esc clears prompt

	paletteEntries      []commandPaletteEntry
	paletteCursor       int
	paletteReturnScreen screen
	paletteReturnFocus  bool

	memoryBrowser memoryBrowserState

	memSnap    memory.Snapshot
	taskRecall []string
	recallIdx  int // -1 = not browsing history
}

func newModel(cfg *config.Config, tuiCfg config.TUIConfig) model {
	th := tui.T()

	menu := list.New(defaultMenuItems(), newMenuDelegate(), 0, 0)
	menu.Title = " "
	menu.SetShowStatusBar(false)
	menu.SetFilteringEnabled(false)
	menu.SetShowHelp(false)
	menu.SetShowTitle(false)
	menu.DisableQuitKeybindings()

	autoList := list.New(autoLevelItems(), newAutoDelegate(), 0, 0)
	autoList.Title = " "
	autoList.SetShowStatusBar(false)
	autoList.SetFilteringEnabled(false)
	autoList.SetShowHelp(false)
	autoList.SetShowTitle(false)
	autoList.DisableQuitKeybindings()

	ti := textinput.New()
	ti.Placeholder = "task or /doctor · /agents · /models · ? help"
	ti.CharLimit = 4096
	ti.Width = 56
	ti.Prompt = "> "
	ti.PromptStyle = lipgloss.NewStyle().Foreground(th.Accent).Bold(true)
	ti.TextStyle = lipgloss.NewStyle().Foreground(th.Text)
	ti.PlaceholderStyle = lipgloss.NewStyle().Foreground(th.Muted).Italic(true)
	ti.Cursor.Style = lipgloss.NewStyle().Foreground(th.Accent)

	vp := viewport.New(80, 20)
	vp.Style = lipgloss.NewStyle()

	paletteInput := textinput.New()
	paletteInput.Placeholder = "Search commands…"
	paletteInput.CharLimit = 80
	paletteInput.Width = 56
	paletteInput.Prompt = "⌘ "
	paletteInput.PromptStyle = lipgloss.NewStyle().Foreground(th.Accent).Bold(true)
	paletteInput.TextStyle = lipgloss.NewStyle().Foreground(th.Text)
	paletteInput.PlaceholderStyle = lipgloss.NewStyle().Foreground(th.Muted).Italic(true)
	paletteInput.Cursor.Style = lipgloss.NewStyle().Foreground(th.Accent)

	memoryInput := newMemorySearchInput(th)

	spin := spinner.New(
		spinner.WithSpinner(spinner.Dot),
		spinner.WithStyle(lipgloss.NewStyle().Foreground(th.Primary).Bold(true)),
	)

	snap, _ := memory.LoadSnapshot()
	recall, _ := history.RecentTasks(32)

	return model{
		cfg:                 cfg,
		tuiCfg:              tuiCfg,
		menu:                menu,
		autoList:            autoList,
		taskInput:           ti,
		paletteInput:        paletteInput,
		memoryInput:         memoryInput,
		viewport:            vp,
		spinner:             spin,
		focusMenu:           false,
		agentMode:           agentModeFromConfig(tuiCfg.DefaultMode),
		paletteEntries:      defaultCommandPaletteEntries(),
		paletteReturnScreen: screenMenu,
		memSnap:             snap,
		taskRecall:          recall,
		recallIdx:           -1,
	}
}

func (m model) Init() tea.Cmd {
	m.taskInput.Focus()
	return textinput.Blink
}

func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		m.applyLayout()
		return m, nil

	case tea.KeyMsg:
		key := msg.String()
		if m.screen == screenCommandPalette {
			return m.handleCommandPaletteKey(key, msg)
		}
		if m.screen == screenMemoryBrowser {
			return m.handleMemoryBrowserKey(key, msg)
		}
		switch key {
		case "ctrl+c":
			return m, tea.Quit
		case "q":
			if m.screen == screenMenu && !m.focusMenu {
				break
			}
			if m.screen == screenRunTask {
				break
			}
			return m, tea.Quit
		case "ctrl+p":
			if !m.loading {
				return m.openCommandPalette(), textinput.Blink
			}
			return m, nil
		case "ctrl+b":
			if !m.loading {
				m.agentMode = m.agentMode.Toggle()
			}
			return m, nil
		case "esc":
			if m.screen == screenMenu && !m.focusMenu {
				break
			}
			return m.handleBack()
		case "ctrl+l":
			if m.screen == screenResult || m.screen == screenDoctor || m.screen == screenContent {
				m.viewport.SetContent("")
				m.content = ""
			}
			return m, nil
		case "?":
			if !m.loading {
				m.content = helpContent(m.screen, m.loading, m.focusMenu)
				m.screen = screenHelp
				m.viewport.SetContent(m.content)
				m.viewport.GotoTop()
				m.applyLayout()
			}
			return m, nil
		case "tab":
			if m.screen == screenMenu {
				m.focusMenu = !m.focusMenu
				if m.focusMenu {
					m.taskInput.Blur()
				} else {
					m.taskInput.Focus()
					return m, textinput.Blink
				}
			}
			return m, nil
		}

	case spinner.TickMsg:
		if m.loading {
			var cmd tea.Cmd
			m.spinner, cmd = m.spinner.Update(msg)
			return m, cmd
		}

	case executeDoneMsg:
		m.loading = false
		m.execResp = msg.resp
		m.execModels = msg.models
		m.execErr = msg.err
		if msg.err == nil && msg.resp != nil {
			if recall, err := history.RecentTasks(32); err == nil {
				m.taskRecall = recall
			}
			if snap, err := memory.LoadSnapshot(); err == nil {
				m.memSnap = snap
			}
		}
		if msg.err != nil {
			m.screen = screenResult
			m.content = m.formatError(msg.err)
		} else if msg.resp != nil && msg.resp.Status == "pending_approval" {
			m.screen = screenApproval
			m.content = formatApprovalView(msg.resp, m.task)
			m.viewport.SetContent(m.content)
		} else {
			m.screen = screenResult
			m.content = tui.FormatExecuteResult(msg.resp, msg.models, m.task)
		}
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
		return m, nil

	case doctorDoneMsg:
		m.loading = false
		m.screen = screenDoctor
		m.content = tui.FormatDoctor(msg.checks, msg.allOK)
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
		return m, nil
	}

	var cmd tea.Cmd

	switch m.screen {
	case screenMenu:
		if m.focusMenu {
			m.menu, cmd = m.menu.Update(msg)
			if key, ok := msg.(tea.KeyMsg); ok && key.String() == "enter" {
				if item, ok := m.menu.SelectedItem().(menuEntry); ok {
					return m.handleMenuSelect(item.action)
				}
			}
		} else {
			m.taskInput, cmd = m.taskInput.Update(msg)
			if key, ok := msg.(tea.KeyMsg); ok {
				switch key.String() {
				case "up":
					m.recallOlder()
					return m, nil
				case "down":
					m.recallNewer()
					return m, nil
				case "esc":
					m.escStreak++
					if m.escStreak >= 2 {
						m.taskInput.SetValue("")
						m.recallIdx = -1
						m.escStreak = 0
					}
					return m, nil
				case "enter":
					m.recallIdx = -1
					return m.handlePromptSubmit()
				default:
					m.escStreak = 0
					m.recallIdx = -1
				}
			}
		}

	case screenRunTask:
		m.taskInput, cmd = m.taskInput.Update(msg)
		if key, ok := msg.(tea.KeyMsg); ok && key.String() == "enter" {
			task := m.taskInput.Value()
			if task != "" {
				m.task = task
				m.screen = screenRunAuto
				m.autoList.Select(1)
				m.applyLayout()
			}
		}

	case screenRunAuto:
		m.autoList, cmd = m.autoList.Update(msg)
		if key, ok := msg.(tea.KeyMsg); ok && key.String() == "enter" {
			if item, ok := m.autoList.SelectedItem().(autoEntry); ok {
				m.autoLevel = item.level
				m.screen = screenRunning
				m.loading = true
				m.loadingLabel = fmt.Sprintf("Harness executing · mode=%s · auto=%s · root inferred from task", m.agentMode.Label(), m.autoLevel)
				return m, tea.Batch(m.spinner.Tick, executeTaskCmd(m.cfg, m.task, m.autoLevel, m.agentMode))
			}
		}

	case screenApproval:
		if key, ok := msg.(tea.KeyMsg); ok {
			switch key.String() {
			case "y", "Y":
				m.content = tui.T().OK.Render("Acknowledged — material fiscal actions still require explicit policy approval in harness.")
				m.screen = screenContent
				m.viewport.SetContent(m.content)
				return m, nil
			case "n", "N", "esc":
				m.screen = screenMenu
				m.focusMenu = false
				m.taskInput.Focus()
				m.applyLayout()
				return m, textinput.Blink
			}
		}

	case screenResult, screenDoctor, screenContent, screenHelp:
		m.viewport, cmd = m.viewport.Update(msg)
	}

	return m, cmd
}

func (m model) handlePromptSubmit() (model, tea.Cmd) {
	raw := strings.TrimSpace(m.taskInput.Value())
	if raw == "" {
		return m, nil
	}
	if act, _ := parseSlash(raw); act != slashNone {
		return m.handleSlash(act)
	}
	m.task = raw
	m.screen = screenRunAuto
	m.autoList.Select(1)
	m.applyLayout()
	return m, nil
}

func (m model) handleSlash(act slashAction) (model, tea.Cmd) {
	switch act {
	case slashHelp:
		m.content = helpContent(m.screen, m.loading, m.focusMenu)
		m.screen = screenHelp
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
	case slashDoctor:
		m.screen = screenRunning
		m.loading = true
		m.loadingLabel = "Running system diagnostics…"
		return m, tea.Batch(m.spinner.Tick, doctorChecksCmd(m.cfg))
	case slashAgents:
		m.screen = screenContent
		m.content = tui.FormatAgentStack()
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
	case slashModels:
		m.screen = screenContent
		m.content = m.formatModelsList()
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
	case slashMemory:
		m = m.openMemoryBrowser()
	case slashHistory:
		m.screen = screenContent
		m.content = m.formatHistoryView("")
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
	case slashResume:
		if last, err := history.Last(); err == nil && last != nil {
			m.taskInput.SetValue(last.Task)
			m.screen = screenMenu
			m.focusMenu = false
			m.taskInput.Focus()
			return m, textinput.Blink
		}
	case slashMenu:
		m.screen = screenMenu
		m.focusMenu = false
		m.taskInput.Focus()
		return m, textinput.Blink
	case slashQuit:
		return m, tea.Quit
	case slashClear:
		m.taskInput.SetValue("")
		m.escStreak = 0
	}
	return m, nil
}

func (m model) handleMenuSelect(action menuAction) (model, tea.Cmd) {
	switch action {
	case actionRun:
		m.screen = screenRunTask
		m.taskInput.Focus()
		m.applyLayout()
		return m, textinput.Blink
	case actionDoctor:
		m.screen = screenRunning
		m.loading = true
		m.loadingLabel = "Running system diagnostics…"
		return m, tea.Batch(m.spinner.Tick, doctorChecksCmd(m.cfg))
	case actionMemory:
		m = m.openMemoryBrowser()
	case actionAgentsTree:
		m.screen = screenContent
		m.content = tui.FormatAgentStack()
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
	case actionModels:
		m.screen = screenContent
		m.content = m.formatModelsList()
		m.viewport.SetContent(m.content)
		m.viewport.GotoTop()
		m.applyLayout()
	case actionQuit:
		return m, tea.Quit
	}
	return m, nil
}

func (m model) handleBack() (model, tea.Cmd) {
	if m.loading {
		return m, nil
	}
	switch m.screen {
	case screenMenu:
		if !m.focusMenu {
			m.focusMenu = true
			m.taskInput.Blur()
		} else {
			return m, tea.Quit
		}
	case screenRunTask:
		m.screen = screenMenu
		m.focusMenu = false
		m.taskInput.Focus()
		return m, textinput.Blink
	case screenRunAuto:
		m.screen = screenRunTask
		m.taskInput.Focus()
		return m, textinput.Blink
	case screenApproval:
		m.screen = screenMenu
		m.focusMenu = false
		m.taskInput.Focus()
		return m, textinput.Blink
	case screenHelp, screenMemoryBrowser:
		m.screen = screenMenu
		m.focusMenu = false
		m.memoryInput.Blur()
		m.taskInput.Focus()
		return m, textinput.Blink
	case screenResult, screenDoctor, screenContent:
		m.screen = screenMenu
		m.execResp = nil
		m.execModels = nil
		m.execErr = nil
		m.content = ""
		m.focusMenu = false
		m.taskInput.Focus()
		return m, textinput.Blink
	default:
		m.screen = screenMenu
	}
	m.applyLayout()
	return m, nil
}

func (m *model) applyLayout() {
	bodyW, bodyH := bodySize(m.width, m.height, m.screen)
	m.menu.SetSize(bodyW, bodyH)
	m.autoList.SetSize(bodyW, bodyH)
	m.viewport.Width = bodyW - 4
	m.viewport.Height = bodyH - 2
	m.taskInput.Width = bodyW - 12
	if m.taskInput.Width < 24 {
		m.taskInput.Width = 24
	}
	m.paletteInput.Width = bodyW - 12
	if m.paletteInput.Width < 24 {
		m.paletteInput.Width = 24
	}
	m.memoryInput.Width = bodyW - 12
	if m.memoryInput.Width < 24 {
		m.memoryInput.Width = 24
	}
}

func (m model) formatModelsList() string {
	ids := make([]string, 0, len(m.cfg.Agents))
	for id := range m.cfg.Agents {
		ids = append(ids, id)
	}
	sort.Strings(ids)
	routes := make([]router.ResolvedModel, 0, len(ids))
	for _, id := range ids {
		r, err := router.Resolve(m.cfg, id)
		if err != nil {
			return m.formatError(err)
		}
		routes = append(routes, r)
	}
	return tui.FormatModelsList(m.cfg.Providers.Default, m.cfg.Routing.Fallback, routes)
}

func (m model) formatError(err error) string {
	th := tui.T()
	line := tui.Check(false, "error", err.Error())
	if th.Enabled {
		return th.ContentBox.Render(line)
	}
	return line
}
