/**
 * SSE tenant isolation tests.
 *
 * Validates that event bus subscribers only receive events from their own organization.
 * RED phase: these tests fail because tenant filtering is not yet implemented.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { DomainEvent } from "../event.port";
import { InMemoryEventBus } from "../in-memory-event-bus";

describe("InMemoryEventBus — tenant isolation", () => {
	let bus: InMemoryEventBus;

	beforeEach(async () => {
		bus = new InMemoryEventBus();
		await bus.connect();
	});

	// ── Same-org: subscriber receives events ────────────────────────────

	it("delivers events to subscribers in the same organization", async () => {
		const events: DomainEvent[] = [];
		await bus.subscribe(
			"agent.task.started",
			(event) => {
				events.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.publish(
			"agent.task.started",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);

		expect(events).toHaveLength(1);
	});

	// ── Cross-org: subscriber does NOT receive events ───────────────────

	it("does NOT deliver events to subscribers in a different organization", async () => {
		const eventsA: DomainEvent[] = [];
		const eventsB: DomainEvent[] = [];

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				eventsA.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				eventsB.push(event as DomainEvent);
			},
			{ organizationId: "org-b" },
		);

		// Publish event for org-a
		await bus.publish(
			"agent.task.started",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);

		expect(eventsA).toHaveLength(1);
		expect(eventsB).toHaveLength(0);
	});

	// ── No org filter: backward compatible (receives all) ───────────────

	it("delivers events to subscribers without organization filter (backward compatible)", async () => {
		const events: DomainEvent[] = [];
		await bus.subscribe("agent.task.started", (event) => {
			events.push(event as DomainEvent);
		});

		await bus.publish(
			"agent.task.started",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);

		expect(events).toHaveLength(1);
	});

	// ── Event without org metadata: delivered to all ────────────────────

	it("delivers events without organizationId to all subscribers", async () => {
		const eventsA: DomainEvent[] = [];
		const eventsB: DomainEvent[] = [];

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				eventsA.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				eventsB.push(event as DomainEvent);
			},
			{ organizationId: "org-b" },
		);

		// Publish event WITHOUT organizationId
		await bus.publish("agent.task.started", { taskId: "t1" });

		// Both should receive it (no org filter = broadcast)
		expect(eventsA).toHaveLength(1);
		expect(eventsB).toHaveLength(1);
	});

	// ── subscribeMultiple respects org filter ───────────────────────────

	it("respects organization filter in subscribeMultiple", async () => {
		const eventsA: DomainEvent[] = [];
		const eventsB: DomainEvent[] = [];

		await bus.subscribeMultiple(
			["agent.task.started", "agent.task.completed"],
			(event) => {
				eventsA.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.subscribeMultiple(
			["agent.task.started", "agent.task.completed"],
			(event) => {
				eventsB.push(event as DomainEvent);
			},
			{ organizationId: "org-b" },
		);

		await bus.publish(
			"agent.task.started",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);
		await bus.publish(
			"agent.task.completed",
			{ taskId: "t2" },
			{
				organizationId: "org-b",
			},
		);

		expect(eventsA).toHaveLength(1);
		expect(eventsB).toHaveLength(1);
	});

	// ── Multi-org subscriber ────────────────────────────────────────────

	it("handles multiple subscribers in the same organization", async () => {
		const events: DomainEvent[] = [];

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				events.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				events.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.publish(
			"agent.task.started",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);

		expect(events).toHaveLength(2);
	});

	// ── Event type filtering still works with org filter ────────────────

	it("only delivers matching event types within org filter", async () => {
		const events: DomainEvent[] = [];

		await bus.subscribe(
			"agent.task.started",
			(event) => {
				events.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.publish(
			"agent.task.completed",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);

		expect(events).toHaveLength(0);
	});

	// ── Disconnect clears tenant subscriptions ──────────────────────────

	it("clears tenant subscriptions on disconnect", async () => {
		const events: DomainEvent[] = [];
		await bus.subscribe(
			"agent.task.started",
			(event) => {
				events.push(event as DomainEvent);
			},
			{ organizationId: "org-a" },
		);

		await bus.disconnect();

		// Reconnect with a fresh bus
		const newBus = new InMemoryEventBus();
		await newBus.connect();
		await newBus.publish(
			"agent.task.started",
			{ taskId: "t1" },
			{
				organizationId: "org-a",
			},
		);

		// Old subscription should be gone
		expect(events).toHaveLength(0);
	});
});
