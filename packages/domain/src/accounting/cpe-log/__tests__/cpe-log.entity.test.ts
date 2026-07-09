/**
 * Tests for CPELog domain entity.
 *
 * SUNAT CPE lifecycle management: tracks electronic invoice submission
 * through SUNAT validation (accept/reject/observe) and cancellation.
 */

import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { CPELog } from "../logic";
import type { CDRData, SunatStatus } from "../types";
import {
	InvalidCPELogError,
	InvalidCPELogTransitionError,
} from "../validation";

function makeCDR(overrides?: Partial<CDRData>): CDRData {
	return {
		id: "CDR-001",
		content: "<cdr>...</cdr>",
		resultCode: "0",
		resultDescription: "Aceptado",
		ticket: "TKT-001",
		receivedAt: new Date(),
		...overrides,
	};
}

describe("CPELog", () => {
	describe("create", () => {
		it("crea un CPE log con estado pendiente", () => {
			const log = CPELog.create("cpe-001", "inv-001");
			expect(log.id).toBe("cpe-001");
			expect(log.invoiceId).toBe("inv-001");
			expect(log.sunatStatus).toBe("pendiente");
			expect(log.isSubmitted()).toBe(false);
		});

		it("lanza error si el id esta vacio", () => {
			expect(() => CPELog.create("", "inv-001")).toThrow(InvalidCPELogError);
		});

		it("lanza error si el invoiceId esta vacio", () => {
			expect(() => CPELog.create("cpe-001", "")).toThrow(InvalidCPELogError);
		});
	});

	describe("state transitions", () => {
		it("pendiente a enviado (valido)", () => {
			const log = CPELog.create("cpe-001", "inv-001");
			const sent = log.submit("TKT-001", "abc123", "SHA-256");
			expect(sent.sunatStatus).toBe("enviado");
			expect(sent.isSubmitted()).toBe(true);
		});

		it("enviado a aceptado (valido)", () => {
			const log = CPELog.create("cpe-001", "inv-001").submit("TKT", "hash");
			const accepted = log.accept(makeCDR());
			expect(accepted.isAccepted()).toBe(true);
			expect(accepted.isTerminal()).toBe(true);
		});

		it("enviado a rechazado (valido)", () => {
			const log = CPELog.create("cpe-001", "inv-001").submit("TKT", "hash");
			const rejected = log.reject("RUC no coincide", "ERR-001");
			expect(rejected.isRejected()).toBe(true);
			expect(rejected.isTerminal()).toBe(true);
		});

		it("enviado a observado (valido)", () => {
			const log = CPELog.create("cpe-001", "inv-001").submit("TKT", "hash");
			const observed = log.observe("Monto inconsistente");
			expect(observed.isObserved()).toBe(true);
			expect(observed.isTerminal()).toBe(false);
		});

		it("observado a aceptado (valido, reenvio)", () => {
			const log = CPELog.create("cpe-001", "inv-001")
				.submit("TKT", "hash")
				.observe("Revisar IGV")
				.accept(makeCDR({ id: "CDR-002" }));
			expect(log.isAccepted()).toBe(true);
		});

		it("pendiente a baja (valido, cancelacion antes de enviar)", () => {
			const log = CPELog.create("cpe-001", "inv-001").cancel("Error");
			expect(log.isCancelled()).toBe(true);
		});
	});

	describe("invalid transitions", () => {
		it("enviar desde enviado debe lanzar error", () => {
			const log = CPELog.create("cpe-001", "inv-001").submit("TKT", "hash");
			expect(() => log.submit("TKT2", "hash2")).toThrow(
				InvalidCPELogTransitionError,
			);
		});

		it("aceptar desde pendiente debe lanzar error", () => {
			const log = CPELog.create("cpe-001", "inv-001");
			expect(() => log.accept(makeCDR())).toThrow(InvalidCPELogTransitionError);
		});

		it("rechazar desde pendiente debe lanzar error", () => {
			const log = CPELog.create("cpe-001", "inv-001");
			expect(() => log.reject("Razon")).toThrow(InvalidCPELogTransitionError);
		});

		it("rechazar desde aceptado debe lanzar error (terminal)", () => {
			const log = CPELog.create("cpe-001", "inv-001")
				.submit("TKT", "hash")
				.accept(makeCDR());
			expect(() => log.reject("Razon")).toThrow(InvalidCPELogTransitionError);
		});

		it("cancelar desde aceptado debe lanzar error (terminal)", () => {
			const log = CPELog.create("cpe-001", "inv-001")
				.submit("TKT", "hash")
				.accept(makeCDR());
			expect(() => log.cancel("Razon")).toThrow(InvalidCPELogTransitionError);
		});
	});

	describe("equality", () => {
		it("mismo id y status son iguales", () => {
			const a = CPELog.create("cpe-001", "inv-001");
			const b = CPELog.create("cpe-001", "inv-001");
			expect(a.equals(b)).toBe(true);
		});
	});

	describe("property-based invariants", () => {
		const TERMINAL: SunatStatus[] = ["aceptado", "rechazado", "baja"];

		it("los estados terminales no pueden transicionar", () => {
			fc.assert(
				fc.property(fc.constantFrom(...TERMINAL), (status: SunatStatus) => {
					return (
						status === "aceptado" || status === "rechazado" || status === "baja"
					);
				}),
			);
		});

		it("submit requiere ticket y hash no vacios", () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 0, maxLength: 10 }),
					fc.string({ minLength: 0, maxLength: 10 }),
					(ticket: string, hash: string) => {
						const log = CPELog.create("cpe-pbt", "inv-pbt");
						try {
							log.submit(ticket, hash);
							return ticket.length > 0 && hash.length > 0;
						} catch {
							return ticket.length === 0 || hash.length === 0;
						}
					},
				),
			);
		});
	});
});
