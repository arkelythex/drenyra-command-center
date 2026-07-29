import { describe, expect, it } from "vitest";
import { diffsService } from "../../diffs.service";

describe("DiffsService", () => {
	const [diff] = diffsService.listDiffs(undefined).data;

	it("lists the seeded reviewable accounting diff", () => {
		expect(diff).toMatchObject({ id: expect.any(String), status: "PENDING", changesCount: 3 });
	});

	it("filters diffs by status", () => {
		expect(diffsService.listDiffs(undefined, { status: "PENDING" }).data).toHaveLength(1);
		expect(diffsService.listDiffs(undefined, { status: "APPROVED" }).data).toEqual([]);
	});

	it("returns details including the evidence and change history", () => {
		expect(diffsService.getDiff(undefined, diff.id)).toMatchObject({ id: diff.id, evidenceIds: ["xml-001", "pdf-001", "cdr-001"], changes: expect.any(Array), decisions: [] });
	});

	it("rejects lookup of a missing diff", () => {
		expect(() => diffsService.getDiff(undefined, "missing")).toThrow(/Diff not found/);
	});

	it("records an information request as a decision", () => {
		expect(diffsService.requestInfo(undefined, diff.id, "Please attach the invoice")).toEqual({ success: true });
		expect(diffsService.getDiff(undefined, diff.id).decisions).toContainEqual(expect.objectContaining({ action: "NEEDS_INFO", comment: "Please attach the invoice" }));
	});

	it("counts failed IDs during batch approval without aborting valid IDs", () => {
		const result = diffsService.batchApprove(undefined, ["missing"]);
		expect(result).toEqual({ approved: 0, failed: 1 });
	});
});
