#!/usr/bin/env bun
/**
 * Generates CSS/TS from tokens.dtcg.json.
 * Full generator pending — v3 uses checked-in generated artifacts.
 * Validates source JSON and prints sync reminder.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const source = join(root, "apps/web/src/lib/design-tokens/tokens.dtcg.json");
const json = JSON.parse(readFileSync(source, "utf8")) as {
	$metadata?: { version?: string; name?: string };
};

console.log(
	`[tokens:generate] ${json.$metadata?.name ?? "tokens"} v${json.$metadata?.version ?? "?"} — generated files are checked in; edit tokens.dtcg.json then sync generated/tokens.css`,
);
