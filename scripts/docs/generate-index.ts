#!/usr/bin/env bun
/// <reference types="node" />

/**
 * docs:generate-index
 * Auto-genera docs/00-INDEX.md escaneando la estructura de docs/.
 *
 * Lee cada README.md de las subsecciones y extrae título, descripción y docs listados.
 *
 * Uso: bun run docs:index
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DOCS_DIR = join(ROOT, "docs");

interface DocSection {
	dir: string;
	title: string;
	description: string;
	docs: string[];
}

function extractTitle(filePath: string): string {
	const content = readFileSync(filePath, "utf-8");
	const firstLine = content.split("\n")[0] || "";
	return firstLine.replace(/^#\s*/, "").trim();
}

function extractDescription(filePath: string): string {
	const content = readFileSync(filePath, "utf-8");
	const lines = content.split("\n");
	for (let i = 1; i < Math.min(lines.length, 15); i++) {
		const line = lines[i].trim();
		if (
			line &&
			!line.startsWith("#") &&
			!line.startsWith("---") &&
			!line.startsWith("**")
		) {
			return line.replace(/^>\s*/, "").slice(0, 120);
		}
	}
	return "";
}

function listDocs(dir: string): string[] {
	const docs: string[] = [];
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (entry.name === "README.md" || entry.name === "00-INDEX.md") continue;
		if (entry.isFile() && entry.name.endsWith(".md")) {
			docs.push(entry.name.replace(/\.md$/, ""));
		}
	}
	return docs;
}

function scanSections(): DocSection[] {
	const sections: DocSection[] = [];
	const entries = readdirSync(DOCS_DIR, { withFileTypes: true });

	for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
		if (!entry.isDirectory()) continue;
		if (entry.name.startsWith(".") || entry.name === "00-index") continue;

		const readmePath = join(DOCS_DIR, entry.name, "README.md");
		if (!existsSync(readmePath)) continue;

		sections.push({
			dir: entry.name,
			title: extractTitle(readmePath),
			description: extractDescription(readmePath),
			docs: listDocs(join(DOCS_DIR, entry.name)),
		});
	}

	return sections;
}

function generateIndex(sections: DocSection[]): string {
	let md = `# Drenyra Documentation Index
    
    **Arquitectura:** Drenyra Financial Engineering OS (FEOS) — 8 planos
**Programa:** [CAP-FEOS-00 — Drenyra Financial Engineering Operating System](./01-foundation/feos-program.md)

---

## Navegación rápida

| Sección | Contenido | Para quién |
|---------|-----------|------------|
`;

	for (const section of sections) {
		const link = `[${section.title}](./${section.dir}/README.md)`;
		md += `| \`${section.dir}\` | ${link} | ${section.description} |\n`;
	}

	md += `\n---\n\n## Estructura del programa FEOS\n\n`;
	md += `Las secciones de documentación se alinean con los 8 planos FEOS más secciones canónicas:\n\n`;

	for (const section of sections) {
		const isPlane = section.dir.match(
			/^\d{2}-(experience|workspace|intelligence|trust|execution|financial|integration|country)-plane$/,
		);
		const sectionType = isPlane ? "Plano FEOS" : "Sección canónica";
		md += `- **\`${section.dir}/\`** — ${sectionType}: ${section.title}\n`;
	}

	md += `\n---\n\n## Documentos por sección\n\n`;

	for (const section of sections) {
		md += `### ${section.title}\n\n`;
		md += `> \`docs/${section.dir}/\`\n\n`;
		md += `${section.description}\n\n`;

		if (section.docs.length > 0) {
			md += `| Documento | Descripción |\n|-----------|-------------|\n`;
			for (const doc of section.docs) {
				const docPath = join(DOCS_DIR, section.dir, `${doc}.md`);
				const desc = extractDescription(docPath);
				md += `| [${doc}](./${section.dir}/${doc}.md) | ${desc} |\n`;
			}
		} else {
			md += `_Sin documentos adicionales aún._\n`;
		}
		md += `\n`;
	}

	md += `---\n\n## Mantenimiento\n\n`;
	md += `Este índice se genera automáticamente con:\n\n`;
	md += `\`\`\`bash\nbun run docs:index\n\`\`\`\n\n`;
	md += `Para verificar enlaces internos:\n\n`;
	md += `\`\`\`bash\nbun run docs:check-links\nbun run docs:check-links --full\n\`\`\`\n\n`;
	md += `Para mantenimiento completo:\n\n`;
	md += `\`\`\`bash\nbun run docs:maintain\n\`\`\`\n`;

	// Normalize trailing whitespace per line so the generated index is
	// byte-idempotent regardless of formatter passes (markdown-clean trims
	// trailing spaces; the raw generator must match that exactly).
	return md
		.split("\n")
		.map((line) => line.trimEnd())
		.join("\n");
}

function main(): void {
	if (!existsSync(DOCS_DIR)) {
		console.error("docs/ directory not found");
		process.exit(1);
	}

	const sections = scanSections();
	const index = generateIndex(sections);

	const indexPath = join(DOCS_DIR, "00-INDEX.md");
	writeFileSync(indexPath, index, "utf-8");

	console.log(
		`[docs:index] ✅ Generated docs/00-INDEX.md — ${sections.length} sections, ${sections.reduce((a, s) => a + s.docs.length, 0)} documents`,
	);
}

main();
