/**
 * `drenyra config` commands.
 */

import { Command } from "commander";
import { getPiUrl, setPiUrl } from "../client.js";

export const configCommand = new Command("config")
	.description("Manage configuration");

configCommand
	.command("get [key]")
	.description("Get config value(s)")
	.action((key?: string) => {
		if (key === "pi-url") {
			console.log(getPiUrl());
		} else if (key) {
			console.log(`Unknown key: ${key}`);
			process.exit(1);
		} else {
			console.log(`pi-url: ${getPiUrl()}`);
		}
	});

configCommand
	.command("set <key> <value>")
	.description("Set config value")
	.action((key: string, value: string) => {
		if (key === "pi-url") {
			setPiUrl(value);
			console.log(`pi-url set to ${value}`);
		} else {
			console.error(`Unknown key: ${key}`);
			process.exit(1);
		}
	});
