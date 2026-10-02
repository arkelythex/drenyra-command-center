#!/usr/bin/env bun
/**
 * ecosystem:doctor — verifies that this repo is wired to the published drenyra-ai
 * contracts. Runs the read-only `capabilities show` and `doctor run` commands of the
 * installed drenyra-ai in an isolated HOME and fails when the declared version differs
 * from package.json, a contract is not FROZEN, or the doctor is not healthy.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cli = join(process.cwd(), "node_modules/drenyra-ai/dist/cmd/cli.js");
const home = mkdtempSync(join(tmpdir(), "drenyra-ai-home-"));

function run(args: string[]): unknown {
	const out = execFileSync("node", [cli, ...args], {
		env: { ...process.env, HOME: home },
		encoding: "utf8",
	});
	return JSON.parse(out);
}

const expected = JSON.parse(
	readFileSync("packages/mission-protocol/package.json", "utf8"),
).dependencies["drenyra-ai"] as string;

const problems: string[] = [];
const caps = run(["capabilities", "show"]) as {
	version: string;
	contracts: { name: string; status: string }[];
};
const doctor = run(["doctor", "run", "--home", home]) as { status: string };

if (caps.version !== expected) {
	problems.push(
		`drenyra-ai ${caps.version} installed, package.json pins ${expected}`,
	);
}
for (const c of caps.contracts) {
	if (c.status !== "FROZEN")
		problems.push(`contract ${c.name} is ${c.status}, expected FROZEN`);
}
if (doctor.status !== "healthy")
	problems.push(`doctor status is ${doctor.status}`);

if (problems.length > 0) {
	console.error(
		"[ecosystem:doctor] ✖ not connected:\n- " + problems.join("\n- "),
	);
	process.exit(1);
}
console.log(
	`[ecosystem:doctor] ✅ drenyra-ai ${caps.version}: ${caps.contracts.length} contracts FROZEN, doctor healthy`,
);
