import { describe, expect, it, vi } from "vitest";
import type { DrenyraFiscalScope } from "@drenyra/domain/drenyra";
import { createInMemoryDrenyraBrainRepository } from "./brain.repository";
import { createDrenyraBrainService } from "./brain.service";

const fiscalScope: DrenyraFiscalScope = {
	organizationId: "org_123",
	companyId: "company_123",
	companyRuc: "20123456786",
	period: "2026-05",
	countryCode: "PE",
};

describe("DrenyraBrainService", () => {
	it("creates a thread scoped to company and RUC with an audit event", async () => {
		const repository = createInMemoryDrenyraBrainRepository();
		const service = createDrenyraBrainService({
			repository,
			now: () => "2026-05-24T12:00:00.000Z",
			id: (prefix) => `${prefix}_123`,
		});

		const thread = await service.createThread({
			title: "Review SIRE mismatch",
			fiscalScope,
			sourceSurface: "cli",
			createdBy: "user_123",
			linkedCaseId: "case_123",
		});
		const events = await repository.listEvents(thread.id, fiscalScope);

		expect(thread.id).toBe("thread_123");
		expect(thread.fiscalScope.companyRuc).toBe("20123456786");
		expect(thread.status).toBe("active");
		expect(events[0]?.type).toBe("thread_created");
		expect(events[0]?.actorId).toBe("user_123");
	});

	it("starts a turn, appends a user_message item and writes audit events", async () => {
		const repository = createInMemoryDrenyraBrainRepository();
		const service = createDrenyraBrainService({
			repository,
			now: () => "2026-05-24T12:00:00.000Z",
			id: (prefix) => `${prefix}_123`,
		});

		const thread = await service.createThread({
			title: "Review SIRE mismatch",
			fiscalScope,
			sourceSurface: "web",
			createdBy: "user_123",
		});

		const turn = await service.startTurn({
			threadId: thread.id,
			prompt: "Review this mismatch",
			fiscalScope,
			sourceSurface: "web",
			createdBy: "user_123",
		});

		const items = await service.listItems({ threadId: thread.id, fiscalScope });
		const events = await service.listEvents({ threadId: thread.id, fiscalScope });

		expect(turn.threadId).toBe(thread.id);
		expect(items[0]?.type).toBe("user_message");
		expect(events.map((event) => event.type)).toEqual(["thread_created", "turn_started", "item_appended"]);
	});
	it("mirrors Brain audit events into Fiscal Truth evidence when bridge is configured", async () => {
		const repository = createInMemoryDrenyraBrainRepository();
		const appendEvent = vi.fn().mockResolvedValue({});
		const service = createDrenyraBrainService({
			repository,
			now: () => "2026-05-24T12:00:00.000Z",
			id: (prefix) => `${prefix}_123`,
			evidenceBridge: { appendEvent },
		});

		const thread = await service.createThread({
			title: "Evidence graph bridge",
			fiscalScope,
			sourceSurface: "api",
			createdBy: "user_123",
		});
		await service.startTurn({
			threadId: thread.id,
			prompt: "Create evidence nodes",
			fiscalScope,
			sourceSurface: "api",
			createdBy: "user_123",
		});

		expect(appendEvent).toHaveBeenCalledTimes(3);
		expect(appendEvent).toHaveBeenLastCalledWith(
			expect.objectContaining({
				type: "item_appended",
				metadata: { itemType: "user_message" },
			}),
		);
	});

	it("fails closed when the Fiscal Truth evidence bridge rejects the scope", async () => {
		const repository = createInMemoryDrenyraBrainRepository();
		const service = createDrenyraBrainService({
			repository,
			now: () => "2026-05-24T12:00:00.000Z",
			id: (prefix) => `${prefix}_123`,
			evidenceBridge: {
				appendEvent: vi.fn().mockRejectedValue(new Error("scope rejected")),
			},
		});

		await expect(
			service.createThread({
				title: "Invalid evidence scope",
				fiscalScope,
				sourceSurface: "api",
				createdBy: "user_123",
			}),
		).rejects.toThrow(/scope rejected/);
	});

});
