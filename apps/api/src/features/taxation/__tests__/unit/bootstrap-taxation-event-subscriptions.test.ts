import type { EventBusPort } from "@arkelythex/infrastructure/events/event.port";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	bootstrapTaxationEventSubscriptions,
	getTaxationEventBootstrapStatus,
} from "../../application/handlers/bootstrap-taxation-event-subscriptions";
import { cashflowRetentionHandler } from "../../application/handlers/cashflow-retention.handler";

describe("bootstrapTaxationEventSubscriptions", () => {
	const originalNatsUrl = process.env.NATS_URL;

	afterEach(() => {
		vi.restoreAllMocks();
		if (originalNatsUrl === undefined) {
			delete process.env.NATS_URL;
		} else {
			process.env.NATS_URL = originalNatsUrl;
		}
	});

	it("skips bootstrap when NATS_URL is not configured and no bus is provided", async () => {
		delete process.env.NATS_URL;
		const registerSpy = vi.spyOn(
			cashflowRetentionHandler,
			"registerSubscriptions",
		);

		await bootstrapTaxationEventSubscriptions();

		expect(registerSpy).not.toHaveBeenCalled();
		expect(getTaxationEventBootstrapStatus()).toEqual({
			status: "not_configured",
		});
	});

	it("registers subscriptions when an event bus is provided", async () => {
		const eventBus = {} as EventBusPort;
		const registerSpy = vi
			.spyOn(cashflowRetentionHandler, "registerSubscriptions")
			.mockResolvedValue(undefined);

		await bootstrapTaxationEventSubscriptions(eventBus);

		expect(registerSpy).toHaveBeenCalledWith(eventBus);
		expect(getTaxationEventBootstrapStatus()).toEqual({ status: "ready" });
	});

	it("swallows registration failures to keep API startup non-blocking", async () => {
		process.env.NATS_URL = "nats://localhost:4222";
		vi.spyOn(
			cashflowRetentionHandler,
			"registerSubscriptions",
		).mockRejectedValue(new Error("nats offline"));

		await expect(
			bootstrapTaxationEventSubscriptions({} as EventBusPort),
		).resolves.toBeUndefined();
		expect(getTaxationEventBootstrapStatus()).toEqual({
			status: "disabled",
			error: "nats offline",
		});
	});
});
