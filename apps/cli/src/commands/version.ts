/**
 * `drenyra version` command.
 */

import { Command } from "commander";
import { getHealth } from "../client.js";

export const versionCommand = new Command("version")
	.description("Show version information")
	.action(async () => {
		console.log(`Drenyra CLI v${"0.2.0"}`);
		try {
			const health = await getHealth();
			if (health.success && health.data) {
				console.log(`drenyra-pi: v${health.data.version} (${health.data.status})`);
				console.log(`Skills:    ${health.data.skills}`);
				console.log(`Uptime:    ${health.data.uptime}s`);
			}
		} catch {
			console.log("drenyra-pi: not connected");
		}
	});
