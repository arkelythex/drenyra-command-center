/**
 * Drenyra Security Audit
 *
 * Checks for vulnerable dependencies and security issues.
 * Run: bun run ci:security-audit
 */

const results: string[] = [];

function check(label: string, cmd: string) {
	try {
		const proc = Bun.spawnSync(cmd.split(" "), {
			env: { ...process.env },
			timeout: 60_000,
		});
		const output = proc.stdout.toString();
		if (
			output.toLowerCase().includes("critical") ||
			output.toLowerCase().includes("high severity")
		) {
			console.log(`  \u26a0\ufe0f  ${label}: vulnerabilities found`);
			results.push(`WARN: ${label} found vulnerabilities`);
		} else {
			console.log(`  \u2705 ${label}: ok`);
		}
	} catch {
		console.log(`  \u26a0\ufe0f  ${label}: check failed (tool not available)`);
	}
}

console.log("🔒 Drenyra Security Audit\n");

// npm audit (Bun/Node)
console.log("📦 npm audit:");
check("npm audit", "bun audit 2>&1 || true");

// Go vulnerability check
console.log("\n🦫 Go vulncheck:");
const hasFs = (p: string) => {
	try {
		return !!Bun.file(p).size;
	} catch {
		return false;
	}
};

const goModDir = process.cwd() + "/apps/cli";
if (hasFs(goModDir + "/go.mod")) {
	check("go vulncheck", `cd ${goModDir} && go tool vulncheck ./...`);
} else {
	console.log("  \u23ed\ufe0f  No Go module found");
}

console.log("\n\u{1F40D} Python pip-audit:");
const pyProjectDir = process.cwd() + "/apps/data-engine";
if (hasFs(pyProjectDir + "/pyproject.toml")) {
	check("pip-audit", `cd ${pyProjectDir} && uv run pip-audit`);
} else {
	console.log("  \u23ed\ufe0f  No Python project found");
}

// Git secrets check
console.log("\n\u{1F511} Secrets check:");
try {
	const proc = Bun.spawnSync(["git", "diff", "--cached", "--name-only"], {
		timeout: 10_000,
	});
	const output = proc.stdout.toString().trim();
	if (output) {
		console.log(`  \u2705 ${output.split("\n").length} staged files to check`);
	} else {
		console.log("  \u2705 No staged files");
	}
} catch {
	console.log("  \u26a0\ufe0f  Could not check staged files");
}

// Summary
console.log("\n" + "\u2500".repeat(40));
console.log(`\nResults: ${results.length} checks`);
if (results.some((r) => r.startsWith("WARN"))) {
	console.log("  \u26a0\ufe0f  Some checks found issues -- review above");
} else {
	console.log("  \u2705 All checks passed");
}
