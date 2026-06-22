import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraModule } from "../drenyra.routes";

const headers = {
	"content-type": "application/json",
	"x-organization-id": "org-inspect-001",
	"x-company-id": "company-inspect-001",
	"x-company-ruc": "20100070970",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-inspect-001",
	"x-drenyra-capability-grant": "drenyra.fiscal-work.inspect",
};

async function createInspectableCase(): Promise<string> {
	const app = new Elysia().use(drenyraModule);
	const response = await app.handle(
		new Request("http://localhost/api/drenyra/cases", {
			method: "POST",
			headers,
			body: JSON.stringify({
				type: "SIRE_REVIEW",
				title: "Fiscal work inspect route",
				description: "Caso fiscal para contrato compartido",
			}),
		}),
	);
	const payload = await response.json();
	expect(response.status).toBe(201);
	return payload.data.id as string;
}

describe("Drenyra fiscal work inspect route", () => {
	it("returns a shared CLI/Web inspect envelope", async () => {
		const id = await createInspectableCase();
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request(`http://localhost/api/drenyra/fiscal-work/${id}/inspect`, { headers }),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.status).toBe("success");
		expect(payload.reasonCode).toBe("OK");
		expect(payload.data.case.id).toBe(id);
		expect(payload.summary).toContain("Fiscal work inspect route");
	});

	it("denies inspection without capability grant", async () => {
		const id = await createInspectableCase();
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request(`http://localhost/api/drenyra/fiscal-work/${id}/inspect`, {
				headers: { ...headers, "x-drenyra-capability-grant": "" },
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.status).toBe("denied");
		expect(payload.reasonCode).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.data).toBeUndefined();
	});

	it("fails with not_found when scope does not match the case RUC", async () => {
		const id = await createInspectableCase();
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request(`http://localhost/api/drenyra/fiscal-work/${id}/inspect`, {
				headers: { ...headers, "x-company-ruc": "20100070971" },
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.status).toBe("not_found");
		expect(payload.reasonCode).toBe("NOT_FOUND");
	});
});
