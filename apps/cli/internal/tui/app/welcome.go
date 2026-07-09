package app

import (
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/history"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
)

func (m model) homeWelcomeLine() string {
	th := tui.T()
	last, err := history.Last()
	if err != nil || last == nil {
		return ""
	}
	line := "Last run: " + truncateTask(last.Task, 44) + " · " + last.Status
	if th.Enabled {
		return th.SecondaryText.Render(line)
	}
	return line
}
