import { describe, expect, it } from "vitest";
import { FiscalMemory, FiscalMemoryRevision } from "../index";

const createMemory = () =>
	FiscalMemory.create({
		id: "memory-1",
		tenantId: "tenant-1",
		companyId: "company-1",
		ruc: "20123456789",
		period: "2026-05",
		category: "audit_finding",
		severity: "critical",
		title: "Unsupported fiscal credit",
		summary: "Repeated unsupported credit usage was found.",
		evidenceRefs: ["evidence://audit-1"],
		tags: ["error:UNSUPPORTED_CREDIT"],
		createdBy: "audit-agent",
	});

describe("FiscalMemoryRevision", () => {
	it("preserves previous and next memory values", () => {
		const previous = createMemory();
		const next = previous.withStatus("resolved");
		const revision = FiscalMemoryRevision.create({
			id: "revision-1",
			memoryId: previous.id,
			revisionNumber: 1,
			changedBy: "controller-1",
			changeReason: "Evidence reviewed and remediated",
			previousValue: previous.toJSON(),
			nextValue: next.toJSON(),
			createdAt: new Date("2026-06-01T00:00:00.000Z"),
		});

		expect(revision.previousValue.status).toBe("active");
		expect(revision.nextValue.status).toBe("resolved");
	});
});
