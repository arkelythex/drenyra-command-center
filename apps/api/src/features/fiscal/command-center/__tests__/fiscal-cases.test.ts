import { Elysia } from "elysia";
import { describe, expect, it, vi } from "vitest";
import { createFiscalCasesRoutes } from "../fiscal-cases.routes";

describe("fiscal-cases routes", () => {
	it("returns 400 when tenant headers are missing", async () => {
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createFiscalCasesRoutes(),
		);
		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/cases"),
		);

		expect(response.status).toBe(400);
	});

	it("returns 404 for missing case", async () => {
		const service = {
			list: vi.fn(),
			listSummaries: vi.fn(),
			getById: vi.fn().mockResolvedValue(null),
			create: vi.fn(),
			update: vi.fn(),
			getDocuments: vi.fn(),
			getEvidence: vi.fn(),
		};
		const app = new Elysia({ prefix: "/api/fiscal-command-center" }).use(
			createFiscalCasesRoutes(service as never),
		);

		const response = await app.handle(
			new Request("http://localhost/api/fiscal-command-center/cases/case-1", {
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
		expect(service.getById).toHaveBeenCalledOnce();
	});
});
