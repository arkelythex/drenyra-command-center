import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";
import { createApprovalRequestsRoutes } from "../approval-requests.routes";

describe("approval-requests routes", () => {
	it("returns 400 when tenant headers are missing", async () => {
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createApprovalRequestsRoutes(),
		);
		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/approvals"),
		);

		expect(response.status).toBe(400);
	});

	it("returns 404 when submitting vote to unknown request", async () => {
		const service = {
			list: vi.fn(),
			getById: vi.fn(),
			create: vi.fn(),
			getDiffs: vi.fn(),
			getVotes: vi.fn(),
			submitVote: vi.fn().mockResolvedValue(null),
		};
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createApprovalRequestsRoutes(service as never),
		);

		const response = await app.handle(
			new Request(
				"http://localhost/api/fiscal-command-center/approvals/req-1/votes",
				{
					method: "POST",
					headers: {
						"content-type": "application/json",
						"x-organization-id": "org-1",
						"x-company-id": "cmp-1",
						"x-user-id": "usr-1",
						"x-company-ruc": "20123456789",
						"x-fiscal-period": "2026-01",
					},
					body: JSON.stringify({ vote: true }),
				},
			),
		);

		expect(response.status).toBe(404);
		expect(service.submitVote).toHaveBeenCalledOnce();
	});
});
