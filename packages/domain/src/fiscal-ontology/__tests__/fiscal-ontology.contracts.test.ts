import { describe, expect, it } from "vitest";
import { RUC } from "../../value-objects/RUC";
import {
	FISCAL_OBJECT_KIND,
	FISCAL_RELATION_KIND,
	canRelateFiscalObjects,
	createFiscalObjectRelation,
	createFiscalOntologyScope,
	createFiscalPeriod,
	isFiscalOntologyScope,
	isFiscalPeriodValue,
} from "../types";

const baseScopeInput = {
	organizationId: "org_123",
	companyId: "company_123",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE" as const,
};

describe("Fiscal Ontology v0 contracts", () => {
	it("creates a scoped Peruvian fiscal ontology context", () => {
		const scope = createFiscalOntologyScope(baseScopeInput);

		expect(scope.companyRuc).toBeInstanceOf(RUC);
		expect(scope.companyRuc.toString()).toBe(baseScopeInput.companyRuc);
		expect(scope.period.value).toBe("2026-05");
		expect(isFiscalOntologyScope(scope)).toBe(true);
	});

	it("rejects malformed fiscal periods", () => {
		expect(isFiscalPeriodValue("2026-00")).toBe(false);
		expect(isFiscalPeriodValue("2026-13")).toBe(false);
		expect(() => createFiscalPeriod("2026-Q1")).toThrow(
			"Invalid fiscal period",
		);
	});

	it("rejects invalid SUNAT RUC checksum before creating scope", () => {
		expect(() =>
			createFiscalOntologyScope({
				...baseScopeInput,
				companyRuc: "20123456780",
			}),
		).toThrow();
	});

	it("rejects blank organization and company identifiers", () => {
		expect(() =>
			createFiscalOntologyScope({
				...baseScopeInput,
				organizationId: " ",
			}),
		).toThrow("Invalid fiscal ontology scope");

		expect(() =>
			createFiscalOntologyScope({
				...baseScopeInput,
				companyId: " ",
			}),
		).toThrow("Invalid fiscal ontology scope");
	});

	it("rejects unsupported country packs in v0", () => {
		const unsupportedScope = {
			...createFiscalOntologyScope(baseScopeInput),
			countryCode: "CO",
		} as unknown as ReturnType<typeof createFiscalOntologyScope>;

		expect(isFiscalOntologyScope(unsupportedScope)).toBe(false);
	});

	it("fails closed for cross-RUC fiscal object relations", () => {
		const sourceScope = createFiscalOntologyScope(baseScopeInput);
		const targetScope = createFiscalOntologyScope({
			...baseScopeInput,
			companyRuc: "20100070970",
		});

		expect(
			canRelateFiscalObjects(
				{
					id: "cpe_123",
					kind: FISCAL_OBJECT_KIND.CPE,
					scope: sourceScope,
				},
				{
					id: "sire_123",
					kind: FISCAL_OBJECT_KIND.SIRE_RECORD,
					scope: targetScope,
				},
			),
		).toBe(false);
	});

	it("allows same-scope fiscal object relations", () => {
		const scope = createFiscalOntologyScope(baseScopeInput);

		expect(
			canRelateFiscalObjects(
				{ id: "cpe_123", kind: FISCAL_OBJECT_KIND.CPE, scope },
				{ id: "cdr_123", kind: FISCAL_OBJECT_KIND.CDR, scope },
			),
		).toBe(true);
	});

	it("factory rejects cross-company, cross-period, and cross-RUC relations", () => {
		const scope = createFiscalOntologyScope(baseScopeInput);
		const cpe = { id: "cpe_123", kind: FISCAL_OBJECT_KIND.CPE, scope };
		const mismatches = [
			createFiscalOntologyScope({ ...baseScopeInput, companyId: "company_456" }),
			createFiscalOntologyScope({ ...baseScopeInput, period: "2026-06" }),
			createFiscalOntologyScope({ ...baseScopeInput, companyRuc: "20100070970" }),
		];

		for (const mismatchScope of mismatches) {
			expect(() =>
				createFiscalObjectRelation({
					id: "rel_123",
					kind: FISCAL_RELATION_KIND.RECONCILES_WITH,
					from: cpe,
					to: {
						id: "sire_123",
						kind: FISCAL_OBJECT_KIND.SIRE_RECORD,
						scope: mismatchScope,
					},
					ruleReference: null,
					createdAt: "2026-05-26T00:00:00.000Z",
				}),
			).toThrow("Fiscal object relation crosses fiscal scope");
		}
	});
});
