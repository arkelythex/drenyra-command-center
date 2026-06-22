import { beforeEach, describe, expect, it, vi } from "vitest";

const auditGetMock = vi.fn();

vi.mock("@/lib/api", () => ({
	api: {
		api: {
			drenyra: {
				commands: {
					"audit-events": {
						get: (...args: unknown[]) => auditGetMock(...args),
					},
				},
			},
		},
	},
	getGovernanceAuditHeaders: () => ({
		"x-company-id": "company-1",
		"x-user-id": "user-1",
	}),
}));

vi.mock("@/lib/company-context", () => ({
	getCompanyContext: () => ({ ruc: "20601234567" }),
}));

import { listCommandAuditEvents } from "./drenyra-command-audit.api";

describe("drenyra command audit api", () => {
	beforeEach(() => {
		auditGetMock.mockReset();
	});

	it("sends fiscal scope and command capability proof headers", async () => {
		auditGetMock.mockResolvedValue({
			data: {
				success: true,
				data: [
					{
						id: "audit-1",
						eventType: "CAPABILITY_ALLOWED",
						actorId: "user-1",
						message: "Allowed",
						occurredAt: "2026-05-27T00:00:00.000Z",
						metadata: { commandId: "review-sunat" },
					},
				],
			},
			error: null,
		});

		const events = await listCommandAuditEvents({
			eventType: "CAPABILITY_ALLOWED",
		});

		expect(auditGetMock).toHaveBeenCalledWith({
			query: { eventType: "CAPABILITY_ALLOWED" },
			headers: expect.objectContaining({
				"x-company-id": "company-1",
				"x-company-ruc": "20601234567",
				"x-drenyra-capability-grant": "scoped",
				"x-drenyra-redaction-ok": "true",
				"x-fiscal-period": expect.stringMatching(/^\d{4}-\d{2}$/),
				"x-user-id": "user-1",
			}),
		});
		expect(events[0]?.metadata.commandId).toBe("review-sunat");
	});
});
