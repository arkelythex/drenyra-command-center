#!/usr/bin/env bun
/// <reference types="node" />

/**
 * docs:check-freshness
 * Exige que cada documento de `docs/` declare su fecha (AGENTS.md: «Última actualización»).
 * Acepta «Última actualización», «Last updated», «Fecha», «Date» o «Updated»
 * (los ADRs usan «Fecha»/«Date») en las primeras 30 líneas.
 *
 * Uso: bun run docs:check-freshness
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DATE_LINE =
	/^[>\s*_-]*(Última actualización|Ultima actualizacion|Last updated|Fecha|Date|Updated)[*_\s]*:/im;

function markdownFiles(dir: string): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === "node_modules") continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...markdownFiles(full));
		else if (entry.name.endsWith(".md")) out.push(full);
	}
	return out;
}

/** Generated files carry no hand-written date. */
const GENERATED = new Set(["docs/00-INDEX.md"]);

const missing = markdownFiles(join(ROOT, "docs"))
	.filter((f) => !GENERATED.has(f.slice(ROOT.length + 1)))
	.filter(
		(f) =>
			!DATE_LINE.test(
				readFileSync(f, "utf-8").split("\n").slice(0, 30).join("\n"),
			),
	)
	.map((f) => f.slice(ROOT.length + 1))
	.sort();

if (missing.length > 0) {
	console.error(
		`[docs:check-freshness] ${missing.length} documentos sin fecha de actualización:`,
	);
	for (const f of missing) console.error(`  ${f}`);
	process.exit(1);
}
console.log(
	"[docs:check-freshness] ✅ todos los documentos de docs/ declaran su fecha",
);
