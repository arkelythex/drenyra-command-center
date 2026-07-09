/**
 * `drenyra pi` commands — skill management.
 */

import { Command } from "commander";
import { listSkills, installSkill, uninstallSkill } from "../client.js";

export const piCommand = new Command("pi").description(
	"Manage drenyra-pi skills",
);

piCommand
	.command("list")
	.description("List installed skills")
	.action(async () => {
		const res = await listSkills();
		if (res.success && res.data) {
			if (res.data.length === 0) {
				console.log("No skills installed");
				return;
			}
			console.table(
				res.data.map((s) => ({
					ID: s.id,
					Name: s.name,
					Version: s.version,
				})),
			);
		} else {
			console.error(
				"Error:",
				res.error?.message ?? "Cannot connect to drenyra-pi",
			);
			process.exit(1);
		}
	});

piCommand
	.command("install <package>")
	.description("Install a skill from npm")
	.option("-v, --version <version>", "Specific version to install")
	.action(async (pkg, opts) => {
		console.log(
			`Installing ${pkg}${opts.version ? `@${opts.version}` : ""}...`,
		);
		const res = await installSkill(pkg, opts.version);
		if (res.success && res.data) {
			console.log(`Skill "${res.data.skillId}" installed successfully`);
		} else if (res.error?.code === "NOT_IMPLEMENTED") {
			console.log("Direct npm installation not yet available.");
			console.log("To install a skill, add it as a workspace dependency and");
			console.log("register it in drenyra-pi's PluginRegistry.");
			console.log("Example:");
			console.log("  bun add @drenyra/skill-sire-filing@workspace:*");
		} else {
			console.error("Error:", res.error?.message ?? "Installation failed");
			process.exit(1);
		}
	});

piCommand
	.command("uninstall <id>")
	.description("Uninstall a skill")
	.action(async (id) => {
		const res = await uninstallSkill(id);
		if (res.success) {
			console.log(`Skill "${id}" uninstalled`);
		} else {
			console.error("Error:", res.error?.message ?? "Not found");
			process.exit(1);
		}
	});
