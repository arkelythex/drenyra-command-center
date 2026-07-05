import { describe, expect, it, vi } from "vitest";
import { EVIDENCE_NODE_KIND } from "@drenyra/domain";
import type { DrenyraBrainEvent } from "@drenyra/domain/drenyra";
import {
	createDrenyraBrainEvidenceBridge,
	toFiscalTruthScope,
} from "./brain-evidence-bridge";

const baseEvent: DrenyraBrainEvent = {
	id: "event-001",
	threadId: "thread-001",
	turnId: "turn-001",
	itemId: "item-001",
	fiscalScope: {
		organizationId: "10",
		companyId: "company-001",
		companyRuc: "20100070970",
		period: "2026-05",
		countryCode: "PE",
	},
	type: "item_appended",
	sequence: 2,
	actorId: "user-001",
	sourceSurface: "web",
	createdAt: "2026-05-26T00:00:00.000Z",
	metadata: { itemType: "user_message" },
};

describe("Drenyra Brain evidence bridge", () => {
	it("maps Drenyra scope to Fiscal Truth scope and preserves period in metadata", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const appendEdge = vi.fn().mockResolvedValue(undefined);
		const bridge = createDrenyraBrainEvidenceBridge({
			appendNode,
			appendEdge,
			digest: async () => "hash-001",
		});

		const node = await bridge.appendEvent(baseEvent);

		expect(node.nodeKind).toBe(EVIDENCE_NODE_KIND.SOURCE_INPUT);
		expect(node.scope.organizationId).toBe(10);
		expect(node.scope.period).toBe("2026-05");
		expect(node.metadata.period).toBe("2026-05");
		expect(appendNode).toHaveBeenCalledWith(node);
		expect(appendEdge).toHaveBeenCalledWith(
			expect.objectContaining({
				fromNodeId: "drenyra-brain-event:event-001",
				toNodeId: "drenyra-brain-thread:thread-001",
			}),
		);
	});

	it("stores thread creation as the graph root without a derived edge", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const appendEdge = vi.fn().mockResolvedValue(undefined);
		const bridge = createDrenyraBrainEvidenceBridge({
			appendNode,
			appendEdge,
			digest: async () => "hash-thread",
		});

		const node = await bridge.appendEvent({
			...baseEvent,
			id: "event-thread",
			turnId: undefined,
			itemId: undefined,
			type: "thread_created",
			sequence: 1,
			metadata: {},
		});

		expect(node.nodeId).toBe("drenyra-brain-thread:thread-001");
		expect(appendEdge).not.toHaveBeenCalled();
	});

	it("fails closed when fiscal period is missing or malformed", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const bridge = createDrenyraBrainEvidenceBridge({
			appendNode,
			appendEdge: vi.fn().mockResolvedValue(undefined),
			digest: async () => "hash-period",
		});

		await expect(
			bridge.appendEvent({
				...baseEvent,
				fiscalScope: { ...baseEvent.fiscalScope, period: "2026-13" },
			}),
		).rejects.toThrow(/scope/i);
		expect(appendNode).not.toHaveBeenCalled();
	});

	it("marks assistant/agent output as advisory evidence only", async () => {
		const bridge = createDrenyraBrainEvidenceBridge({
			appendNode: vi.fn().mockResolvedValue(undefined),
			appendEdge: vi.fn().mockResolvedValue(undefined),
			digest: async () => "hash-ai",
		});

		const node = await bridge.appendEvent({
			...baseEvent,
			metadata: { itemType: "assistant_message" },
		});

		expect(node.nodeKind).toBe(EVIDENCE_NODE_KIND.AI_SUGGESTION);
	});

	it("fails closed for invalid RUC checksum before appending evidence", async () => {
		const appendNode = vi.fn().mockResolvedValue(undefined);
		const bridge = createDrenyraBrainEvidenceBridge({
			appendNode,
			appendEdge: vi.fn().mockResolvedValue(undefined),
			digest: async () => "hash-invalid",
		});

		await expect(
			bridge.appendEvent({
				...baseEvent,
				fiscalScope: { ...baseEvent.fiscalScope, companyRuc: "20100070971" },
			}),
		).rejects.toThrow(/scope/i);
		expect(appendNode).not.toHaveBeenCalled();
	});

	it("keeps non-numeric organization ids in metadata while using null truth org id", () => {
		expect(
			toFiscalTruthScope({
				...baseEvent.fiscalScope,
				organizationId: "org-001",
			}).organizationId,
		).toBeNull();
	});
});
