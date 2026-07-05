package app

import "github.com/Albert-fer02/DRENYRA/apps/drenyra-cli/internal/modes"

type agentMode = modes.Mode

const (
	agentModePlan  = modes.Plan
	agentModeBuild = modes.Build
)

func agentModeFromConfig(value string) agentMode {
	return modes.Normalize(value)
}

func taskForMode(task string, mode agentMode) string {
	out, _ := modes.ApplyToTask(task, mode)
	return out
}
