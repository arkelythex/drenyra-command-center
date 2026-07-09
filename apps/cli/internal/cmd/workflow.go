package cmd

import (
	"fmt"
	"strings"

	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/tui"
	"github.com/Albert-fer02/DRENYRA/apps/cli/internal/workflow"
	"github.com/spf13/cobra"
)

var workflowFiscal fiscalFlags

var workflowCmd = &cobra.Command{
	Use:   "workflow",
	Short: "Built-in Drenyra product workflows",
	Long: `Built-in Drenyra CLI workflows for product-facing tasks.

Workflows are embedded in Drenyra CLI and execute through the same harness path
as drenyra run. They do not read project-local .pi prompts at runtime.`,
}

var workflowListCmd = &cobra.Command{
	Use:   "list",
	Short: "List built-in workflow templates",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		workflows := workflow.List()
		rows := make([][]string, 0, len(workflows))
		for _, item := range workflows {
			rows = append(rows, []string{item.ID, item.Description, item.RootAgentID})
		}
		tui.Banner("Drenyra workflows")
		fmt.Println(tui.Panel("Built-in templates", tui.Table([]string{"WORKFLOW", "DESCRIPTION", "ROOT AGENT"}, rows)))
		fmt.Println()
	},
}

var workflowRunCmd = &cobra.Command{
	Use:   "run <workflow-id> [task/context...]",
	Short: "Run a built-in workflow through the harness",
	Args:  cobra.MinimumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		template, err := workflow.Resolve(args[0])
		if err != nil {
			return err
		}

		context := ""
		if len(args) > 1 {
			context = strings.Join(args[1:], " ")
		}
		prompt := workflow.RenderPrompt(template, context)

		f := workflowFiscal
		if f.rootAgent == "" {
			f.rootAgent = template.RootAgentID
		}
		return executeHarness([]string{prompt}, "", f)
	},
}

func init() {
	bindFiscalFlags(workflowRunCmd, &workflowFiscal)
	workflowCmd.AddCommand(workflowListCmd)
	workflowCmd.AddCommand(workflowRunCmd)
}
