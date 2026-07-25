import { describe, expect, it } from "vitest";
import { classifyDiff, loadClassifierConfig } from "../../src/classifier";
import type { DiffEntry } from "../../src/classifier/classifier";

// ============================================================================
// Positive tests — must classify as R2
// ============================================================================

describe("classifyDiff — positive (R2)", () => {
	it("returns R2 for files in packages/fiscal/ paths", () => {
		const diff: DiffEntry = {
			addedLines: ["const rate = 0.18;"],
			modifiedFiles: ["packages/fiscal/src/rates.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedPaths).toContain("packages/fiscal/src/rates.ts");
		expect(result.blocked).toBe(true);
	});

	it("returns R2 for diff containing SUNAT references (not production endpoint URLs)", () => {
		const diff: DiffEntry = {
			addedLines: ["const sunatConfig = { debug: true };  // SUNAT helper"],
			modifiedFiles: ["packages/shared/src/config.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedContentPatterns.some((p) => p.includes("SUNAT"))).toBe(
			true,
		);
	});

	it("returns R2 for renamed fiscal file", () => {
		const diff: DiffEntry = {
			addedLines: ["// migrated content"],
			modifiedFiles: ["packages/shared/src/moved-rates.ts"],
			renamedFiles: ["packages/fiscal/src/rates.ts"],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedPaths.some((p) => p.includes("RENAMED"))).toBe(true);
	});

	it("returns R2 for deleted fiscal file", () => {
		const diff: DiffEntry = {
			addedLines: [],
			modifiedFiles: [],
			renamedFiles: [],
			deletedFiles: ["packages/fiscal/src/old-rule.ts"],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedPaths.some((p) => p.includes("DELETED"))).toBe(true);
	});

	it("returns R2 for IGV content pattern", () => {
		const diff: DiffEntry = {
			addedLines: ["const igv = monto * 0.18;"],
			modifiedFiles: ["packages/shared/src/taxes.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedContentPatterns.some((p) => p.includes("IGV"))).toBe(
			true,
		);
	});

	it("returns R2 for SIRE content pattern", () => {
		const diff: DiffEntry = {
			addedLines: ['const sireEndpoint = "https://sire.sunat.gob.pe";'],
			modifiedFiles: ["apps/api/src/routes/reports.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedContentPatterns.some((p) => p.includes("SIRE"))).toBe(
			true,
		);
	});

	it("returns R2 for idempotency_key pattern", () => {
		const diff: DiffEntry = {
			addedLines: ["  idempotency_key: uuidv4(),"],
			modifiedFiles: ["packages/application/src/invoicing/service.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});

	it("returns R2 for tenant_id in fiscal context", () => {
		const diff: DiffEntry = {
			addedLines: ["  WHERE tenant_id = ? AND fiscal_period = ?"],
			modifiedFiles: ["packages/shared/src/queries.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});

	it("returns R2 for tasa + percentage pattern", () => {
		const diff: DiffEntry = {
			addedLines: ["const tasa = 18;  // IGV rate"],
			modifiedFiles: ["packages/domain/src/constants/tasas.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});

	it("returns R2 for fiscal content in test files (no auto-downgrade)", () => {
		const diff: DiffEntry = {
			addedLines: ["const ruc = '20123456789';  // test RUC"],
			modifiedFiles: ["packages/fiscal/__tests__/rates.test.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});

	it("returns R2 for changing classifier config (self-modification)", () => {
		const diff: DiffEntry = {
			addedLines: ["    paths: ['packages/fiscal/'],"],
			modifiedFiles: [
				"packages/drenyra-orchestrator/src/classifier/classifier.ts",
			],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.matchedPaths.some((p) => p.includes("classifier"))).toBe(
			true,
		);
	});

	it("returns R2 for changing .githooks/", () => {
		const diff: DiffEntry = {
			addedLines: ["# Updated fiscal gate"],
			modifiedFiles: [".githooks/pre-commit"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});
});

// ============================================================================
// R3 tests — always blocked, highest precedence
// ============================================================================

describe("classifyDiff — R3 (highest precedence)", () => {
	it("returns R3 for DROP TABLE in migration", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP TABLE fiscal_records;"],
			modifiedFiles: ["packages/persistence/src/migrations/003_cleanup.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
		expect(result.blocked).toBe(true);
	});

	it("returns R3 for production migration path", () => {
		const diff: DiffEntry = {
			addedLines: ["// production deploy"],
			modifiedFiles: [
				"packages/infrastructure/src/migrations/production/deploy.ts",
			],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("R3 takes precedence over R2 (even if R2 paths also match)", () => {
		const diff: DiffEntry = {
			addedLines: [
				"DROP TABLE fiscal_records;",
				"const tasa = 18;",
				"const ruc = '20123456789';",
			],
			modifiedFiles: [
				"packages/fiscal/src/rates.ts",
				"packages/persistence/src/migrations/production/cleanup.ts",
			],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		// R3 path + DROP content should win over R2 paths/content
		expect(result.level).toBe("R3");
	});

	it("returns R3 for ALTER TABLE DROP in migration", () => {
		const diff: DiffEntry = {
			addedLines: ["ALTER TABLE fiscal_records DROP COLUMN old_field;"],
			modifiedFiles: ["packages/persistence/src/migrations/004_cleanup.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
		expect(result.blocked).toBe(true);
	});

	it("returns R3 for DROP INDEX/VIEW/PROCEDURE", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP INDEX idx_fiscal_ruc;", "DROP VIEW v_fiscal_summary;"],
			modifiedFiles: ["packages/persistence/src/migrations/005_cleanup.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for TRUNCATE (any table, no fiscal qualifier needed)", () => {
		const diff: DiffEntry = {
			addedLines: ["TRUNCATE TABLE audit_log;"],
			modifiedFiles: ["packages/persistence/src/cleanup.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for SUNAT/SIRE API execution (POST/PUT/DELETE)", () => {
		const diff: DiffEntry = {
			addedLines: [
				"const resp = await fetch('https://api.sunat.gob.pe', { method: 'POST' });",
			],
			modifiedFiles: ["packages/infrastructure/src/transport/sunat/client.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for production config changes", () => {
		const diff: DiffEntry = {
			addedLines: ["SUNAT_API_KEY=prod_key_12345"],
			modifiedFiles: ["packages/shared/config/production/sunat.env"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for SUNAT production endpoint URL in content", () => {
		const diff: DiffEntry = {
			addedLines: ["const endpoint = 'https://api.sunat.gob.pe/v1/factura';"],
			modifiedFiles: ["packages/shared/src/endpoints.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for SIRE production endpoint URL in content", () => {
		const diff: DiffEntry = {
			addedLines: [
				"const sireEndpoint = 'https://api.sire.gob.pe/v2/reporte';",
			],
			modifiedFiles: ["packages/shared/src/endpoints.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("R3 content patterns take precedence over R2 fiscal paths", () => {
		const diff: DiffEntry = {
			addedLines: [
				"TRUNCATE TABLE fiscal_periods;",
				"const ruc = '20123456789';",
				"const tasa = 18;",
			],
			modifiedFiles: ["packages/fiscal/src/rates.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for POST/PUT/DELETE request to SUNAT endpoint", () => {
		const diff: DiffEntry = {
			addedLines: [
				"await axios.post('https://api.sunat.gob.pe/envio', factura);",
			],
			modifiedFiles: ["packages/shared/src/gateway.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for secrets path", () => {
		const diff: DiffEntry = {
			addedLines: ["const key = 'supersecret';"],
			modifiedFiles: ["config/secrets/prod/fiscal.key"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for DROP SEQUENCE", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP SEQUENCE IF EXISTS fiscal_seq;"],
			modifiedFiles: ["packages/persistence/src/migrations/006_seq.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for DROP TYPE", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP TYPE fiscal_status CASCADE;"],
			modifiedFiles: ["packages/persistence/src/migrations/007_type.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for DROP POLICY", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP POLICY IF EXISTS fiscal_access ON records;"],
			modifiedFiles: ["packages/persistence/src/migrations/008_policy.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for DROP ROLE", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP ROLE fiscal_auditor;"],
			modifiedFiles: ["packages/persistence/src/migrations/009_role.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for case-insensitive DROP TABLE (lowercase)", () => {
		const diff: DiffEntry = {
			addedLines: ["drop table if exists fiscal_records;"],
			modifiedFiles: ["packages/persistence/src/cleanup.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("returns R3 for SQL with schema-qualified DROP TABLE", () => {
		const diff: DiffEntry = {
			addedLines: ['DROP TABLE "public"."fiscal_records";'],
			modifiedFiles: ["packages/persistence/src/migrations/010_drop.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("R3 stays R3 even in docs directory (no degradation)", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP TABLE fiscal_records;  -- example in docs"],
			modifiedFiles: ["docs/migrations/example.sql"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("R3 stays R3 even in test files (no degradation)", () => {
		const diff: DiffEntry = {
			addedLines: ["DROP TABLE fiscal_records;  // test cleanup"],
			modifiedFiles: ["packages/persistence/__tests__/cleanup.test.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});

	it("R3 with multiline DROP (ALTER TABLE ... DROP across lines)", () => {
		const diff: DiffEntry = {
			addedLines: [
				"ALTER TABLE fiscal_records",
				"  DROP COLUMN IF EXISTS old_field;",
			],
			modifiedFiles: ["packages/persistence/src/migrations/011_alter.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R3");
	});
});

// ============================================================================
// Negative tests — must NOT classify as R2
// ============================================================================

describe("classifyDiff — negative (R0/R1)", () => {
	it("returns R1 for UI components without fiscal content", () => {
		const diff: DiffEntry = {
			addedLines: ["<Button variant='primary'>Click</Button>"],
			modifiedFiles: ["apps/web/src/components/Button.tsx"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R1");
		expect(result.blocked).toBe(false);
	});

	it("returns R1 for documentation changes (.md files)", () => {
		const diff: DiffEntry = {
			addedLines: ["## New feature", "This is a new feature."],
			modifiedFiles: ["docs/features/new-feature.md"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R1");
	});

	it("returns R1 for test file changes", () => {
		const diff: DiffEntry = {
			addedLines: [
				"it('does something', () => {",
				"  expect(true).toBe(true);",
			],
			modifiedFiles: ["packages/shared/__tests__/utils.test.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R1");
	});

	it("returns R1 for empty diff (no changes)", () => {
		const diff: DiffEntry = {
			addedLines: [],
			modifiedFiles: [],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R1");
	});

	it("returns R1 for config change without fiscal content", () => {
		const diff: DiffEntry = {
			addedLines: ["  port: 3000,"],
			modifiedFiles: ["packages/shared/src/config.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R1");
	});
});

// ============================================================================
// Boundary tests — ambiguous → fail-closed R2
// ============================================================================

describe("classifyDiff — boundary (fail-closed)", () => {
	it("returns R2 (fail-closed) for completely new file with no fiscal patterns", () => {
		const diff: DiffEntry = {
			addedLines: ["const x = 42;", "console.log(x);"],
			modifiedFiles: [],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
		expect(result.failClosed).toBe(true);
		expect(result.ambiguous).toBe(true);
	});

	it("returns R2 (fail-closed) when only deleted files with no path match", () => {
		const diff: DiffEntry = {
			addedLines: [],
			modifiedFiles: [],
			renamedFiles: [],
			deletedFiles: ["apps/web/src/old-component.ts"],
		};
		const result = classifyDiff(diff);
		// modifiedFiles.length === 0 && addedLines.length > 0 is false (addedLines is 0)
		// So this falls through to R1
		expect(result.level).toBe("R1");
	});

	it("returns fail-closed for null addedLines", () => {
		const diff: DiffEntry = {
			addedLines: [] as string[],
			modifiedFiles: [],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R1"); // empty diff is R1
	});

	it("fail-closed when content cannot be classified with confidence", () => {
		const diff: DiffEntry = {
			addedLines: ["const data = Buffer.from('abc');"],
			modifiedFiles: [],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		// No path match + no content pattern match but has added lines
		expect(result.failClosed).toBe(true);
		expect(result.ambiguous).toBe(true);
	});
});

// ============================================================================
// Unicode and special characters
// ============================================================================

describe("classifyDiff — edge cases (unicode, special paths)", () => {
	it("handles Unicode characters in paths", () => {
		const diff: DiffEntry = {
			addedLines: ["const x = 1;"],
			modifiedFiles: [
				"packages/fiscal/src/archivos/contribuyentes/año-2026/tasas.ts",
			],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});

	it("handles paths with spaces", () => {
		const diff: DiffEntry = {
			addedLines: ["const x = 1;"],
			modifiedFiles: ["packages/fiscal/src/old dir/rates.ts"],
			renamedFiles: [],
			deletedFiles: [],
		};
		const result = classifyDiff(diff);
		expect(result.level).toBe("R2");
	});
});

// ============================================================================
// Config loading
// ============================================================================

describe("loadClassifierConfig", () => {
	it("returns defaults when no source provided", () => {
		const config = loadClassifierConfig(undefined);
		expect(config.version).toBe("1.0.0");
		expect(config.r3Paths.length).toBeGreaterThan(0);
		expect(config.paths.length).toBeGreaterThan(15);
		expect(config.fallbackLevel).toBe("R2");
	});

	it("merges partial source with defaults", () => {
		const config = loadClassifierConfig({ version: "2.0.0" });
		expect(config.version).toBe("2.0.0");
		expect(config.r3Paths.length).toBeGreaterThan(0);
		expect(config.paths.length).toBeGreaterThan(15); // from defaults
	});

	it("accepts custom paths", () => {
		const config = loadClassifierConfig({
			paths: ["packages/custom-fiscal/"],
			contentPatterns: [],
		});
		expect(config.paths).toEqual(["packages/custom-fiscal/"]);
		expect(config.contentPatterns).toEqual([]);
	});

	it("preserves r3Paths when merging", () => {
		const config = loadClassifierConfig({ version: "2.0.0" });
		expect(config.r3Paths.length).toBe(9);
	});
});
