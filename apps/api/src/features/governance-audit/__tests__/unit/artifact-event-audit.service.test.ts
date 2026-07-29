import { beforeEach, describe, expect, it, vi } from "vitest";
import { ArtifactEventAuditService } from "../../artifact-event-audit.service";

const { insertMock, valuesMock } = vi.hoisted(() => ({
	insertMock: vi.fn(),
	valuesMock: vi.fn(),
}));

vi.mock("@drenyra/persistence/client", () => ({
	db: { insert: insertMock },
}));

function makeInput(overrides = {}) {
	return {
		companyId: "company-1",
		actorUserId: "user-1",
		actionId: "approve artifact",
		createdAt: "2026-05-16T12:00:00.000Z",
		artifactId: "artifact-1",
		artifactType: "sire-export",
		traceId: "trace-1",
		message: "Artifact approved",
		source: "workspace-artifact" as const,
		...overrides,
	};
}

describe("ArtifactEventAuditService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		insertMock.mockReturnValue({ values: valuesMock });
		valuesMock.mockResolvedValue(undefined);
	});

	it("stores normalized action and complete artifact details", async () => {
		const result = await ArtifactEventAuditService.record(makeInput());

		expect(result.eventId).toMatch(/^[0-9a-f-]{36}$/i);
		expect(result.storedAt).toBe("2026-05-16T12:00:00.000Z");
		expect(valuesMock).toHaveBeenCalledWith(
		expect.objectContaining({
			id: result.eventId,
			userId: "user-1",
			action: "APPROVE_ARTIFACT",
			details: expect.objectContaining({
				type: "ARTIFACT_EVENT",
				companyId: "company-1",
				artifactId: "artifact-1",
				createdAt: result.storedAt,
			}),
		}),
	);
	});

	it("falls back to ARTIFACT_EVENT for a blank action", async () => {
		await ArtifactEventAuditService.record(makeInput({ actionId: "   " }));

		expect(valuesMock).toHaveBeenCalledWith(
			expect.objectContaining({ action: "ARTIFACT_EVENT" }),
		);
	});

	it("replaces punctuation and truncates long actions to the column-safe length", async () => {
		const actionId = ` publish/artifact:${"x".repeat(60)} `;
		await ArtifactEventAuditService.record(makeInput({ actionId }));

		const stored = valuesMock.mock.calls[0]?.[0];
		expect(stored.action).toBe(`PUBLISH_ARTIFACT_${"X".repeat(33)}`);
		expect(stored.action).toHaveLength(50);
	});

	it("uses the current time when createdAt is invalid", async () => {
		const before = Date.now();
		const result = await ArtifactEventAuditService.record(
			makeInput({ createdAt: "not-a-date" }),
		);
		const after = Date.now();

		expect(Date.parse(result.storedAt)).toBeGreaterThanOrEqual(before);
		expect(Date.parse(result.storedAt)).toBeLessThanOrEqual(after);
	});
});
