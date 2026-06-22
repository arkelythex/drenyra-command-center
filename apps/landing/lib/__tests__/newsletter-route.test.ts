import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/newsletter/route";

function requestWithBody(body: unknown): Request {
	return new Request("http://localhost/api/newsletter", {
		method: "POST",
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
	});
}

describe("newsletter route", () => {
	it("requires privacy consent", async () => {
		const response = await POST(
			requestWithBody({ email: "test@example.com", newsletterConsent: false }),
		);

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			error: "Newsletter consent is required",
		});
	});

	it("accepts valid email with privacy consent", async () => {
		const response = await POST(
			requestWithBody({ email: "test@example.com", newsletterConsent: true }),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			success: true,
			message: "Successfully subscribed to newsletter",
			delivery: "not_configured",
		});
	});
});
