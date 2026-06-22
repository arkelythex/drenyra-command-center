package app

import "github.com/charmbracelet/bubbles/list"

type menuEntry struct {
	title       string
	description string
	action      menuAction
}

type menuAction int

const (
	actionRun menuAction = iota
	actionDoctor
	actionMemory
	actionAgentsTree
	actionModels
	actionQuit
)

func (i menuEntry) Title() string       { return i.title }
func (i menuEntry) Description() string { return i.description }
func (i menuEntry) FilterValue() string { return i.title }

type autoEntry struct {
	level       string
	description string
}

func (i autoEntry) Title() string       { return i.level }
func (i autoEntry) Description() string { return i.description }
func (i autoEntry) FilterValue() string { return i.level }

func defaultMenuItems() []list.Item {
	return []list.Item{
		menuEntry{"Run task", "Delegate via fiscal / swarm / HR orchestrators", actionRun},
		menuEntry{"Doctor", "Config and harness API health", actionDoctor},
		menuEntry{"Memory", "MEMORY.md + USER.md snapshot", actionMemory},
		menuEntry{"Agents", "Delegation graph (tier0 → tier3)", actionAgentsTree},
		menuEntry{"Models", "Per-agent model routing", actionModels},
		menuEntry{"Quit", "Exit", actionQuit},
	}
}

func autoLevelItems() []list.Item {
	return []list.Item{
		autoEntry{"low", "No nested auto-spawn"},
		autoEntry{"medium", "Balanced (default)"},
		autoEntry{"high", "Full delegation tree"},
	}
}
