/**
 * CPELog Value Object — Tests
 *
 * Covers:
 * - Happy path: valid CPE log creation
 * - Error states: invalid IDs
 * - State transitions: submit, accept, reject, observe, cancel
 * - State queries: isSubmitted, isAccepted, isTerminal
 */

import { describe, expect, it } from "vitest";
import {
	type CDRData,
	CPELog,
	InvalidCPELogError,
	InvalidCPELogTransitionError,
} from "../cpe-log";

describe("CPELog", () => {
	const makeCDR = (overrides: Partial<CDRData> = {}): CDRData => ({
		id: "cdr-001",
		content: "<cdr>...</cdr>",
		resultCode: "0",
		resultDescription: "Aceptado",
		ticket: "TKT-123",
		receivedAt: new Date("2026-05-15T10:00:00Z"),
		...overrides,
	});

	// --- Happy Path ---

	it("should create a valid CPE log", () => {
		const log = CPELog.create("cpe-1", "inv-1");

		expect(log.id).toBe("cpe-1");
		expect(log.invoiceId).toBe("inv-1");
		expect(log.sunatStatus).toBe("pendiente");
		expect(log.isSubmitted()).toBe(false);
	});

	// --- Error States ---

	it("should reject empty ID", () => {
		expect(() => CPELog.create("", "inv-1")).toThrow(InvalidCPELogError);
	});

	it("should reject empty invoiceId", () => {
		expect(() => CPELog.create("cpe-1", "")).toThrow(InvalidCPELogError);
	});

	// --- State Transitions: Submit ---

	it("should transition from pendiente to enviado", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123", "SHA-256");

		expect(submitted.sunatStatus).toBe("enviado");
		expect(submitted.sunatTicket).toBe("TKT-456");
		expect(submitted.hashValue).toBe("abc123");
		expect(submitted.hashAlgorithm).toBe("SHA-256");
		expect(submitted.submittedAt).toBeInstanceOf(Date);
		expect(log.sunatStatus).toBe("pendiente"); // original unchanged
	});

	it("should use default hash algorithm", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");

		expect(submitted.hashAlgorithm).toBe("SHA-256");
	});

	it("should reject submit from enviado", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		expect(() => submitted.submit("TKT-789", "def456")).toThrow(
			InvalidCPELogTransitionError,
		);
	});

	it("should reject submit with empty ticket", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(() => log.submit("", "abc123")).toThrow(InvalidCPELogError);
	});

	it("should reject submit with empty hash", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(() => log.submit("TKT-456", "")).toThrow(InvalidCPELogError);
	});

	// --- State Transitions: Accept ---

	it("should transition from enviado to aceptado", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const cdr = makeCDR();
		const accepted = submitted.accept(cdr);

		expect(accepted.sunatStatus).toBe("aceptado");
		expect(accepted.cdr?.id).toBe("cdr-001");
		expect(accepted.acceptedAt).toBeInstanceOf(Date);
		expect(accepted.isAccepted()).toBe(true);
	});

	it("should transition from observado to aceptado", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const observed = submitted.observe("Documento con observaciones");
		const cdr = makeCDR();
		const accepted = observed.accept(cdr);

		expect(accepted.sunatStatus).toBe("aceptado");
	});

	it("should reject accept from pendiente", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(() => log.accept(makeCDR())).toThrow(InvalidCPELogTransitionError);
	});

	it("should reject accept with empty CDR ID", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		expect(() => submitted.accept(makeCDR({ id: "" }))).toThrow(
			InvalidCPELogError,
		);
	});

	// --- State Transitions: Reject ---

	it("should transition from enviado to rechazado", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const rejected = submitted.reject("RUC no coincide", "ERR-001");

		expect(rejected.sunatStatus).toBe("rechazado");
		expect(rejected.errorMessage).toBe("RUC no coincide");
		expect(rejected.errorCode).toBe("ERR-001");
		expect(rejected.rejectedAt).toBeInstanceOf(Date);
		expect(rejected.isRejected()).toBe(true);
	});

	it("should reject reject without error code", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const rejected = submitted.reject("Error general");

		expect(rejected.errorCode).toBeNull();
	});

	it("should reject reject from pendiente", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(() => log.reject("reason")).toThrow(InvalidCPELogTransitionError);
	});

	it("should reject reject with empty reason", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		expect(() => submitted.reject("")).toThrow(InvalidCPELogError);
	});

	// --- State Transitions: Observe ---

	it("should transition from enviado to observado", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const observed = submitted.observe("IGV no coincide con base");

		expect(observed.sunatStatus).toBe("observado");
		expect(observed.observedAt).toBeInstanceOf(Date);
		expect(observed.isObserved()).toBe(true);
	});

	it("should reject observe from pendiente", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(() => log.observe("observación")).toThrow(
			InvalidCPELogTransitionError,
		);
	});

	it("should reject observe with empty observation", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		expect(() => submitted.observe("")).toThrow(InvalidCPELogError);
	});

	// --- State Transitions: Cancel (Baja) ---

	it("should transition from pendiente to baja", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const cancelled = log.cancel("Emisión duplicada");

		expect(cancelled.sunatStatus).toBe("baja");
		expect(cancelled.cancelledAt).toBeInstanceOf(Date);
		expect(cancelled.isCancelled()).toBe(true);
	});

	it("should transition from enviado to baja", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const cancelled = submitted.cancel("Error en datos");

		expect(cancelled.isCancelled()).toBe(true);
	});

	it("should reject cancel from aceptado (terminal)", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const accepted = submitted.accept(makeCDR());
		expect(() => accepted.cancel("Ya aceptado")).toThrow(
			InvalidCPELogTransitionError,
		);
	});

	it("should reject cancel from rechazado (terminal)", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const rejected = submitted.reject("error");
		expect(() => rejected.cancel("Ya rechazado")).toThrow(
			InvalidCPELogTransitionError,
		);
	});

	it("should reject cancel with empty reason", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(() => log.cancel("")).toThrow(InvalidCPELogError);
	});

	// --- State Queries ---

	it("should correctly report isTerminal", () => {
		const pendiente = CPELog.create("cpe-1", "inv-1");
		expect(pendiente.isTerminal()).toBe(false);

		const submitted = pendiente.submit("TKT", "hash");
		expect(submitted.isTerminal()).toBe(false);

		const accepted = submitted.accept(makeCDR());
		expect(accepted.isTerminal()).toBe(true);

		const rejected = submitted.reject("error");
		expect(rejected.isTerminal()).toBe(true);

		const cancelled = pendiente.cancel("cancelled");
		expect(cancelled.isTerminal()).toBe(true);
	});

	it("should correctly report isSubmitted", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(log.isSubmitted()).toBe(false);

		const submitted = log.submit("TKT", "hash");
		expect(submitted.isSubmitted()).toBe(true);
	});

	// --- Equality & Serialization ---

	it("should detect equal CPE logs", () => {
		const a = CPELog.create("cpe-1", "inv-1");
		const b = CPELog.create("cpe-1", "inv-1");
		expect(a.equals(b)).toBe(true);
	});

	it("should detect non-equal CPE logs", () => {
		const a = CPELog.create("cpe-1", "inv-1");
		const b = CPELog.create("cpe-2", "inv-1");
		expect(a.equals(b)).toBe(false);
	});

	it("should return false for null/undefined", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(log.equals(null)).toBe(false);
		expect(log.equals(undefined)).toBe(false);
	});

	it("should serialize to JSON", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		const submitted = log.submit("TKT-456", "abc123");
		const accepted = submitted.accept(makeCDR());
		const json = accepted.toJSON();

		expect(json.id).toBe("cpe-1");
		expect(json.invoiceId).toBe("inv-1");
		expect(json.sunatStatus).toBe("aceptado");
		expect(json.sunatTicket).toBe("TKT-456");
		expect(json.hashValue).toBe("abc123");
		expect(json.cdr).toBeTruthy();
	});

	it("should stringify correctly", () => {
		const log = CPELog.create("cpe-1", "inv-1");
		expect(log.toString()).toBe("CPELog(cpe-1, inv-1, pendiente)");
	});
});
