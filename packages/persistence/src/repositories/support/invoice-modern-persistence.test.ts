import { describe, expect, it } from "vitest";
import {
	mapInvoiceStatusToModularStatus,
	mapInvoiceStatusToSunatStatus,
	mapModularStatusToInvoiceStatus,
} from "./invoice-modern-persistence";

describe("invoice-modern-persistence", () => {
	it("maps domain invoice states to modular invoice status", () => {
		expect(mapInvoiceStatusToModularStatus("DRAFT")).toBe("DRAFT");
		expect(mapInvoiceStatusToModularStatus("PENDING")).toBe("DRAFT");
		expect(mapInvoiceStatusToModularStatus("SENT")).toBe("SENT");
		expect(mapInvoiceStatusToModularStatus("ACCEPTED")).toBe("SENT");
		expect(mapInvoiceStatusToModularStatus("REJECTED")).toBe("SENT");
		expect(mapInvoiceStatusToModularStatus("CANCELLED")).toBe("CANCELLED");
	});

	it("maps domain invoice states to modular SUNAT status", () => {
		expect(mapInvoiceStatusToSunatStatus("DRAFT")).toBe("DRAFT");
		expect(mapInvoiceStatusToSunatStatus("PENDING")).toBe("DRAFT");
		expect(mapInvoiceStatusToSunatStatus("SENT")).toBe("SUBMITTED");
		expect(mapInvoiceStatusToSunatStatus("ACCEPTED")).toBe("ACCEPTED");
		expect(mapInvoiceStatusToSunatStatus("REJECTED")).toBe("REJECTED");
		expect(mapInvoiceStatusToSunatStatus("CANCELLED")).toBe("ANNULLED");
	});

	it("maps modular read status back to domain invoice status", () => {
		expect(mapModularStatusToInvoiceStatus("DRAFT", "DRAFT")).toBe("DRAFT");
		expect(mapModularStatusToInvoiceStatus("SENT", "SUBMITTED")).toBe("SENT");
		expect(mapModularStatusToInvoiceStatus("SENT", "ACCEPTED")).toBe(
			"ACCEPTED",
		);
		expect(mapModularStatusToInvoiceStatus("SENT", "REJECTED")).toBe(
			"REJECTED",
		);
		expect(mapModularStatusToInvoiceStatus("CANCELLED", "ANNULLED")).toBe(
			"CANCELLED",
		);
	});
});
