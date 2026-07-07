#!/usr/bin/env node
/**
 * Drenyra CLI — Terminal companion for fiscal intelligence.
 *
 * Thin client that delegates all logic to drenyra-pi via HTTP.
 */

import { Command } from "commander";
import { agentsCommand } from "./commands/agents.js";
import { workflowCommand } from "./commands/workflow.js";
import { configCommand } from "./commands/config.js";
import { serveCommand } from "./commands/serve.js";
import { piCommand } from "./commands/pi.js";
import { tuiCommand } from "./commands/tui.js";
import { versionCommand } from "./commands/version.js";

const program = new Command();

program
	.name("drenyra")
	.description(
		"Drenyra CLI — Terminal companion for Peruvian fiscal intelligence",
	)
	.version("0.2.0");

program.addCommand(agentsCommand);
program.addCommand(workflowCommand);
program.addCommand(configCommand);
program.addCommand(serveCommand);
program.addCommand(piCommand);
program.addCommand(tuiCommand);
program.addCommand(versionCommand);

program.parse(process.argv);
