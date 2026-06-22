import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";
import { createAuditEventsRoutes } from "../audit-events.routes";
import { computeAuditHash } from "../services/audit-events.service";

describe("audit-events routes", () => {
	it("returns 400 when tenant headers are missing", async () => {
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createAuditEventsRoutes(),
		);
		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/audit"),
		);

		expect(response.status).toBe(400);
	});

	it("returns 404 for unknown audit event", async () => {
		const service = {
			list: vi.fn(),
			getById: vi.fn().mockResolvedValue(null),
			record: vi.fn(),
			verifyChain: vi.fn(),
		};
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createAuditEventsRoutes(service as never),
		);

		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/audit/event-1", {
				headers: {
					"x-organization-id": "org-1",
					"x-company-id": "cmp-1",
					"x-user-id": "usr-1",
					"x-company-ruc": "20123456789",
					"x-fiscal-period": "2026-01",
				},
			}),
		);

		expect(response.status).toBe(404);
	});

	it("computes deterministic hash values", () => {
		const h1 = computeAuditHash({
			previousHash: null,
			eventType: "created",
			entityType: "case",
			entityId: "c1",
			action: "create",
			actorId: "u1",
			changes: { b: 2, a: 1 },
			occurredAt: "2026-01-01T00:00:00.000Z",
		});
		const h2 = computeAuditHash({
			previousHash: null,
			eventType: "created",
			entityType: "case",
			entityId: "c1",
			action: "create",
			actorId: "u1",
			changes: { a: 1, b: 2 },
			occurredAt: "2026-01-01T00:00:00.000Z",
		});

		expect(h1).toBe(h2);
		expect(h1).toHaveLength(64);
	});
});
