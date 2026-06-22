import type { ArkelythexMcpAuditEvent } from "@arkelythex/domain";
import { describe, expect, it, vi } from "vitest";

const insertValues = vi.fn(async (_value: unknown) => undefined);
const insertMock = vi.fn(() => ({ values: insertValues }));
const limitMock = vi.fn(async (_limit: number) => [
	{
		operation: "invoke",
		outcome: "allowed",
		toolName: "drenyra.contract.read",
		organizationId: "org-001",
		companyId: "company-001",
		companyRuc: "20100070970",
		period: "2026-05",
		countryCode: "PE",
		actorId: "user-001",
		redactionStatus: "not_required",
		reason: "ALLOWED",
		occurredAt: new Date("2026-05-26T00:00:00.000Z"),
		metadata: { argumentKeys: [] },
	},
]);
const orderByMock = vi.fn(() => ({ limit: limitMock }));
const whereMock = vi.fn(() => ({ orderBy: orderByMock }));
const fromMock = vi.fn(() => ({ where: whereMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock("../client", () => ({
	db: { insert: insertMock, select: selectMock },
}));

const { PostgresPlatformMcpAuditSink } = await import(
	"./postgres-platform-mcp-audit.repository"
);

const event: ArkelythexMcpAuditEvent = {
	operation: "invoke",
	outcome: "allowed",
	toolName: "drenyra.contract.read",
	scope: {
		organizationId: "org-001",
		companyId: "company-001",
		companyRuc: "20100070970",
		period: "2026-05",
		countryCode: "PE",
		userId: "user-001",
	},
	actorId: "user-001",
	redactionStatus: "not_required",
	reason: "ALLOWED",
	occurredAt: "2026-05-26T00:00:00.000Z",
	metadata: { argumentKeys: [] },
};

describe("PostgresPlatformMcpAuditSink", () => {
	it("persists append-only MCP audit events with full fiscal scope", async () => {
		const sink = new PostgresPlatformMcpAuditSink();

		await sink.append(event);

		expect(insertMock).toHaveBeenCalledTimes(1);
		expect(insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				operation: "invoke",
				outcome: "allowed",
				toolName: "drenyra.contract.read",
				companyId: "company-001",
				companyRuc: "20100070970",
				organizationId: "org-001",
				period: "2026-05",
				actorId: "user-001",
				reason: "ALLOWED",
			}),
		);
	});

	it("lists MCP audit events constrained by fiscal scope", async () => {
		const sink = new PostgresPlatformMcpAuditSink();

		const result = await sink.list({
			scope: event.scope,
			limit: 25,
			outcome: "allowed",
			toolName: "drenyra.contract.read",
		});

		expect(selectMock).toHaveBeenCalledTimes(1);
		expect(limitMock).toHaveBeenCalledWith(25);
		expect(result).toEqual([
			expect.objectContaining({
				operation: "invoke",
				outcome: "allowed",
				toolName: "drenyra.contract.read",
				scope: expect.objectContaining({
					companyRuc: "20100070970",
					period: "2026-05",
				}),
			}),
		]);
	});
});
