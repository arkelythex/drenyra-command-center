package app

import (
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/harness"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
)

func formatApprovalView(resp *harness.ExecuteResponse, task string) string {
	th := tui.T()
	body := th.Warn.Render("Material fiscal action — human approval gate") + "\n\n" +
		tui.KV("task", task) + "\n" +
		tui.KV("root", resp.RootAgentID) + "\n" +
		tui.KV("trace", resp.TraceID) + "\n\n" +
		resp.ExecutiveSummary + "\n\n" +
		th.MutedText.Render("y acknowledge · n return home")
	return tui.Panel("Approval required", body)
}
