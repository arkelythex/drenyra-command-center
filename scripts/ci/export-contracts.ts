/**
 * Cross-Stack Contract Exporter
 *
 * Generates JSON contract files for Go and Python consumption.
 * Run: bun run ci:export-contracts
 */

import { FISCAL_CONTRACTS, getFiscalContractsJSON, getContractJSON, type FiscalContractName } from "@drenyra/domain/fiscal-contracts";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, "../../contracts");
mkdirSync(OUTPUT_DIR, { recursive: true });

console.log("📤 Exporting fiscal contracts...");

// Full contract registry
writeFileSync(join(OUTPUT_DIR, "fiscal-contracts.json"), getFiscalContractsJSON());
console.log("  ✓ fiscal-contracts.json");

// Individual contracts
for (const [name, contract] of Object.entries(FISCAL_CONTRACTS)) {
  writeFileSync(
    join(OUTPUT_DIR, `${name}-contract.json`),
    JSON.stringify(contract, null, 2),
  );
}
console.log(`  ✓ ${Object.keys(FISCAL_CONTRACTS).length} individual contracts`);

// Summary
const summary = {
  exportedAt: new Date().toISOString(),
  contractCount: Object.keys(FISCAL_CONTRACTS).length,
  contracts: Object.fromEntries(
    Object.entries(FISCAL_CONTRACTS).map(([name, c]) => [
      name,
      { version: c.version, invariants: c.invariants.length },
    ]),
  ),
};
writeFileSync(join(OUTPUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
console.log("  ✓ summary.json");
console.log(`\n📁 Contracts exported to: ${OUTPUT_DIR}`);
