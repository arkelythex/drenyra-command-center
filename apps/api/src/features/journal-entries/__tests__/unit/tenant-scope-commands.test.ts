/**
 * Journal-entries commands/queries — tenant scope propagation.
 *
 * Every id-addressed operation must carry the caller's TenantScope down to the
 * use case or repository, so an entry id from another company is never touched.
 */

import type { TenantScope } from "@drenyra/domain/scope";
import { beforeEach, describe, expect, it, vi } from "vitest";

const scope: TenantScope = { organizationId: "1", companyId: "company-a1" };

const executeSpy = vi.fn();
const repo = { findById: vi.fn(), delete: vi.fn() };

vi.mock("@drenyra/application/use-cases/journal", () => {
	class UseCase {
		execute = executeSpy;
	}
	return {
		CreateJournalEntryUseCase: UseCase,
		UpdateJournalEntryUseCase: UseCase,
		UpdateJournalEntryStatusUseCase: UseCase,
		DeleteJournalEntryUseCase: UseCase,
	};
});

vi.mock("../../application/_helpers", () => ({
	journalRepository: repo,
	periodRepository: {},
	accountService: {},
}));

const { deleteJournalEntry } = await import(
	"../../application/commands/delete-journal-entry"
);
const { updateJournalEntry } = await import(
	"../../application/commands/update-journal-entry"
);
const { updateJournalEntryStatus } = await import(
	"../../application/commands/update-status"
);
const { approveJournalEntryProposal, rejectJournalEntryProposal } =
	await import("../../application/commands/approve-reject-proposal");
const { getJournalEntry } = await import(
	"../../application/queries/get-journal-entry"
);

describe("journal-entries — tenant scope propagation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		executeSpy.mockResolvedValue({ toJSON: () => ({ id: "e1" }) });
	});

	it("delete passes the scope to the use case", async () => {
		await deleteJournalEntry(scope, "e1");
		expect(executeSpy).toHaveBeenCalledWith(scope, "e1");
	});

	it("update passes the scope before the id", async () => {
		await updateJournalEntry(scope, "e1", { gloss: "x" });
		expect(executeSpy.mock.calls[0]?.[0]).toEqual(scope);
		expect(executeSpy.mock.calls[0]?.[1]).toBe("e1");
	});

	it("status change passes the scope, id, status and actor", async () => {
		await updateJournalEntryStatus(scope, "e1", "declarado", "u1");
		expect(executeSpy).toHaveBeenCalledWith(scope, "e1", "declarado", "u1");
	});

	it("approve passes the scope to the status use case", async () => {
		await approveJournalEntryProposal(scope, "e1", "u1");
		expect(executeSpy).toHaveBeenCalledWith(scope, "e1", "mayorizado", "u1");
	});

	it("get reads inside the scope and returns null for foreign ids", async () => {
		repo.findById.mockResolvedValue(null);
		await expect(getJournalEntry(scope, { id: "foreign" })).resolves.toBeNull();
		expect(repo.findById).toHaveBeenCalledWith(scope, "foreign");
	});

	it("reject does not delete an entry the scope cannot see", async () => {
		repo.findById.mockResolvedValue(null);
		await expect(rejectJournalEntryProposal(scope, "foreign")).rejects.toThrow(
			"Asiento no encontrado",
		);
		expect(repo.delete).not.toHaveBeenCalled();
	});

	it("reject deletes inside the scope when the entry is a draft", async () => {
		repo.findById.mockResolvedValue({ status: "borrador" });
		await rejectJournalEntryProposal(scope, "e1", "u1");
		expect(repo.delete).toHaveBeenCalledWith(scope, "e1");
	});
});
