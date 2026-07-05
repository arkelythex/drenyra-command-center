import type { EventBusPort } from "@drenyra/infrastructure/events/event.port";
import { describe, expect, it, vi } from "vitest";
import { CashflowRetentionHandler } from "../../application/handlers/cashflow-retention.handler";

describe("CashflowRetentionHandler", () => {
	it("registers subscriptions for the full retention lifecycle", async () => {
		const eventBus = {
			subscribe: vi.fn().mockResolvedValue(() => {}),
		} as unknown as EventBusPort;

		const handler = new CashflowRetentionHandler();
		await handler.registerSubscriptions(eventBus);

		expect(eventBus.subscribe).toHaveBeenCalledTimes(4);
		expect(eventBus.subscribe).toHaveBeenNthCalledWith(
			1,
			"taxation.retention.applied",
			expect.any(Function),
			{
				queue: "cashflow.retention-applied",
				durable: "cashflow-retention-applied",
			},
		);
		expect(eventBus.subscribe).toHaveBeenNthCalledWith(
			2,
			"taxation.retention.declared",
			expect.any(Function),
			{
				queue: "cashflow.retention-declared",
				durable: "cashflow-retention-declared",
			},
		);
		expect(eventBus.subscribe).toHaveBeenNthCalledWith(
			3,
			"taxation.retention.paid",
			expect.any(Function),
			{ queue: "cashflow.retention-paid", durable: "cashflow-retention-paid" },
		);
		expect(eventBus.subscribe).toHaveBeenNthCalledWith(
			4,
			"taxation.retention.cancelled",
			expect.any(Function),
			{
				queue: "cashflow.retention-cancelled",
				durable: "cashflow-retention-cancelled",
			},
		);
	});
});
