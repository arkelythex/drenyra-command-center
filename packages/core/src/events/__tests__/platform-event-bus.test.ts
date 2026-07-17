import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type PlatformEvent, PlatformEventBus } from "../platform-event-bus";

describe("PlatformEventBus", () => {
	let bus: PlatformEventBus;

	beforeEach(() => {
		bus = new PlatformEventBus();
	});

	afterEach(() => {
		bus.disconnect();
	});

	it("should publish and receive domain-agnostic events", async () => {
		const received: PlatformEvent[] = [];
		await bus.subscribe("client.registered" as any, (event) => {
			received.push(event);
		});
		await bus.publish("client.registered" as any, {
			clientId: "cli_001",
			businessName: "Cliente Test",
		});
		expect(received).toHaveLength(1);
		expect(received[0].type).toBe("client.registered");
		expect(received[0].source).toBe("core");
	});

	it("should support wildcard subscribers", async () => {
		const received: PlatformEvent[] = [];
		const unsub = bus.subscribeAll((event) => {
			received.push(event);
		});
		await bus.publish("drenyra.invoice.created" as any, {
			invoiceId: "inv_001",
		});
		await bus.publish("agricultura.crop.harvested" as any, {
			cropId: "crp_001",
		});
		expect(received).toHaveLength(2);
		unsub();
		await bus.publish("otro.event" as any, {});
		expect(received).toHaveLength(2);
	});

	it("should return unsubscriber from subscribe", async () => {
		const received: PlatformEvent[] = [];
		const unsub = await bus.subscribe("client.registered" as any, (event) => {
			received.push(event);
		});
		await bus.publish("client.registered" as any, {});
		expect(received).toHaveLength(1);
		unsub();
		await bus.publish("client.registered" as any, {});
		expect(received).toHaveLength(1);
	});

	it("should support cross-domain events with correlationId", async () => {
		const received: PlatformEvent[] = [];
		await bus.subscribe("payment.received" as any, (event) => {
			received.push(event);
		});
		const correlationId = crypto.randomUUID();
		await bus.publish(
			"payment.received" as any,
			{ amount: 1000, currency: "PEN" },
			{
				source: "drenyra",
				correlationId,
			},
		);
		expect(received[0].source).toBe("drenyra");
		expect(received[0].correlationId).toBe(correlationId);
	});

	it("should handle multiple subscribers for same event", async () => {
		let countA = 0;
		let countB = 0;
		await bus.subscribe("client.registered" as any, async () => {
			countA++;
		});
		await bus.subscribe("client.registered" as any, async () => {
			countB++;
		});
		await bus.publish("client.registered" as any, {});
		expect(countA).toBe(1);
		expect(countB).toBe(1);
	});
});
