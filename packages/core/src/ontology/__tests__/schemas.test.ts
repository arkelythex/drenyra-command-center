import { describe, expect, it } from "vitest";
import {
	CoreClientSchema,
	CoreContractSchema,
	CoreLocationSchema,
	CoreProductSchema,
} from "../schemas";

const validClient = {
	id: "client_01",
	organizationId: "org_01",
	documentType: "ruc" as const,
	documentNumber: "20123456789",
	businessName: "Test Client",
	isActive: true,
	tags: ["vip"],
	metadata: {},
	createdBy: "user_01",
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

const validProduct = {
	id: "prod_01",
	organizationId: "org_01",
	name: "Consultoría",
	category: "services",
	unitType: "hour" as const,
	currency: "PEN",
	isActive: true,
	metadata: {},
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

const validLocation = {
	id: "loc_01",
	organizationId: "org_01",
	name: "Warehouse A",
	type: "warehouse" as const,
	countryCode: "PE",
	isActive: true,
	metadata: {},
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

const validContract = {
	id: "ctr_01",
	organizationId: "org_01",
	clientId: "client_01",
	contractType: "service" as const,
	status: "draft" as const,
	startDate: new Date("2026-01-01"),
	currency: "PEN",
	metadata: {},
	createdAt: new Date("2026-01-01"),
	updatedAt: new Date("2026-01-01"),
};

describe("CoreClientSchema", () => {
	it("parses a valid client", () => {
		const result = CoreClientSchema.safeParse(validClient);
		expect(result.success).toBe(true);
	});

	it("rejects invalid documentType", () => {
		const result = CoreClientSchema.safeParse({
			...validClient,
			documentType: "ssn",
		});
		expect(result.success).toBe(false);
	});

	it("accepts optional email", () => {
		const result = CoreClientSchema.safeParse({
			...validClient,
			email: "c@example.com",
		});
		expect(result.success).toBe(true);
	});

	it("accepts empty string email", () => {
		const result = CoreClientSchema.safeParse({ ...validClient, email: "" });
		expect(result.success).toBe(true);
	});
});

describe("CoreProductSchema", () => {
	it("parses a valid product", () => {
		const result = CoreProductSchema.safeParse(validProduct);
		expect(result.success).toBe(true);
	});

	it("rejects invalid unitType", () => {
		const result = CoreProductSchema.safeParse({
			...validProduct,
			unitType: "liters",
		});
		expect(result.success).toBe(false);
	});

	it("accepts optional unitPrice", () => {
		const result = CoreProductSchema.safeParse({
			...validProduct,
			unitPrice: 150.0,
		});
		expect(result.success).toBe(true);
	});
});

describe("CoreLocationSchema", () => {
	it("parses a valid location", () => {
		const result = CoreLocationSchema.safeParse(validLocation);
		expect(result.success).toBe(true);
	});

	it("accepts optional coordinates", () => {
		const result = CoreLocationSchema.safeParse({
			...validLocation,
			coordinates: { latitude: -12.046, longitude: -77.042 },
		});
		expect(result.success).toBe(true);
	});

	it("rejects partial coordinates", () => {
		const result = CoreLocationSchema.safeParse({
			...validLocation,
			coordinates: { latitude: -12.046 },
		});
		expect(result.success).toBe(false);
	});
});

describe("CoreContractSchema", () => {
	it("parses a valid contract", () => {
		const result = CoreContractSchema.safeParse(validContract);
		expect(result.success).toBe(true);
	});

	it("rejects invalid status", () => {
		const result = CoreContractSchema.safeParse({
			...validContract,
			status: "deleted",
		});
		expect(result.success).toBe(false);
	});

	it("accepts optional value and endDate", () => {
		const result = CoreContractSchema.safeParse({
			...validContract,
			value: 50000,
			endDate: new Date("2027-01-01"),
		});
		expect(result.success).toBe(true);
	});
});
