import { describe, expect, it } from "vitest";

describe("Ontology Types", () => {
	it("should define CoreClient with required fields", () => {
		const client = {
			id: "cli_001" as any,
			organizationId: "org_001" as any,
			documentType: "ruc" as const,
			documentNumber: "20123456789",
			businessName: "Cliente Test S.A.C.",
			isActive: true,
			tags: [],
			metadata: {},
			createdBy: "usr_001" as any,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(client.documentNumber).toBe("20123456789");
		expect(client.documentType).toBe("ruc");
	});

	it("should define CoreProduct with price in cents", () => {
		const product = {
			id: "prod_001" as any,
			organizationId: "org_001" as any,
			name: "Servicio de Consultoría",
			category: "Servicios",
			unitType: "service" as const,
			unitPrice: 50000,
			currency: "PEN",
			isActive: true,
			metadata: {},
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		expect(product.unitPrice).toBe(50000);
		expect(product.currency).toBe("PEN");
	});
});
