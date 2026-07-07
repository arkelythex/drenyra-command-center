/**
 * `drenyra serve` command — starts the drenyra-pi HTTP server.
 */

import { Command } from "commander";

export const serveCommand = new Command("serve")
	.description("Start drenyra-pi HTTP server")
	.option("-p, --port <port>", "Port to listen on", "7377")
	.action((opts) => {
		console.log(`drenyra-pi server would start on port ${opts.port}`);
		console.log("Run drenyra-pi separately to serve requests.");
		console.log("Example: cd ../drenyra-pi && bun src/index.ts");
	});
