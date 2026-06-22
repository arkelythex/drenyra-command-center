import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl, whatsappBusinessNumber } from "../whatsapp";

describe("whatsapp", () => {
	it("uses Peru Business number 51926437404", () => {
		expect(whatsappBusinessNumber).toBe("51926437404");
	});

	it("builds wa.me link with encoded message", () => {
		const url = buildWhatsAppUrl({ message: "Hola" });
		expect(url).toMatch(/^https:\/\/wa\.me\/51926437404\?text=/);
		expect(url).toContain(encodeURIComponent("Hola"));
	});

	it("rejects placeholder numbers in buildWhatsAppUrl", () => {
		const url = buildWhatsAppUrl({ number: "51999999999" });
		expect(url).toMatch(/^https:\/\/wa\.me\/51926437404\?text=/);
	});
});
