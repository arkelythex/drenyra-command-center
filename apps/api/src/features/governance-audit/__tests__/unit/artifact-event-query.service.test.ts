import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactEventQueryService } from "../../artifact-event-query.service";

const { findManyMock } = vi.hoisted(() => ({ findManyMock: vi.fn() }));

vi.mock("@drenyra/persistence/client", () => ({
	db: { query: { authAuditLogs: { findMany: findManyMock } } },
}));

function makeRow(overrides = {}) {
	return {
		id: "event-1",
		userId: "user-1",
		timestamp: new Date("2026-05-16T12:00:00.000Z"),
		details: {
			type: "ARTIFACT_EVENT",
			source: "workspace-artifact",
			companyId: "company-1",
			actionId: "approve-artifact",
			createdAt: "2026-05-16T12:01:00.000Z",
			artifactId: "artifact-1",
			artifactType: "sire-export",
			traceId: "trace-1",
			message: "Artifact approved",
		},
		...overrides,
	};
}

describe("ArtifactEventQueryService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		findManyMock.mockResolvedValue([]);
	});

	it("discards non-artifact and incomplete audit payloads", async () => {
		findManyMock.mockResolvedValueOnce([
			makeRow({ details: { type: "AUTH_LOGIN" } }),
			makeRow({ id: "missing-message", details: { type: "ARTIFACT_EVENT", companyId: "company-1", artifactId: "a", artifactType: "type", traceId: "t" } }),
			makeRow(),
		]);

		const result = await ArtifactEventQueryService.list({ companyId: "company-1" });

		expect(result.items.map((item) => item.id)).toEqual(["event-1"]);
	});

	it("uses stable defaults for blank action and createdAt values", async () => {
		findManyMock.mockResolvedValueOnce([
			makeRow({
				details: { ...makeRow().details, actionId: "  ", createdAt: " " },
			}),
		]);

		const result = await ArtifactEventQueryService.list({ companyId: "company-1" });

		expect(result.items[0]).toMatchObject({
			actionId: "artifact-event",
			createdAt: "2026-05-16T12:00:00.000Z",
		});
	});

	it("applies all optional filters cumulatively", async () => {
		findManyMock.mockResolvedValueOnce([
			makeRow(),
			makeRow({ id: "wrong-action", details: { ...makeRow().details, actionId: "reject-artifact" } }),
			makeRow({ id: "wrong-type", details: { ...makeRow().details, artifactType: "invoice" } }),
		]);

		const result = await ArtifactEventQueryService.list({
			companyId: "company-1",
			traceId: "trace-1",
			artifactType: "sire-export",
			actionId: "approve-artifact",
		});

		expect(result.items.map((item) => item.id)).toEqual(["event-1"]);
	});

	it("clamps invalid pagination values and pages filtered results", async () => {
		findManyMock.mockResolvedValue(
			["a", "b", "c"].map((id) => makeRow({ id })),
		);

		const defaults = await ArtifactEventQueryService.list({
			companyId: "company-1",
			limit: 0,
			offset: -1,
		});
		const page = await ArtifactEventQueryService.list({
			companyId: "company-1",
			limit: 1.9,
			offset: 1.8,
		});

		expect(defaults).toMatchObject({ total: 3, limit: 25, offset: 0 });
		expect(page).toMatchObject({ total: 3, limit: 1, offset: 1 });
		expect(page.items.map((item) => item.id)).toEqual(["b"]);
	});
});
