import { Elysia } from "elysia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sunatApiModule } from "../../api.module";

// Mock the persistence layer
vi.mock("@drenyra/persistence/client", () => ({
	db: {
		query: {
			invoices: {
				findFirst: vi.fn(),
			},
		},
	},
}));

vi.mock("@drenyra/persistence/query", () => ({
	eq: vi.fn((col, val) => ({ column: col, value: val })),
	and: vi.fn((...args) => ({ and: args })),
}));

vi.mock("@drenyra/persistence/schema", () => ({
	invoices: {
		id: "invoices.id",
		companyId: "invoices.companyId",
	},
	authUsers: { id: "auth_users.id", email: "auth_users.email" },
	authSessions: { id: "auth_sessions.id" },
	authAccounts: { id: "auth_accounts.id" },
	authVerifications: { id: "auth_verifications.id" },
}));

type SunatServiceClass =
	typeof import("../../../../services/sunat.service")["SunatService"];

const sunatServiceMocks = vi.hoisted(() => ({
	validateRuc: vi.fn<SunatServiceClass["validateRuc"]>(() => ({
		valid: true,
		ruc: "20123456789",
		message: "RUC válido",
	})),
	validateRucOnline: vi.fn<SunatServiceClass["validateRucOnline"]>(
		async () => ({
			valid: true,
			ruc: "20123456789",
			estado: "ACTIVO",
			message: "RUC activo",
		}),
	),
	getExchangeRate: vi.fn<SunatServiceClass["getExchangeRate"]>(async () => ({
		date: "2026-05-15",
		purchase: 3.75,
		sale: 3.85,
		source: "mock",
	})),
	generateInvoiceXML: vi.fn<SunatServiceClass["generateInvoiceXML"]>(
		() => "<xml>signed</xml>",
	),
	generateInvoiceQR: vi.fn<SunatServiceClass["generateInvoiceQR"]>(
		async () => "data:image/png;base64,fake-qr",
	),
	validateInvoiceNumbering: vi.fn<
		SunatServiceClass["validateInvoiceNumbering"]
	>(() => ({
		valid: true,
		message: "Numeración válida",
		series: "F001",
		correlative: 1,
	})),
}));

vi.mock(import("../../../../services/sunat.service"), () => ({
	SunatService: sunatServiceMocks,
}));

import { db } from "@drenyra/persistence/client";
import { and, eq } from "@drenyra/persistence/query";
import { SunatService } from "../../../../services/sunat.service";

type InvoiceQueryResult = Awaited<
	ReturnType<typeof db.query.invoices.findFirst>
>;
type InvoiceFixture = Pick<
	NonNullable<InvoiceQueryResult>,
	| "id"
	| "companyId"
	| "invoiceNumber"
	| "series"
	| "correlative"
	| "issueDate"
	| "dueDate"
	| "currency"
	| "subtotal"
	| "igvAmount"
	| "totalAmount"
> & {
	company: {
		ruc: string;
		businessName: string;
		address: string | null;
	};
	customer: {
		taxId: string;
		legalName: string;
	};
	items: Array<{
		description: string;
		quantity: string;
		unitPrice: string;
		taxType: "GRAVADO";
		igvRate: string;
		subtotal: string;
		igvAmount: string;
		totalAmount: string;
	}>;
};

const makeInvoiceFixture = (
	id: string,
	companyId: string,
): NonNullable<InvoiceQueryResult> =>
	({
		id,
		companyId,
		invoiceNumber: "F001-00000001",
		series: "F001",
		correlative: 1,
		issueDate: new Date("2026-05-15T00:00:00.000Z"),
		dueDate: new Date("2026-06-15T00:00:00.000Z"),
		currency: "PEN",
		subtotal: "84.75",
		igvAmount: "15.25",
		totalAmount: "100.00",
		company: {
			ruc: "20123456789",
			businessName: "Test Company SAC",
			address: "Av. Test 123",
		},
		customer: {
			taxId: "10123456789",
			legalName: "Test Customer",
		},
		items: [
			{
				description: "Service",
				quantity: "1.00",
				unitPrice: "100.00",
				taxType: "GRAVADO",
				igvRate: "18.00",
				subtotal: "84.75",
				igvAmount: "15.25",
				totalAmount: "100.00",
			},
		],
	}) satisfies InvoiceFixture as NonNullable<InvoiceQueryResult>;

const expectScopedInvoiceLookup = (invoiceId: string, companyId: string) => {
	expect(db.query.invoices.findFirst).toHaveBeenCalledTimes(1);
	expect(eq).toHaveBeenCalledWith("invoices.id", invoiceId);
	expect(eq).toHaveBeenCalledWith("invoices.companyId", companyId);
	expect(and).toHaveBeenCalledWith(
		expect.objectContaining({ column: "invoices.id", value: invoiceId }),
		expect.objectContaining({
			column: "invoices.companyId",
			value: companyId,
		}),
	);
	expect(db.query.invoices.findFirst).toHaveBeenCalledWith(
		expect.objectContaining({
			where: expect.objectContaining({
				and: expect.arrayContaining([
					expect.objectContaining({ column: "invoices.id", value: invoiceId }),
					expect.objectContaining({
						column: "invoices.companyId",
						value: companyId,
					}),
				]),
			}),
		}),
	);
};

describe("sunat api module tenant guards", () => {
	let fetchSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.clearAllMocks();
		fetchSpy = vi
			.spyOn(globalThis, "fetch")
			.mockRejectedValue(new Error("Network access is forbidden in this test"));
	});

	afterEach(() => {
		fetchSpy.mockRestore();
	});

	describe("POST /generate-xml/:invoiceId", () => {
		it("returns 400 when X-Company-Id header is missing", async () => {
			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/generate-xml/inv-1", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.code).toBe("COMPANY_SCOPE_REQUIRED");
			expect(db.query.invoices.findFirst).not.toHaveBeenCalled();
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("returns 404 when invoice belongs to different company", async () => {
			vi.mocked(db.query.invoices.findFirst).mockResolvedValueOnce(undefined);

			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/generate-xml/inv-1", {
					method: "POST",
					headers: { "X-Company-Id": "cmp-wrong" },
				}),
			);

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.code).toBe("NOT_FOUND");
			expectScopedInvoiceLookup("inv-1", "cmp-wrong");
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("succeeds when X-Company-Id matches invoice companyId", async () => {
			vi.mocked(db.query.invoices.findFirst).mockResolvedValueOnce(
				makeInvoiceFixture("inv-1", "cmp-1"),
			);

			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/generate-xml/inv-1", {
					method: "POST",
					headers: { "X-Company-Id": "cmp-1" },
				}),
			);

			expect(response.status).toBe(200);
			expectScopedInvoiceLookup("inv-1", "cmp-1");
			expect(SunatService.generateInvoiceXML).toHaveBeenCalledTimes(1);
			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});

	describe("POST /generate-qr/:invoiceId", () => {
		it("returns 400 when X-Company-Id header is missing", async () => {
			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/generate-qr/inv-1", {
					method: "POST",
				}),
			);

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.code).toBe("COMPANY_SCOPE_REQUIRED");
			expect(db.query.invoices.findFirst).not.toHaveBeenCalled();
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("returns 404 when invoice belongs to different company", async () => {
			vi.mocked(db.query.invoices.findFirst).mockResolvedValueOnce(undefined);

			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/generate-qr/inv-1", {
					method: "POST",
					headers: { "X-Company-Id": "cmp-wrong" },
				}),
			);

			expect(response.status).toBe(404);
			const body = await response.json();
			expect(body.code).toBe("NOT_FOUND");
			expectScopedInvoiceLookup("inv-1", "cmp-wrong");
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("succeeds when X-Company-Id matches invoice companyId", async () => {
			vi.mocked(db.query.invoices.findFirst).mockResolvedValueOnce(
				makeInvoiceFixture("inv-1", "cmp-1"),
			);

			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/generate-qr/inv-1", {
					method: "POST",
					headers: { "X-Company-Id": "cmp-1" },
				}),
			);

			expect(response.status).toBe(200);
			expectScopedInvoiceLookup("inv-1", "cmp-1");
			expect(SunatService.generateInvoiceQR).toHaveBeenCalledTimes(1);
			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});

	describe("public endpoints (no tenant guard needed)", () => {
		it("POST /validate-ruc works without company header", async () => {
			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/validate-ruc", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ruc: "20123456789" }),
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(SunatService.validateRuc).toHaveBeenCalledTimes(1);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("GET /exchange-rate works without company header", async () => {
			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/exchange-rate"),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(SunatService.getExchangeRate).toHaveBeenCalledTimes(1);
			expect(fetchSpy).not.toHaveBeenCalled();
		});

		it("POST /validate-numbering works without company header", async () => {
			const app = new Elysia().use(sunatApiModule);
			const response = await app.handle(
				new Request("http://localhost/api/sunat/validate-numbering", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ series: "F001", correlative: 1 }),
				}),
			);

			expect(response.status).toBe(200);
			const body = await response.json();
			expect(body.success).toBe(true);
			expect(SunatService.validateInvoiceNumbering).toHaveBeenCalledTimes(1);
			expect(fetchSpy).not.toHaveBeenCalled();
		});
	});
});
