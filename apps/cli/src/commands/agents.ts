/**
 * `drenyra agents` commands.
 */

import { Command } from "commander";
import {
	listSessions,
	getSession,
	pauseSession,
	resumeSession,
	cancelSession,
	getSessionTimeline,
} from "../client.js";

export const agentsCommand = new Command("agents")
	.description("Manage agent sessions");

agentsCommand
	.command("list")
	.description("List active agent sessions")
	.option("-s, --status <status>", "Filter by status")
	.action(async (opts) => {
		const res = await listSessions(opts.status);
		if (res.success && res.data) {
			console.table(
				res.data.map((s) => ({
					ID: s.id.slice(0, 8),
					Agent: s.agentName,
					Status: s.status,
					Phase: s.phase ?? "-",
					Progress: `${s.progress}%`,
					Risk: s.risk,
				})),
			);
		} else {
			console.error("Error:", res.error?.message ?? "Unknown error");
			process.exit(1);
		}
	});

agentsCommand
	.command("inspect <id>")
	.description("Show session details")
	.action(async (id) => {
		const res = await getSession(id);
		if (res.success && res.data) {
			const s = res.data;
			console.log(`Session: ${s.id}`);
			console.log(`  Agent:     ${s.agentName}`);
			console.log(`  Status:    ${s.status}`);
			console.log(`  Phase:     ${s.phase ?? "-"}`);
			console.log(`  Progress:  ${s.progress}%`);
			console.log(`  Elapsed:   ${s.elapsedMs}ms`);
			console.log(`  Tokens:    ${s.tokensUsed}`);
			console.log(`  Risk:      ${s.risk}`);

			const timeline = await getSessionTimeline(id);
			if (timeline.success && timeline.data) {
				console.log("\nTimeline:");
				for (const step of timeline.data) {
					console.log(
						`  [${step.status}] ${step.label}${step.duration ? ` (${step.duration}ms)` : ""}`,
					);
				}
			}
		} else {
			console.error("Error:", res.error?.message ?? "Not found");
			process.exit(1);
		}
	});

agentsCommand
	.command("pause <id>")
	.description("Pause a session")
	.action(async (id) => {
		const res = await pauseSession(id);
		if (res.success) {
			console.log(`Session ${id.slice(0, 8)} paused`);
		} else {
			console.error("Error:", res.error?.message ?? "Unknown");
			process.exit(1);
		}
	});

agentsCommand
	.command("resume <id>")
	.description("Resume a paused session")
	.action(async (id) => {
		const res = await resumeSession(id);
		if (res.success) {
			console.log(`Session ${id.slice(0, 8)} resumed`);
		} else {
			console.error("Error:", res.error?.message ?? "Unknown");
			process.exit(1);
		}
	});

agentsCommand
	.command("cancel <id>")
	.description("Cancel a session")
	.action(async (id) => {
		const res = await cancelSession(id);
		if (res.success) {
			console.log(`Session ${id.slice(0, 8)} cancelled`);
		} else {
			console.error("Error:", res.error?.message ?? "Unknown");
			process.exit(1);
		}
	});
