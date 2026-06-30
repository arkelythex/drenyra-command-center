/**
 * Domain Events — Unit Tests for Civic Vertical
 *
 * Tests all four civic domain events:
 * - ActValidatedEvent
 * - FraudDetectedEvent
 * - AuditCompletedEvent
 * - CaseEscalatedEvent
 */

import { DomainEvent } from "@arkelythex/domain";
import { beforeEach, describe, expect, it } from "vitest";
import {
	ActValidatedEvent,
	AuditCompletedEvent,
	CaseEscalatedEvent,
	FraudDetectedEvent,
} from "../event/domain-events";
import type { EventEmitter } from "../event/event-emitter";
import {
	FraudIndicator,
	FraudIndicatorType,
	FraudSeverity,
} from "../value-object/FraudIndicator";

// ===== ACT VALIDATED EVENT =====

describe("ActValidatedEvent", () => {
	let event: ActValidatedEvent;

	beforeEach(() => {
		event = new ActValidatedEvent(
			"act-123",
			"act-123",
			"validator-1",
			"approved",
		);
	});

	describe("constructor", () => {
		it("should initialize with all properties", () => {
			expect(event.aggregateId).toBe("act-123");
			expect(event.actId).toBe("act-123");
			expect(event.validatorId).toBe("validator-1");
			expect(event.result).toBe("approved");
		});

		it("should inherit from DomainEvent", () => {
			expect(event).toBeInstanceOf(DomainEvent);
			expect(event.eventId).toBeDefined();
			expect(event.occurredOn).toBeInstanceOf(Date);
		});

		it("should accept rejected result", () => {
			const rejected = new ActValidatedEvent(
				"act-456",
				"act-456",
				"validator-2",
				"rejected",
			);
			expect(rejected.result).toBe("rejected");
		});

		it("should accept needs-review result", () => {
			const needsReview = new ActValidatedEvent(
				"act-789",
				"act-789",
				"validator-3",
				"needs-review",
			);
			expect(needsReview.result).toBe("needs-review");
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(event.eventName).toBe("civic.act.validated");
		});
	});

	describe("getPayload", () => {
		it("should return complete payload", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = event.getPayload();

			expect(payload).toEqual({
				aggregateId: "act-123",
				aggregateType: "ElectoralAct",
				actId: "act-123",
				validatorId: "validator-1",
				result: "approved",
			});
		});
	});

	describe("toJSON", () => {
		it("should serialize complete event", () => {
			const json = event.toJSON();

			expect(json.eventName).toBe("civic.act.validated");
			expect(json.aggregateId).toBe("act-123");
			expect(json.aggregateType).toBe("ElectoralAct");
			expect(json.actId).toBe("act-123");
			expect(json.validatorId).toBe("validator-1");
			expect(json.result).toBe("approved");
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should be JSON serializable", () => {
			const json = event.toJSON();
			const jsonString = JSON.stringify(json);

			expect(() => JSON.parse(jsonString)).not.toThrow();
			const parsed = JSON.parse(jsonString);
			expect(parsed.actId).toBe("act-123");
		});
	});
});

// ===== FRAUD DETECTED EVENT =====

describe("FraudDetectedEvent", () => {
	let indicator: FraudIndicator;
	let event: FraudDetectedEvent;

	beforeEach(() => {
		indicator = FraudIndicator.create({
			type: FraudIndicatorType.VOTE_PATTERN_ANOMALY,
			severity: FraudSeverity.HIGH,
			description: "Patrón sospechoso en mesa 123",
			evidence: ["ev-001"],
			detectedAt: new Date("2026-04-12"),
		});

		event = new FraudDetectedEvent(
			"election-1",
			"election-1",
			"act-123",
			indicator,
			"HIGH",
		);
	});

	describe("constructor", () => {
		it("should initialize with all properties", () => {
			expect(event.aggregateId).toBe("election-1");
			expect(event.electionId).toBe("election-1");
			expect(event.actId).toBe("act-123");
			expect(event.indicator).toBe(indicator);
			expect(event.severity).toBe("HIGH");
		});

		it("should inherit from DomainEvent", () => {
			expect(event).toBeInstanceOf(DomainEvent);
			expect(event.eventId).toBeDefined();
			expect(event.occurredOn).toBeInstanceOf(Date);
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(event.eventName).toBe("civic.fraud.detected");
		});
	});

	describe("getPayload", () => {
		it("should return complete payload with serialized indicator", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = event.getPayload();

			expect(payload.aggregateId).toBe("election-1");
			expect(payload.aggregateType).toBe("Election");
			expect(payload.electionId).toBe("election-1");
			expect(payload.actId).toBe("act-123");
			expect(payload.severity).toBe("HIGH");
			expect(payload.indicator).toEqual(indicator.toJSON());
		});
	});

	describe("toJSON", () => {
		it("should serialize complete event", () => {
			const json = event.toJSON();

			expect(json.eventName).toBe("civic.fraud.detected");
			expect(json.aggregateId).toBe("election-1");
			expect(json.aggregateType).toBe("Election");
			expect(json.electionId).toBe("election-1");
			expect(json.actId).toBe("act-123");
			expect(json.severity).toBe("HIGH");
			expect(json.indicator).toEqual(indicator.toJSON());
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should be JSON serializable", () => {
			const json = event.toJSON();
			const jsonString = JSON.stringify(json);

			expect(() => JSON.parse(jsonString)).not.toThrow();
			const parsed = JSON.parse(jsonString);
			expect(parsed.electionId).toBe("election-1");
			expect(parsed.indicator.type).toBe("VOTE_PATTERN_ANOMALY");
		});
	});
});

// ===== AUDIT COMPLETED EVENT =====

describe("AuditCompletedEvent", () => {
	let event: AuditCompletedEvent;

	beforeEach(() => {
		event = new AuditCompletedEvent("audit-1", "act-123", "audit-1", [
			"Firma coincide",
			"Huella digital verificada",
			"Sellos intactos",
		]);
	});

	describe("constructor", () => {
		it("should initialize with all properties", () => {
			expect(event.aggregateId).toBe("audit-1");
			expect(event.actId).toBe("act-123");
			expect(event.auditId).toBe("audit-1");
			expect(event.findings).toEqual([
				"Firma coincide",
				"Huella digital verificada",
				"Sellos intactos",
			]);
		});

		it("should inherit from DomainEvent", () => {
			expect(event).toBeInstanceOf(DomainEvent);
			expect(event.eventId).toBeDefined();
			expect(event.occurredOn).toBeInstanceOf(Date);
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(event.eventName).toBe("civic.audit.completed");
		});
	});

	describe("getPayload", () => {
		it("should return complete payload", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = event.getPayload();

			expect(payload).toEqual({
				aggregateId: "audit-1",
				aggregateType: "AuditTrail",
				actId: "act-123",
				auditId: "audit-1",
				findings: [
					"Firma coincide",
					"Huella digital verificada",
					"Sellos intactos",
				],
			});
		});
	});

	describe("toJSON", () => {
		it("should serialize complete event", () => {
			const json = event.toJSON();

			expect(json.eventName).toBe("civic.audit.completed");
			expect(json.aggregateId).toBe("audit-1");
			expect(json.aggregateType).toBe("AuditTrail");
			expect(json.actId).toBe("act-123");
			expect(json.auditId).toBe("audit-1");
			expect(json.findings).toEqual([
				"Firma coincide",
				"Huella digital verificada",
				"Sellos intactos",
			]);
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should be JSON serializable", () => {
			const json = event.toJSON();
			const jsonString = JSON.stringify(json);

			expect(() => JSON.parse(jsonString)).not.toThrow();
			const parsed = JSON.parse(jsonString);
			expect(parsed.findings).toHaveLength(3);
		});
	});
});

// ===== CASE ESCALATED EVENT =====

describe("CaseEscalatedEvent", () => {
	let event: CaseEscalatedEvent;

	beforeEach(() => {
		event = new CaseEscalatedEvent(
			"case-1",
			"case-1",
			"Se requiere intervención judicial por anomalías detectadas",
			"juzgado-electoral-01",
		);
	});

	describe("constructor", () => {
		it("should initialize with all properties", () => {
			expect(event.aggregateId).toBe("case-1");
			expect(event.caseId).toBe("case-1");
			expect(event.reason).toBe(
				"Se requiere intervención judicial por anomalías detectadas",
			);
			expect(event.escalatedTo).toBe("juzgado-electoral-01");
		});

		it("should inherit from DomainEvent", () => {
			expect(event).toBeInstanceOf(DomainEvent);
			expect(event.eventId).toBeDefined();
			expect(event.occurredOn).toBeInstanceOf(Date);
		});
	});

	describe("eventName", () => {
		it("should return correct event name", () => {
			expect(event.eventName).toBe("civic.case.escalated");
		});
	});

	describe("getPayload", () => {
		it("should return complete payload", () => {
			// @ts-expect-error - accessing protected method for testing
			const payload = event.getPayload();

			expect(payload).toEqual({
				aggregateId: "case-1",
				aggregateType: "CivicCase",
				caseId: "case-1",
				reason: "Se requiere intervención judicial por anomalías detectadas",
				escalatedTo: "juzgado-electoral-01",
			});
		});
	});

	describe("toJSON", () => {
		it("should serialize complete event", () => {
			const json = event.toJSON();

			expect(json.eventName).toBe("civic.case.escalated");
			expect(json.aggregateId).toBe("case-1");
			expect(json.aggregateType).toBe("CivicCase");
			expect(json.caseId).toBe("case-1");
			expect(json.reason).toBe(
				"Se requiere intervención judicial por anomalías detectadas",
			);
			expect(json.escalatedTo).toBe("juzgado-electoral-01");
			expect(json.eventId).toBeDefined();
			expect(json.occurredOn).toBeDefined();
		});

		it("should be JSON serializable", () => {
			const json = event.toJSON();
			const jsonString = JSON.stringify(json);

			expect(() => JSON.parse(jsonString)).not.toThrow();
			const parsed = JSON.parse(jsonString);
			expect(parsed.escalatedTo).toBe("juzgado-electoral-01");
		});
	});
});

// ===== EVENT EMITTER INTERFACE =====

describe("EventEmitter", () => {
	it("should be implementable", () => {
		const emitted: unknown[] = [];

		const emitter: EventEmitter = {
			async emit(event) {
				emitted.push(event);
			},
			async emitMany(events) {
				emitted.push(...events);
			},
		};

		const actEvent = new ActValidatedEvent(
			"act-1",
			"act-1",
			"validator-1",
			"approved",
		);
		const fraudEvent = new FraudDetectedEvent(
			"elec-1",
			"elec-1",
			"act-1",
			FraudIndicator.create({
				type: FraudIndicatorType.TURNOUT_SPIKE,
				severity: FraudSeverity.LOW,
				description: "Pico leve",
				evidence: ["ev-001"],
				detectedAt: new Date(),
			}),
			"LOW",
		);

		emitter.emit(actEvent);
		emitter.emitMany([fraudEvent]);

		expect(emitted).toHaveLength(2);
		expect(emitted[0]).toBeInstanceOf(ActValidatedEvent);
		expect(emitted[1]).toBeInstanceOf(FraudDetectedEvent);
	});

	it("should accept all civic event types via DomainEvent base type", () => {
		const events = [
			new ActValidatedEvent("a1", "a1", "v1", "approved"),
			new FraudDetectedEvent(
				"e1",
				"e1",
				"a1",
				FraudIndicator.create({
					type: FraudIndicatorType.ACT_TAMPERING,
					severity: FraudSeverity.CRITICAL,
					description: "Alteración detectada",
					evidence: [],
					detectedAt: new Date(),
				}),
				"CRITICAL",
			),
			new AuditCompletedEvent("au1", "a1", "au1", ["OK"]),
			new CaseEscalatedEvent("c1", "c1", "Fraude", "fiscalia"),
		];

		const emitter: EventEmitter = {
			async emit(event) {
				expect(event).toBeInstanceOf(DomainEvent);
			},
			async emitMany(events) {
				events.forEach((e) => expect(e).toBeInstanceOf(DomainEvent));
			},
		};

		events.forEach((e) => emitter.emit(e));
		emitter.emitMany(events);
	});
});

// ===== INTEGRATION TESTS =====

describe("Domain Events Integration", () => {
	it("should create multiple events with unique IDs", () => {
		const events = [
			new ActValidatedEvent("a1", "a1", "v1", "approved"),
			new FraudDetectedEvent(
				"e1",
				"e1",
				"a1",
				FraudIndicator.create({
					type: FraudIndicatorType.TURNOUT_SPIKE,
					severity: FraudSeverity.LOW,
					description: "Test",
					evidence: [],
					detectedAt: new Date(),
				}),
				"LOW",
			),
			new AuditCompletedEvent("au1", "a1", "au1", ["OK"]),
			new CaseEscalatedEvent("c1", "c1", "Reason", "fiscalia"),
		];

		const eventIds = events.map((e) => e.eventId);
		const uniqueIds = new Set(eventIds);

		expect(uniqueIds.size).toBe(4);
	});

	it("should serialize all event types consistently", () => {
		const events: DomainEvent[] = [
			new ActValidatedEvent("a1", "a1", "v1", "approved"),
			new FraudDetectedEvent(
				"e1",
				"e1",
				"a1",
				FraudIndicator.create({
					type: FraudIndicatorType.DUPLICATE_VOTER,
					severity: FraudSeverity.MEDIUM,
					description: "Voto duplicado",
					evidence: ["ev-002"],
					detectedAt: new Date(),
				}),
				"MEDIUM",
			),
			new AuditCompletedEvent("au1", "a1", "au1", ["OK"]),
			new CaseEscalatedEvent("c1", "c1", "Reason", "fiscalia"),
		];

		events.forEach((event) => {
			const json = event.toJSON();

			expect(json).toHaveProperty("eventId");
			expect(json).toHaveProperty("eventName");
			expect(json).toHaveProperty("occurredOn");
			expect(typeof json.eventId).toBe("string");
			expect(typeof json.eventName).toBe("string");
			expect(typeof json.occurredOn).toBe("string");
		});
	});

	it("should have correct event names per domain", () => {
		const civicEvents = [
			new ActValidatedEvent("a1", "a1", "v1", "approved"),
			new FraudDetectedEvent(
				"e1",
				"e1",
				"a1",
				FraudIndicator.create({
					type: FraudIndicatorType.TIMESTAMP_IRREGULARITY,
					severity: FraudSeverity.HIGH,
					description: "Timestamp sospechoso",
					evidence: [],
					detectedAt: new Date(),
				}),
				"HIGH",
			),
			new AuditCompletedEvent("au1", "a1", "au1", ["OK"]),
			new CaseEscalatedEvent("c1", "c1", "Reason", "fiscalia"),
		];

		const names = civicEvents.map((e) => e.eventName);

		expect(names).toEqual([
			"civic.act.validated",
			"civic.fraud.detected",
			"civic.audit.completed",
			"civic.case.escalated",
		]);
	});
});
