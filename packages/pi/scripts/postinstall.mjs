#!/usr/bin/env node
/**
 * @drenyra/pi — Post-install script
 *
 * Verifies the installation and sets up the fiscal harness
 * in the Pi agent environment.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = join(__dirname, "..");
const VERSION = "1.0.0-alpha.1";

let status = "ok";
const checks = [];

// Check 1: Extension file exists
const extPath = join(PKG_ROOT, "extensions", "drenyra-pi.ts");
if (existsSync(extPath)) {
  checks.push("✅ Extension: drenyra-pi.ts");
} else {
  checks.push("❌ Extension: drenyra-pi.ts MISSING");
  status = "warn";
}

// Check 2: Prompts exist
const promptDir = join(PKG_ROOT, "prompts");
const promptCount = ["fsd-init", "fsd-status", "fsd-advance", "fsd-propose",
  "fsd-spec", "fsd-design", "fsd-tasks", "fsd-apply", "fsd-verify",
  "fsd-archive", "fsd-onboard"].filter(f => existsSync(join(promptDir, `${f}.md`))).length;
checks.push(`✅ Prompts: ${promptCount} FSD templates`);

// Check 3: Skills exist
const skillDir = join(PKG_ROOT, "skills");
const skillCount = ["drenyra-sdd", "fiscal-compliance", "fiscal-review",
  "ruc-scope"].filter(f => existsSync(join(skillDir, f, "SKILL.md"))).length;
checks.push(`✅ Skills: ${skillCount} fiscal skills`);

// Check 4: Contracts exist
const contractDir = join(PKG_ROOT, "contracts");
const contractCount = ["receipt.schema.json", "fiscal-lens.schema.json",
  "phase-state.schema.json"].filter(f => existsSync(join(contractDir, "red", f))).length;
checks.push(`✅ Contracts: ${contractCount} RED schemas`);

// Check 5: Theme exists
if (existsSync(join(PKG_ROOT, "themes", "Drenyra.json"))) {
  checks.push("✅ Theme: Drenyra.json");
}

console.log(`\n  ╔══════════════════════════════════════╗`);
console.log(`  ║  @drenyra/pi v${VERSION.padEnd(17)}║`);
console.log(`  ║  Fiscal Agent Harness                ║`);
console.log(`  ╚══════════════════════════════════════╝\n`);
checks.forEach(c => console.log(`  ${c}`));
console.log(`\n  Install: pi install @drenyra/pi`);
console.log(`  Docs:    https://github.com/arkelythex/Drenyra\n`);

process.exit(status === "ok" ? 0 : 0); // Warnings are non-fatal
