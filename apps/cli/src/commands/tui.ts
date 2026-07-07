/**
 * `drenyra tui` command — launches the Ink TUI dashboard.
 */

import { Command } from "commander";
import { renderTUI } from "../tui/app.js";

export const tuiCommand = new Command("tui")
	.description("Launch interactive TUI dashboard")
	.option("-r, --refresh <ms>", "Refresh interval in ms", "5000")
	.action(() => {
		renderTUI();
	});
