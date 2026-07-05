/**
 * Bulk-add OpenAPI detail.tags to Elysia routes in specified feature files.
 * Usage: bun scripts/add-openapi-tags.ts
 *
 * Looks for `.METHOD(` patterns and adds detail.tags where missing.
 */
import { readFileSync, writeFileSync } from "node:fs";

const FEATURES: Record<string, string[]> = {
	Ledger: ["apps/api/src/features/ledger/routes.ts"],
	Reports: ["apps/api/src/features/reports/routes.ts"],
	Banking: ["apps/api/src/features/banking/api/banking.routes.ts"],
	Billing: ["apps/api/src/features/billing/invoice/api/routes/get.route.ts"],
	"Electronic Invoicing": [
		"apps/api/src/features/electronic-invoicing/barrel.ts",
	],
	Taxation: ["apps/api/src/features/taxation/index.ts"],
	SUNAT: ["apps/api/src/features/sunat/api.module.ts"],
	Threads: ["apps/api/src/features/threads/threads.routes.ts"],
};

for (const [tag, files] of Object.entries(FEATURES)) {
	for (const file of files) {
		try {
			let content = readFileSync(file, "utf-8");
			const original = content;

			// Find route defs that have detail but no tags, add tags
			content = content.replaceAll(
				/,\s*\{\s*\n([^}]+?)\n\s*\}\s*\n\s*\)/g,
				(match, body) => {
					if (body.includes("detail:")) return match;
					if (
						!body.includes("query:") &&
						!body.includes("body:") &&
						!body.includes("params:")
					)
						return match;
					// Add detail to existing options object
					const indent = body.match(/^\t+/)?.[0] ?? "\t\t";
					return `, {\n${body}\n${indent}detail: { tags: ["${tag}"] },\n\t})`;
				},
			);

			if (content !== original) {
				writeFileSync(file, content, "utf-8");
				console.log(`✅ ${file} (${tag})`);
			} else {
				console.log(`⏭️ ${file} — no changes needed`);
			}
		} catch (e) {
			console.error(`❌ ${file}: ${e}`);
		}
	}
}
