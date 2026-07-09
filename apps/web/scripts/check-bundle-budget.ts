import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

interface AssetStat {
	name: string;
	sizeBytes: number;
	sizeKb: number;
}

const DIST_ASSETS_DIR = join(process.cwd(), "dist", "assets");
const MAX_CHUNK_KB = Number(process.env.BUNDLE_MAX_CHUNK_KB ?? "500");
const MAX_TOTAL_JS_KB = Number(process.env.BUNDLE_MAX_TOTAL_JS_KB ?? "3400");

function formatKb(value: number): string {
	return `${value.toFixed(2)} KB`;
}

function assertValidBudgets(): void {
	if (Number.isNaN(MAX_CHUNK_KB) || MAX_CHUNK_KB <= 0) {
		throw new Error("Invalid BUNDLE_MAX_CHUNK_KB. Expected a positive number.");
	}

	if (Number.isNaN(MAX_TOTAL_JS_KB) || MAX_TOTAL_JS_KB <= 0) {
		throw new Error(
			"Invalid BUNDLE_MAX_TOTAL_JS_KB. Expected a positive number.",
		);
	}
}

function listJavaScriptAssets(): AssetStat[] {
	const files = readdirSync(DIST_ASSETS_DIR).filter(
		(file) => file.endsWith(".js") && !file.endsWith(".js.map"),
	);

	return files
		.map((name) => {
			const sizeBytes = statSync(join(DIST_ASSETS_DIR, name)).size;
			return {
				name,
				sizeBytes,
				sizeKb: sizeBytes / 1024,
			} satisfies AssetStat;
		})
		.sort((a, b) => b.sizeBytes - a.sizeBytes);
}

function main(): void {
	assertValidBudgets();

	if (!existsSync(DIST_ASSETS_DIR)) {
		throw new Error(
			"Missing dist/assets. Run `bun run build` in apps/web first.",
		);
	}

	const jsAssets = listJavaScriptAssets();
	if (jsAssets.length === 0) {
		throw new Error("No .js assets found in dist/assets.");
	}

	const largest = jsAssets[0];
	const totalJsKb = jsAssets.reduce((acc, item) => acc + item.sizeKb, 0);

	const summary = {
		"max-chunk-actual": formatKb(largest.sizeKb),
		"max-chunk-budget": formatKb(MAX_CHUNK_KB),
		"total-js-actual": formatKb(totalJsKb),
		"total-js-budget": formatKb(MAX_TOTAL_JS_KB),
		"largest-chunk": largest.name,
		"asset-count": jsAssets.length,
	};

	console.log("[check:bundle] Bundle budget summary");
	console.table(summary);
	console.log("[check:bundle] Top 10 JS assets");
	console.table(
		jsAssets.slice(0, 10).map((asset) => ({
			name: asset.name,
			size: formatKb(asset.sizeKb),
		})),
	);

	const failures: string[] = [];
	if (largest.sizeKb > MAX_CHUNK_KB) {
		failures.push(
			`Largest chunk ${largest.name} is ${formatKb(largest.sizeKb)} (> ${formatKb(MAX_CHUNK_KB)}).`,
		);
	}

	if (totalJsKb > MAX_TOTAL_JS_KB) {
		failures.push(
			`Total JS is ${formatKb(totalJsKb)} (> ${formatKb(MAX_TOTAL_JS_KB)}).`,
		);
	}

	if (failures.length > 0) {
		console.error("[check:bundle] FAILED");
		for (const failure of failures) {
			console.error(`- ${failure}`);
		}
		process.exit(1);
	}

	console.log("[check:bundle] PASSED");
}

main();
