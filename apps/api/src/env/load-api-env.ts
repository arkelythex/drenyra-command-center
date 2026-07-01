import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateApiEnv } from "./api-env.schema";

function stripInlineComment(value: string): string {
	const hashIndex = value.indexOf("#");
	if (hashIndex === -1) return value.trim();
	return value.slice(0, hashIndex).trim();
}

export function parseEnvFile(text: string): Record<string, string> {
	const out: Record<string, string> = {};

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) continue;

		const idx = line.indexOf("=");
		if (idx <= 0) continue;

		const key = line.slice(0, idx).trim();
		let value = line.slice(idx + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		} else {
			value = stripInlineComment(value);
		}

		out[key] = value;
	}

	return out;
}

/**
 * Load repo root and `apps/api` env files regardless of current working directory,
 * then validate critical environment variables at startup.
 */
export async function loadApiEnv(): Promise<void> {
	const srcDir = dirname(fileURLToPath(import.meta.url));
	const apiRoot = resolve(srcDir, "..", "..");
	const repoRoot = resolve(apiRoot, "..", "..");

	const candidates = [
		resolve(repoRoot, ".env"),
		resolve(repoRoot, ".env.local"),
		resolve(apiRoot, ".env"),
		resolve(apiRoot, ".env.local"),
	];

	for (const envPath of candidates) {
		if (!existsSync(envPath)) continue;
		const text = await readFile(envPath, "utf8");
		const parsed = parseEnvFile(text);

		for (const [k, v] of Object.entries(parsed)) {
			if (process.env[k] === undefined) process.env[k] = v;
		}
	}

	validateApiEnv();
}
