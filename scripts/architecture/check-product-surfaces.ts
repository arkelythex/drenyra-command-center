#!/usr/bin/env bun
/// <reference types="node" />

import { existsSync } from "node:fs";
import { resolve } from "node:path";

interface RequiredSurface {
	path: string;
	description: string;
}

const REQUIRED_SURFACES: RequiredSurface[] = [
	{
		path: "docs/canon/product-topology.md",
		description: "canonical product topology document",
	},
	{
		path: "docs/products/drenyra-product-philosophy.md",
		description: "canonical product philosophy document",
	},
	{
		path: "apps/web/MAP.md",
		description: "web navigation and product model",
	},
	{
		path: "apps/cli/MAP.md",
		description: "CLI navigation and product model",
	},
	{
		path: "apps/web/src/routes/product-surfaces.tsx",
		description: "web product surfaces route",
	},
];

function main(): void {
	const missing = REQUIRED_SURFACES.filter(
		(surface) => !existsSync(resolve(process.cwd(), surface.path)),
	);

	if (missing.length > 0) {
		console.error("[architecture:check-product-surfaces] Missing surfaces:");
		for (const surface of missing) {
			console.error(`- ${surface.path}: ${surface.description}`);
		}
		process.exit(1);
	}

	console.log("[architecture:check-product-surfaces] Product surfaces passed");
}

main();
