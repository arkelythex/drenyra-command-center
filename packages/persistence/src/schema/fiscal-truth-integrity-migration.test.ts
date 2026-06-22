import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrationPath = join(
	__dirname,
	"../../../infrastructure/drizzle/0005_violet_overlord.sql",
);

const expectedConstraintNames = [
	"fiscal_truth_events_evidence_root_node_id_fiscal_evidence_nodes_node_id_fk",
	"fiscal_evidence_edges_from_node_id_fiscal_evidence_nodes_node_id_fk",
	"fiscal_evidence_edges_to_node_id_fiscal_evidence_nodes_node_id_fk",
] as const;

describe("fiscal truth integrity migration", () => {
	it("adds only the expected foreign key constraints", async () => {
		const sql = readFileSync(migrationPath, "utf-8");

		for (const constraintName of expectedConstraintNames) {
			expect(sql).toContain(`CONSTRAINT "${constraintName}"`);
			expect(sql).toContain(`conname = '${constraintName}'`);
		}

		expect(sql).toContain("conrelid = 'fiscal_truth_events'::regclass");
		expect(sql).toContain("conrelid = 'fiscal_evidence_edges'::regclass");

		expect(sql).toContain(
			'FOREIGN KEY ("evidence_root_node_id")\n\t\tREFERENCES "fiscal_evidence_nodes"("node_id")',
		);
		expect(sql).toContain(
			'FOREIGN KEY ("from_node_id")\n\t\tREFERENCES "fiscal_evidence_nodes"("node_id")',
		);
		expect(sql).toContain(
			'FOREIGN KEY ("to_node_id")\n\t\tREFERENCES "fiscal_evidence_nodes"("node_id")',
		);
	});

	it("does not redefine existing fiscal truth tables", async () => {
		const sql = readFileSync(migrationPath, "utf-8");

		expect(sql).not.toMatch(/CREATE\s+TABLE\s+"fiscal_truth_events"/i);
		expect(sql).not.toMatch(/CREATE\s+TABLE\s+"fiscal_evidence_nodes"/i);
		expect(sql).not.toMatch(/CREATE\s+TABLE\s+"fiscal_evidence_edges"/i);
		expect(sql).not.toMatch(/CREATE\s+TABLE\s+"fiscal_replay_checkpoints"/i);
	});
});
