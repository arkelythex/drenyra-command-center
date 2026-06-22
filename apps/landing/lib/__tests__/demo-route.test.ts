import { POST } from "@/app/api/demo/route";
import { describe, expect, it } from "vitest";

function requestWithBody(body: unknown): Request {
	return new Request("http://localhost/api/demo", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

const validDemoRequest = {
	company: "Acme SAC",
	email: "founder@example.com",
	message: "Necesito validar el cierre mensual SUNAT.",
	name: "Founder",
	phone: "+51 999 999 999",
	planInterest: "profesional",
	privacyConsent: true,
};

describe("demo request route", () => {
	it("requires privacy consent", async () => {
		const response = await POST(
			requestWithBody({ ...validDemoRequest, privacyConsent: false }),
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Privacy consent is required",
		});
	});

	it("requires a valid email", async () => {
		const response = await POST(
			requestWithBody({ ...validDemoRequest, email: "invalid" }),
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: "Invalid email address" });
	});

	it("accepts a valid demo request without configured delivery locally", async () => {
		const response = await POST(requestWithBody(validDemoRequest));

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			delivery: "not_configured",
			message: "Demo request received",
			success: true,
		});
	});
});
