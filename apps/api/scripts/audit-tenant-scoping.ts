/// <reference types="bun-types" />

/**
 * Tenant Isolation Audit
 *
 * Recorre todas las rutas registradas en la API y verifica que usen
 * companyScopeGuard o tengan validación explícita de companyId.
 *
 * Uso: bun run apps/api/scripts/audit-tenant-scoping.ts
 *
 * Output: tabla con cada endpoint, si usa companyScopeGuard,
 * y el nivel de riesgo de tenant isolation.
 */

import { readdirSync, readFileSync } from "fs";
import { join, relative } from "path";

const API_SRC = join(import.meta.dir, "../src/features");

interface AuditEntry {
	feature: string;
	routeFile: string;
	usesScopeGuard: boolean;
	usesManualCompanyCheck: boolean;
	hasExplicitCompanyId: boolean;
	riskLevel: "safe" | "manual" | "unverified" | "missing";
	notes: string;
}

const results: AuditEntry[] = [];

function auditFeature(featureName: string, featureDir: string) {
	// Find route files
	const files = readdirSync(featureDir, { recursive: true }).filter(
		(f: string) => f.endsWith(".route.ts") || f.endsWith(".routes.ts"),
	) as string[];

	if (files.length === 0) {
		// No routes file — check if it's a library/domain feature
		results.push({
			feature: featureName,
			routeFile: "(no routes)",
			usesScopeGuard: false,
			usesManualCompanyCheck: false,
			hasExplicitCompanyId: false,
			riskLevel: "missing",
			notes: "Sin archivo de rutas — verificar si expone endpoints",
		});
		return;
	}

	for (const file of files) {
		const fullPath = join(featureDir, file);
		const content = readFileSync(fullPath, "utf-8");
		const relPath = relative(join(API_SRC, ".."), fullPath);

		const usesScopeGuard = content.includes("companyScopeGuard");
		const usesManualCheck =
			content.includes("companyContext?.companyId") ||
			content.includes("companyContext.companyId");
		const hasExplicitId =
			content.includes("companyId:") ||
			content.includes('"companyId"') ||
			content.includes("params.companyId") ||
			content.includes("query.companyId");

		let riskLevel: AuditEntry["riskLevel"];
		let notes = "";

		if (usesScopeGuard) {
			riskLevel = "safe";
			notes = "Usa companyScopeGuard";
		} else if (usesManualCheck) {
			riskLevel = "manual";
			notes = "Validación manual de companyId";
		} else if (hasExplicitId) {
			riskLevel = "unverified";
			notes = "Menciona companyId pero sin validación visible";
		} else {
			riskLevel = "missing";
			notes = "SIN validación de tenant encontrada";
		}

		results.push({
			feature: featureName,
			routeFile: relPath,
			usesScopeGuard,
			usesManualCompanyCheck: usesManualCheck,
			hasExplicitCompanyId: hasExplicitId,
			riskLevel,
			notes,
		});
	}
}

// Scan all features
const features = readdirSync(API_SRC, { withFileTypes: true });
for (const feature of features) {
	if (!feature.isDirectory()) continue;
	const featureDir = join(API_SRC, feature.name);
	auditFeature(feature.name, featureDir);
}

// Print report
console.log("\n═══════════════════════════════════════════════════════════════");
console.log("  TENANT ISOLATION AUDIT REPORT");
console.log("═══════════════════════════════════════════════════════════════\n");

const SAFE = results.filter((r) => r.riskLevel === "safe");
const MANUAL = results.filter((r) => r.riskLevel === "manual");
const UNVERIFIED = results.filter((r) => r.riskLevel === "unverified");
const MISSING = results.filter((r) => r.riskLevel === "missing");

console.log(`  ✅ Safe (companyScopeGuard):        ${SAFE.length}`);
console.log(`  ⚠️  Manual companyId check:           ${MANUAL.length}`);
console.log(`  🔍 Unverified (companyId ref):        ${UNVERIFIED.length}`);
console.log(`  ❌ Missing tenant scoping:            ${MISSING.length}`);
console.log(`  ─────────────────────────────────────────────`);
console.log(`  Total route files audited:            ${results.length}\n`);

if (MISSING.length > 0) {
	console.log("  ❌ FEATURES WITHOUT TENANT SCOPING:");
	console.log("  ─────────────────────────────────────");
	for (const r of MISSING) {
		console.log(`    ${r.feature.padEnd(25)} ${r.routeFile}`);
	}
	console.log();
}

if (UNVERIFIED.length > 0) {
	console.log("  🔍 FEATURES WITH UNVERIFIED SCOPING:");
	console.log("  ───────────────────────────────────────");
	for (const r of UNVERIFIED) {
		console.log(`    ${r.feature.padEnd(25)} ${r.routeFile}`);
	}
	console.log();
}

if (MANUAL.length > 0) {
	console.log("  ⚠️  FEATURES WITH MANUAL COMPANY CHECK:");
	console.log("  ────────────────────────────────────────");
	for (const r of MANUAL) {
		console.log(`    ${r.feature.padEnd(25)} ${r.routeFile}`);
	}
	console.log();
}

// Summary
const totalRisky = MISSING.length + UNVERIFIED.length;
console.log("═══════════════════════════════════════════════════════════════");
if (totalRisky > 0) {
	console.log(
		`  ⚠️  ${totalRisky} feature(s) need tenant isolation review.`,
	);
} else {
	console.log("  ✅ All features have tenant scoping.");
}
console.log("═══════════════════════════════════════════════════════════════\n");
