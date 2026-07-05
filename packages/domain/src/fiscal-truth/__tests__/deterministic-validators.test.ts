import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import { RUC } from "../../value-objects/RUC";
import { DETERMINISTIC_REASON_CODE } from "../constants";
import {
	buildRucIgvDeterministicResult,
	type RucIgvDeterministicInput,
} from "../types";

describe("Fiscal Truth deterministic validators", () => {
	it("produces stable reason code for valid RUC and IGV", () => {
		const result = buildRucIgvDeterministicResult({
			ruc: RUC.create("20100070970"),
			subtotal: Money.fromAmount(100, "PEN"),
			igv: Money.fromAmount(18, "PEN"),
			validatorVersion: "ruc-igv/v1",
		});

		expect(result.isValid).toBe(true);
		expect(result.code).toBe(DETERMINISTIC_REASON_CODE.VALIDATION_OK);
	});

	it("produces stable reason code for IGV mismatch", () => {
		const result = buildRucIgvDeterministicResult({
			ruc: RUC.create("20100070970"),
			subtotal: Money.fromAmount(100, "PEN"),
			igv: Money.fromAmount(17.99, "PEN"),
			validatorVersion: "ruc-igv/v1",
		});

		expect(result.isValid).toBe(false);
		expect(result.code).toBe(DETERMINISTIC_REASON_CODE.IGV_MISMATCH);
	});

	it("rejects an 11-digit RUC with invalid SUNAT checksum", () => {
		const invalidRuc = {
			toString: () => "20100070971",
		} as unknown as RUC;
		const result = buildRucIgvDeterministicResult({
			ruc: invalidRuc,
			subtotal: Money.fromAmount(100, "PEN"),
			igv: Money.fromAmount(18, "PEN"),
			validatorVersion: "ruc-igv/v1",
		});

		expect(result.isValid).toBe(false);
		expect(result.code).toBe(DETERMINISTIC_REASON_CODE.RUC_INVALID);
	});

	it("rounds IGV with integer basis points for cent-level determinism", () => {
		const result = buildRucIgvDeterministicResult({
			ruc: RUC.create("20100070970"),
			subtotal: Money.fromCents(10001, "PEN"),
			igv: Money.fromCents(1800, "PEN"),
			validatorVersion: "ruc-igv/v1",
		});

		expect(result.isValid).toBe(true);
		expect(result.expectedIgvCents).toBe(1800);
	});

	it("is deterministic for equal inputs and version", () => {
		const input: RucIgvDeterministicInput = {
			ruc: RUC.create("20100070970"),
			subtotal: Money.fromAmount(845.32, "PEN"),
			igv: Money.fromAmount(152.16, "PEN"),
			validatorVersion: "ruc-igv/v1",
		};

		const a = buildRucIgvDeterministicResult(input);
		const b = buildRucIgvDeterministicResult(input);

		expect(a).toEqual(b);
	});
});
