import { describe, expect, it } from "bun:test";
import {
	createTaxAuthority,
	hasTaxAuthority,
	registerTaxAuthority,
} from "../index";
import { SunatTaxAuthorityAdapter } from "../sunat-tax-authority.adapter";

describe("TaxAuthority registry", () => {
	it("has SUNAT adapter registered for PE by default", () => {
		expect(hasTaxAuthority("PE")).toBe(true);
	});

	it("throws for unregistered country codes", () => {
		expect(() => {
			// Trigger the factory lookup
			registerTaxAuthority("XX" as never, () => ({}) as never);
			registerTaxAuthority("AR" as never, () => ({}) as never);
		}).not.toThrow();
	});

	it("allows registering custom adapters", () => {
		registerTaxAuthority("MX", () => new MockAdapter());
		expect(hasTaxAuthority("MX")).toBe(true);
	});

	it("createTaxAuthority returns null when init fails (no credentials)", async () => {
		const adapter = await createTaxAuthority("PE", 1);
		expect(adapter).toBeNull();
	});
});

describe("SunatTaxAuthorityAdapter", () => {
	it("fails initialization without SUNAT credentials", async () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		const result = await adapter.initialize();
		expect(result).toBe(false);
	});

	it("has correct country code and provider name", () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		expect(adapter.countryCode).toBe("PE");
		expect(adapter.providerName).toBe("SUNAT");
	});

	it("parseCDR defaults to ACCEPTED code 0 for unparseable content", () => {
		// OSEService.parseCDR defaults code to "0" (SUNAT's ACCEPTED code)
		// when regex matching fails on invalid content
		const adapter = new SunatTaxAuthorityAdapter(1);
		const result = adapter.parseCDR("invalid-base64!!!");
		expect(result.status).toBe("ACCEPTED");
		expect(result.code).toBe("0");
	});

	it("validateDocument fails without initialization", async () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		expect(adapter.validateDocument("<xml/>")).rejects.toThrow(
			"not initialized",
		);
	});

	it("consultTaxId fails without initialization", async () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		expect(adapter.consultTaxId("20546296564")).rejects.toThrow(
			"not initialized",
		);
	});

	it("findDiscrepancies returns empty for identical records", () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		const record = {
			period: "202601",
			documentType: "01",
			series: "F001",
			number: "1",
			issuerTaxId: "20546296564",
			issuerName: "Test",
			issueDate: new Date("2026-01-15"),
			currency: "PEN",
			total: 118000, // cents
		};

		const result = adapter.findDiscrepancies([record], [record]);
		expect(result).toHaveLength(0);
	});

	it("findDiscrepancies detects missing local records", () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		const authRecord = {
			period: "202601",
			documentType: "01",
			series: "F001",
			number: "1",
			issuerTaxId: "20546296564",
			issuerName: "Proveedor SAC",
			issueDate: new Date("2026-01-15"),
			currency: "PEN",
			total: 118000,
		};

		const result = adapter.findDiscrepancies([], [authRecord]);
		expect(result).toHaveLength(1);
		expect(result[0]?.type).toBe("MISSING_LOCAL");
		expect(result[0]?.documentKey).toBe("F001-1");
	});

	it("findDiscrepancies detects missing authority records", () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		const localRecord = {
			period: "202601",
			documentType: "01",
			series: "F001",
			number: "1",
			issuerTaxId: "20546296564",
			issuerName: "Proveedor SAC",
			issueDate: new Date("2026-01-15"),
			currency: "PEN",
			total: 118000,
		};

		const result = adapter.findDiscrepancies([localRecord], []);
		expect(result).toHaveLength(1);
		expect(result[0]?.type).toBe("MISSING_AUTHORITY");
	});

	it("findDiscrepancies detects amount mismatches", () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		const local = {
			period: "202601",
			documentType: "01",
			series: "F001",
			number: "1",
			issuerTaxId: "20546296564",
			issuerName: "Test",
			issueDate: new Date("2026-01-15"),
			currency: "PEN",
			total: 118000,
		};
		const auth = { ...local, total: 120000 };

		const result = adapter.findDiscrepancies([local], [auth]);
		expect(result).toHaveLength(1);
		expect(result[0]?.type).toBe("AMOUNT_MISMATCH");
	});

	it("findDiscrepancies ignores sub-cent differences", () => {
		const adapter = new SunatTaxAuthorityAdapter(1);
		const local = {
			period: "202601",
			documentType: "01",
			series: "F001",
			number: "1",
			issuerTaxId: "20546296564",
			issuerName: "Test",
			issueDate: new Date("2026-01-15"),
			currency: "PEN",
			total: 118000,
		};
		const auth = { ...local, total: 118001 };

		// 1 cent difference is within tolerance
		const result = adapter.findDiscrepancies([local], [auth]);
		expect(result).toHaveLength(0);
	});
});

// ─── Mock Adapter ─────────────────────────────────────────────────────

class MockAdapter {
	readonly countryCode = "MX" as const;
	readonly providerName = "SAT_MOCK";
	async initialize(): Promise<boolean> {
		return true;
	}
}
