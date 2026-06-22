package tui

import (
	"fmt"
	"strings"

	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/delegation"
	"github.com/Albert-fer02/ARKELYTHEX/apps/drenyra-cli/internal/harness"
)

// PrintAgentStack renders the canonical delegation tree.
func PrintAgentStack() {
	Banner("Agent stack · max depth 3")
	fmt.Println(FormatAgentStack())
}

// PrintRunTree renders an execution tree from harness response.
func PrintRunTree(node harness.RunNode, depth int) string {
	th := T()
	var b strings.Builder
	renderRunNode(&b, node, depth, true)
	if th.Enabled {
		return b.String()
	}
	return b.String()
}

func renderRunNode(b *strings.Builder, n harness.RunNode, depth int, last bool) {
	th := T()
	indent := strings.Repeat("  ", depth)
	branch := "├── "
	if last {
		branch = "└── "
	}
	if depth == 0 {
		branch = ""
	}

	agent := n.AgentID
	if a, ok := delegation.Agents[n.AgentID]; ok && a.Label != "" {
		agent = fmt.Sprintf("%s · %s", n.AgentID, a.Label)
	}

	summary := n.Result.ExecutiveSummary
	if len(summary) > 72 {
		summary = summary[:69] + "..."
	}

	if th.Enabled {
		b.WriteString(th.TreeLine.Render(indent + branch))
		b.WriteString(th.TreeAgent.Render(agent))
		b.WriteString(" ")
		b.WriteString(StatusBadge(n.Status))
		b.WriteString("\n")
		if summary != "" {
			b.WriteString(th.TreeLine.Render(indent + "    "))
			b.WriteString(th.MutedText.Render(summary))
			b.WriteString("\n")
		}
	} else {
		b.WriteString(fmt.Sprintf("%s%s %s [%s] %s\n", indent, branch, agent, n.Status, summary))
	}

	for i, ch := range n.Children {
		renderRunNode(b, ch, depth+1, i == len(n.Children)-1)
	}
}
