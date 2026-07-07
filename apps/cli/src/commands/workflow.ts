/**
 * `drenyra workflow` commands.
 */

import { Command } from "commander";
import { runWorkflow, getWorkflowStatus } from "../client.js";

export const workflowCommand = new Command("workflow")
	.description("Manage fiscal workflows");

workflowCommand
	.command("run <name>")
	.description("Run a fiscal workflow")
	.option("-i, --input <json>", "JSON input for the workflow", "{}")
	.action(async (name, opts) => {
		let input: Record<string, unknown> = {};
		try {
			input = JSON.parse(opts.input);
		} catch {
			console.error("Invalid JSON input");
			process.exit(1);
		}
		const res = await runWorkflow(name, input);
		if (res.success && res.data) {
			console.log(`Workflow started: ${res.data.workflowId}`);
		} else {
			console.error("Error:", res.error?.message ?? "Unknown");
			process.exit(1);
		}
	});

workflowCommand
	.command("status <id>")
	.description("Check workflow status")
	.action(async (id) => {
		const res = await getWorkflowStatus(id);
		if (res.success && res.data) {
			console.log(`Workflow: ${id}`);
			console.log(`  Status:  ${res.data.status}`);
			console.log(`  Phase:   ${res.data.currentPhase ?? "-"}`);
			console.log(`  Progress: ${res.data.progress ?? 0}%`);
		} else {
			console.error("Error:", res.error?.message ?? "Not found");
			process.exit(1);
		}
	});
