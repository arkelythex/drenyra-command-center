/**
 * SIRE-bench golden runner for Korveth (packages/domain).
 * Loads testdata/golden input.json files and compares against expected.json.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
	calculateBaseFromTotal,
	calculateDetraccion,
	calculateIGV,
} from "../../src/services/tax-calculator/calculator";
import { Money } from "../../src/value-objects/Money";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_ROOT = __dirname;

interface GoldenInput {
	id: string;
	operation: "calculateIGV" | "calculateBaseFromTotal" | "calculateDetraccion";
	amountCents: number;
	currency: "PEN" | "USD";
	serviceCode?: string;
}

interface GoldenExpected {
	result: Record<string, unknown>;
	norma_aplicada: string;
	version_tabla: string;
	deterministic: boolean;
	source: string;
}

function discoverGoldenCases(): Array<{
	name: string;
	inputPath: string;
	expectedPath: string;
}> {
	const cases: Array<{
		name: string;
		inputPath: string;
		expectedPath: string;
	}> = [];

	for (const subdir of ["igv", "detraccion"]) {
		const dir = join(GOLDEN_ROOT, subdir);
		let files: string[];
		try {
			files = readdirSync(dir).filter((f) => f.endsWith(".input.json"));
		} catch {
			continue;
		}
		for (const inputFile of files) {
			const base = inputFile.replace(".input.json", "");
			cases.push({
				name: `${subdir}/${base}`,
				inputPath: join(dir, inputFile),
				expectedPath: join(dir, `${base}.expected.json`),
			});
		}
	}

	return cases;
}

function runGoldenCase(input: GoldenInput): GoldenExpected["result"] {
	const money = Money.fromCents(input.amountCents, input.currency);

	switch (input.operation) {
		case "calculateIGV": {
			const result = calculateIGV(money);
			return {
				base_imponible: result.baseAmount.getAmount(),
				igv: result.taxAmount.getAmount(),
				total: result.totalAmount.getAmount(),
				currency: input.currency,
			};
		}
		case "calculateBaseFromTotal": {
			const result = calculateBaseFromTotal(money);
			return {
				base_imponible: result.baseAmount.getAmount(),
				igv: result.taxAmount.getAmount(),
				total: result.totalAmount.getAmount(),
				currency: input.currency,
			};
		}
		case "calculateDetraccion": {
			if (!input.serviceCode) {
				throw new Error("serviceCode required for calculateDetraccion");
			}
			const result = calculateDetraccion(money, input.serviceCode);
			return {
				base_imponible: result.baseAmount.getAmount(),
				detraccion: result.taxAmount.getAmount(),
				total: result.totalAmount.getAmount(),
				serviceCode: input.serviceCode,
				rate: result.taxRate,
				currency: input.currency,
			};
		}
		default:
			throw new Error(`Unknown operation: ${input.operation}`);
	}
}

describe("SIRE-bench — domain golden cases", () => {
	const cases = discoverGoldenCases();

	it("discovers at least 3 golden cases", () => {
		expect(cases.length).toBeGreaterThanOrEqual(3);
	});

	for (const testCase of cases) {
		it(`matches golden: ${testCase.name}`, () => {
			const input = JSON.parse(
				readFileSync(testCase.inputPath, "utf-8"),
			) as GoldenInput;
			const expected = JSON.parse(
				readFileSync(testCase.expectedPath, "utf-8"),
			) as GoldenExpected;

			const actualResult = runGoldenCase(input);

			expect(actualResult).toEqual(expected.result);
			expect(expected.deterministic).toBe(true);
			expect(expected.norma_aplicada).toBeTruthy();
			expect(expected.version_tabla).toBeTruthy();
		});
	}
});

describe("SIRE-bench — audit metadata on calculator", () => {
	it("includes normaAplicada and versionTabla on IGV result", () => {
		const result = calculateIGV(Money.fromAmount(1000, "PEN"));
		expect(result.normaAplicada).toContain("IGV");
		expect(result.versionTabla).toMatch(/^igv-rates-/);
	});

	it("includes normaAplicada and versionTabla on detracción result", () => {
		const result = calculateDetraccion(Money.fromAmount(1000, "PEN"), "007");
		expect(result.normaAplicada).toContain("SPOT");
		expect(result.versionTabla).toMatch(/^detraccion-/);
	});
});
