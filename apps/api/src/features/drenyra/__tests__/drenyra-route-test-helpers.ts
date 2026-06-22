import { Elysia } from "elysia";
import { expect } from "vitest";
import { drenyraModule } from "../drenyra.routes";

export const commandHeaders = {
	"content-type": "application/json",
	"x-organization-id": "org-route-001",
	"x-company-id": "company-route-001",
	"x-company-ruc": "20123456789",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-route-001",
};

export async function requestJson(
	path: string,
	method: "GET" | "POST" | "PATCH",
	body?: unknown,
	idempotencyKey?: string,
): Promise<Response> {
	const app = new Elysia().use(drenyraModule);
	return app.handle(
		new Request(`http://localhost${path}`, {
			method,
			headers: idempotencyKey
				? { ...commandHeaders, "x-idempotency-key": idempotencyKey }
				: commandHeaders,
			body: body ? JSON.stringify(body) : undefined,
		}),
	);
}

export async function createCase(): Promise<string> {
	const response = await requestJson("/api/drenyra/cases", "POST", {
		type: "MONTHLY_CLOSE",
		title: "Cierre route test",
		description: "Caso fiscal para route test",
		riskLevel: "HIGH",
		riskScore: 71,
	});
	const payload = await response.json();
	expect(response.status).toBe(201);
	expect(payload.success).toBe(true);
	return payload.data.id as string;
}
