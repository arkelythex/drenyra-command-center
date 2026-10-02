#!/usr/bin/env bun
/// <reference types="node" />

/**
 * docs:agent-index
 * Genera los índices legibles por máquinas y agentes a partir del repo real:
 *   - `.codebase/index.yml`  metadatos de apps, paquetes, servicios y motores
 *   - `llms.txt`             índice curado (estándar llms.txt) con rutas verificadas
 *
 * Uso: bun run docs:agent-index           (regenera)
 *      bun run docs:agent-index --check   (falla si algún archivo está desactualizado)
 */

import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	writeFileSync,
} from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const CHECK = process.argv.includes("--check");

interface Unit {
	kind: "app" | "package" | "service" | "engine";
	path: string;
	name: string;
	description: string;
	docs: string[];
}

const GROUPS: Array<{ dir: string; kind: Unit["kind"] }> = [
	{ dir: "apps", kind: "app" },
	{ dir: "packages", kind: "package" },
	{ dir: "services", kind: "service" },
	{ dir: "engines", kind: "engine" },
];

function listUnits(): Unit[] {
	const units: Unit[] = [];
	for (const { dir, kind } of GROUPS) {
		const base = join(ROOT, dir);
		if (!existsSync(base)) continue;
		for (const entry of readdirSync(base, { withFileTypes: true })) {
			if (!entry.isDirectory() || entry.name === "node_modules") continue;
			const path = `${dir}/${entry.name}`;
			units.push(describeUnit(kind, path, entry.name));
		}
	}
	return units.sort((a, b) => a.path.localeCompare(b.path));
}

function describeUnit(
	kind: Unit["kind"],
	path: string,
	fallback: string,
): Unit {
	let name = fallback;
	let description = "";
	const pkgPath = join(ROOT, path, "package.json");
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
			name?: string;
			description?: string;
		};
		name = pkg.name ?? fallback;
		description = pkg.description ?? "";
	}
	const docs = ["README.md", "MAP.md", "AGENTS.md"]
		.filter((f) => existsSync(join(ROOT, path, f)))
		.map((f) => `${path}/${f}`);
	return { kind, path, name, description, docs };
}

const q = (s: string): string => JSON.stringify(s);

function renderCodebaseIndex(units: Unit[]): string {
	const lines = [
		"# Generado por `bun run docs:agent-index`. No editar a mano.",
		"# Fuente: package.json de cada app/paquete/servicio. Navegación humana: CODEX-MAP.md.",
		"version: 1",
		"units:",
	];
	for (const u of units) {
		lines.push(
			`  - path: ${q(u.path)}`,
			`    kind: ${u.kind}`,
			`    name: ${q(u.name)}`,
		);
		if (u.description) lines.push(`    description: ${q(u.description)}`);
		if (u.docs.length) lines.push(`    docs: [${u.docs.map(q).join(", ")}]`);
	}
	return `${lines.join("\n")}\n`;
}

/** Curated sections. Every path must exist; generation fails otherwise. */
const LLMS_SECTIONS: Array<{ title: string; items: Array<[string, string]> }> =
	[
		{
			title: "Start here",
			items: [
				["AGENTS.md", "Canonical engineering rules for AI agents"],
				[
					"CLAUDE.md",
					"Claude Code / Gemini CLI specifics and the ODD workflow",
				],
				["CODEX-MAP.md", "Repository navigation map"],
				[
					".codebase/index.yml",
					"Machine-readable apps, packages, services and engines",
				],
				["docs/00-INDEX.md", "Documentation index"],
			],
		},
		{
			title: "Workflow and standards",
			items: [
				[
					"docs/10-development/odd-workflow.md",
					"ODD: the only development workflow",
				],
				[
					"docs/10-development/engram-guide.md",
					"Persistent memory with Engram",
				],
				["docs/meta/gentleman-philosophy.md", "Why the rules exist"],
				["docs/meta/documentation-standards-2026.md", "Documentation rules"],
				["CONTRIBUTING.md", "How to contribute"],
			],
		},
		{
			title: "Architecture",
			items: [
				["docs/01-foundation/canonical-stack.md", "Canonical technology stack"],
				["docs/01-foundation/program-taxonomy.md", "Program taxonomy"],
				["docs/14-design/product-topology.md", "Product topology"],
				["docs/14-design/fiscal-app-server.md", "Fiscal app server design"],
				["docs/14-design/ledger-boundaries.md", "Ledger boundaries"],
				["docs/12-security/security-baseline.md", "Security baseline"],
			],
		},
		{
			title: "Fiscal domain",
			items: [
				[
					"packages/domain/README.md",
					"Domain layer: entities, value objects, events",
				],
				["packages/domain/src/fiscal-truth", "Fiscal truth engine"],
				["docs/06-fiscal", "Fiscal and SUNAT reference"],
			],
		},
		{
			title: "Applications",
			items: [
				["apps/api/MAP.md", "API (Bun + Elysia) map"],
				["apps/web/MAP.md", "Web app (React 19) map"],
				["apps/web/DESIGN.md", "Design system"],
				["apps/data-engine/README.md", "Data engine (Python)"],
			],
		},
	];

function renderLlms(): string {
	const out = [
		"# Drenyra Command Center",
		"",
		"> Fiscal-intelligence command center for Peru (SUNAT/SIRE): TypeScript monorepo (Bun) with a framework-free domain, Rust core and Go services. Development follows ODD.",
		"",
		"Generated by `bun run docs:agent-index`; every path is verified to exist.",
		"",
	];
	for (const section of LLMS_SECTIONS) {
		out.push(`## ${section.title}`, "");
		for (const [path, note] of section.items) {
			if (!existsSync(join(ROOT, path)) && path !== ".codebase/index.yml") {
				throw new Error(`llms.txt references a missing path: ${path}`);
			}
			out.push(`- [${path}](${path}): ${note}`);
		}
		out.push("");
	}
	out.push(
		"## Retrieval hints",
		"",
		"- Check `AGENTS.md` before any engineering decision.",
		"- Money is `Money` (cents) from `@drenyra/domain`; never floats or raw numbers.",
		"- Every query is scoped by organization, company and RUC.",
		"- SUNAT compliance is a safety requirement.",
		"",
	);
	return out.join("\n");
}

function sync(path: string, content: string): boolean {
	const abs = join(ROOT, path);
	const current = existsSync(abs) ? readFileSync(abs, "utf-8") : null;
	if (current === content) return true;
	if (CHECK) return false;
	mkdirSync(join(abs, ".."), { recursive: true });
	writeFileSync(abs, content);
	return true;
}

const targets: Array<[string, string]> = [
	[".codebase/index.yml", renderCodebaseIndex(listUnits())],
	["llms.txt", renderLlms()],
];
const stale = targets.filter(([p, c]) => !sync(p, c)).map(([p]) => p);

if (stale.length > 0) {
	console.error(
		`[docs:agent-index] desactualizado: ${stale.join(", ")}. Ejecuta: bun run docs:agent-index`,
	);
	process.exit(1);
}
console.log(
	`[docs:agent-index] ✅ ${CHECK ? "al día" : "generado"}: ${targets.map(([p]) => p).join(", ")}`,
);
