/**
 * `drenyra serve` command — starts the drenyra-pi HTTP server.
 *
 * Spawns the drenyra-pi server as a child process.
 * The server is in the workspace package @drenyra/pi.
 */

import { Command } from "commander";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

export const serveCommand = new Command("serve")
	.description("Start drenyra-pi HTTP server")
	.option("-p, --port <port>", "Port to listen on", "7377")
	.action((opts) => {
		const port = parseInt(opts.port, 10);
		const __dirname = dirname(fileURLToPath(import.meta.url));
		const piDir = resolve(__dirname, "../../../../drenyra-pi");

		console.log(`Starting drenyra-pi on port ${port}...`);
		console.log(`  Server: ${piDir}`);

		const child = spawn("bun", ["src/serve.ts"], {
			cwd: piDir,
			stdio: "inherit",
			env: { ...process.env, PORT: String(port) },
		});

		child.on("exit", (code) => {
			process.exit(code ?? 1);
		});

		process.on("SIGINT", () => {
			child.kill("SIGINT");
			process.exit(0);
		});
	});
