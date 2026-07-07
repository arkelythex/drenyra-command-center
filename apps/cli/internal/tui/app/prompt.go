package app

import "strings"

type slashAction int

const (
	slashNone slashAction = iota
	slashHelp
	slashDoctor
	slashAgents
	slashModels
	slashMemory
	slashHistory
	slashResume
	slashMenu
	slashQuit
	slashClear
)

func parseSlash(input string) (slashAction, string) {
	s := strings.TrimSpace(input)
	if s == "" || s[0] != '/' {
		return slashNone, s
	}
	parts := strings.Fields(strings.TrimPrefix(s, "/"))
	if len(parts) == 0 {
		return slashNone, s
	}
	cmd := strings.ToLower(parts[0])
	switch cmd {
	case "?", "help", "h":
		return slashHelp, ""
	case "doctor", "doc":
		return slashDoctor, ""
	case "agents", "agent", "tree":
		return slashAgents, ""
	case "models", "model", "route":
		return slashModels, ""
	case "memory", "mem":
		return slashMemory, ""
	case "history", "hist":
		return slashHistory, ""
	case "resume", "last":
		return slashResume, ""
	case "menu", "m":
		return slashMenu, ""
	case "quit", "exit", "q":
		return slashQuit, ""
	case "clear", "cls":
		return slashClear, ""
	default:
		return slashNone, s
	}
}
