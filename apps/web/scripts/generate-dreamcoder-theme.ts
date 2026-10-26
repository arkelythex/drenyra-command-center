/**
 * Regenerates src/lib/design-tokens/generated/dreamcoder-theme.css from the
 * Dreamcoder palette. Usage:
 *   bun run tokens:dreamcoder <path/to/dreamcoder-dots/DreamcoderThemes/dreamcoder/tokens.json>
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
	buildDreamcoderThemeCss,
	type DreamcoderTokens,
} from "../src/lib/design-tokens/dreamcoder-theme";

const tokensPath = process.argv[2] ?? process.env.DREAMCODER_TOKENS;
if (!tokensPath) {
	console.error(
		"Usage: bun run tokens:dreamcoder <path-to-tokens.json> (or set DREAMCODER_TOKENS)",
	);
	process.exit(1);
}

const raw = readFileSync(tokensPath, "utf8");
const tokens = JSON.parse(raw) as DreamcoderTokens & { version?: string };
const digest = createHash("sha256").update(raw).digest("hex").slice(0, 12);
const source = `dreamcoder tokens.json v${tokens.version ?? "?"} (sha256:${digest})`;

const outFile = fileURLToPath(
	new URL(
		"../src/lib/design-tokens/generated/dreamcoder-theme.css",
		import.meta.url,
	),
);
writeFileSync(outFile, buildDreamcoderThemeCss(tokens, source));
console.log(`Wrote ${outFile} from ${source}`);
