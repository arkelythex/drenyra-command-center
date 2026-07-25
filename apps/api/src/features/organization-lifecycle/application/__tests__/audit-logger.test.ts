import { describe, expect, it, vi } from "vitest";
import { ConsoleAuditLogger, SpyAuditLogger } from "../audit-logger";
import type { AuditEvent } from "../types";

describe("ConsoleAuditLogger", () => {
	it("logs a structured JSON audit event to stdout", () => {
		const logger = new ConsoleAuditLogger();
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});

		const event: AuditEvent = {
			organizationId: "org-1",
			tenantId: "firm-A",
			actorId: "user-1",
			fromStatus: null,
			toStatus: "ACTIVE",
			reason: null,
			timestamp: "2026-01-01T00:00:00.000Z",
		};

		logger.log(event);

		expect(spy).toHaveBeenCalledTimes(1);
		const logged = JSON.parse(spy.mock.calls[0][0] as string);
		expect(logged).toEqual(event);

		spy.mockRestore();
	});

	it("logs a suspension event with reason", () => {
		const logger = new ConsoleAuditLogger();
		const spy = vi.spyOn(console, "log").mockImplementation(() => {});

		const event: AuditEvent = {
			organizationId: "org-2",
			tenantId: "firm-A",
			actorId: "user-1",
			fromStatus: "ACTIVE",
			toStatus: "SUSPENDED",
			reason: "Non-payment",
			timestamp: "2026-02-01T00:00:00.000Z",
		};

		logger.log(event);

		expect(spy).toHaveBeenCalledTimes(1);
		const logged = JSON.parse(spy.mock.calls[0][0] as string);
		expect(logged.reason).toBe("Non-payment");
		expect(logged.fromStatus).toBe("ACTIVE");
		expect(logged.toStatus).toBe("SUSPENDED");

		spy.mockRestore();
	});
});

describe("SpyAuditLogger", () => {
	it("records events in memory and exposes them via getEvents()", () => {
		const logger = new SpyAuditLogger();

		const event1: AuditEvent = {
			organizationId: "org-1",
			tenantId: "firm-A",
			actorId: "user-1",
			fromStatus: null,
			toStatus: "ACTIVE",
			reason: null,
			timestamp: "2026-01-01T00:00:00.000Z",
		};

		const event2: AuditEvent = {
			organizationId: "org-2",
			tenantId: "firm-B",
			actorId: "user-2",
			fromStatus: "ACTIVE",
			toStatus: "SUSPENDED",
			reason: "Violation",
			timestamp: "2026-01-02T00:00:00.000Z",
		};

		logger.log(event1);
		logger.log(event2);

		const events = logger.getEvents();
		expect(events).toHaveLength(2);
		expect(events[0]).toEqual(event1);
		expect(events[1]).toEqual(event2);
	});

	it("starts with an empty event list", () => {
		const logger = new SpyAuditLogger();
		expect(logger.getEvents()).toHaveLength(0);
	});

	it("clear() empties the recorded events", () => {
		const logger = new SpyAuditLogger();
		logger.log({
			organizationId: "org-1",
			tenantId: "firm-A",
			actorId: "user-1",
			fromStatus: null,
			toStatus: "ACTIVE",
			reason: null,
			timestamp: "2026-01-01T00:00:00.000Z",
		});

		expect(logger.getEvents()).toHaveLength(1);

		logger.clear();
		expect(logger.getEvents()).toHaveLength(0);
	});
});
