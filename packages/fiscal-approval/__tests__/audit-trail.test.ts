import { describe, it, expect } from "vitest";
import { createAuditEntry, formatAuditEntry } from "../src/audit-trail";

describe("audit-trail", () => {
	it("creates an audit entry for approval", () => {
		const action = {
			recommendationId: "REC-001",
			action: "approve" as const,
			userId: "contador@drenyra",
			timestamp: "2026-07-09T15:00:00Z",
		};
		const rec = {
			id: "REC-001",
			pipelineRunId: "pipe-001",
			tipoAccion: "contabilizar-igv" as const,
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "Test",
			monto: 18234.5,
			moneda: "PEN",
			confianza: 0.92,
			fuentes: [],
			status: "approved" as const,
			creado: "2026-07-09T14:00:00Z",
			aprobadoPor: "contador@drenyra",
			aprobadoEn: "2026-07-09T15:00:00Z",
		};

		const entry = createAuditEntry(action, rec);

		expect(entry.id).toMatch(/^AUDIT-/);
		expect(entry.action).toBe("approve");
		expect(entry.userId).toBe("contador@drenyra");
		expect(entry.ruc).toBe("20123456789");
		expect(entry.monto).toBe(18234.5);
	});

	it("creates an audit entry for rejection with motivo", () => {
		const action = {
			recommendationId: "REC-002",
			action: "reject" as const,
			userId: "contador@drenyra",
			motivo: "período incorrecto",
			timestamp: "2026-07-09T15:30:00Z",
		};
		const rec = {
			id: "REC-002",
			pipelineRunId: "pipe-002",
			tipoAccion: "aplicar-detraccion" as const,
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "Test",
			monto: 450,
			moneda: "PEN",
			confianza: 0.85,
			fuentes: [],
			status: "rejected" as const,
			creado: "2026-07-09T14:30:00Z",
			aprobadoPor: "contador@drenyra",
			aprobadoEn: "2026-07-09T15:30:00Z",
			motivoRechazo: "período incorrecto",
		};

		const entry = createAuditEntry(action, rec);
		expect(entry.action).toBe("reject");
		expect(entry.motivo).toBe("período incorrecto");
	});

	it("formats audit entry as text", () => {
		const action = {
			recommendationId: "REC-001",
			action: "approve" as const,
			userId: "contador@drenyra",
			timestamp: "2026-07-09T15:00:00Z",
		};
		const rec = {
			id: "REC-001",
			pipelineRunId: "pipe-001",
			tipoAccion: "contabilizar-igv" as const,
			ruc: "20123456789",
			periodo: "2026-07",
			descripcion: "Test",
			monto: 18234.5,
			moneda: "PEN",
			confianza: 0.92,
			fuentes: [],
			status: "approved" as const,
			creado: "2026-07-09T14:00:00Z",
			aprobadoPor: "contador@drenyra",
			aprobadoEn: "2026-07-09T15:00:00Z",
		};

		const entry = createAuditEntry(action, rec);
		const text = formatAuditEntry(entry);

		expect(text).toContain("✅ Aprobada");
		expect(text).toContain("REC-001");
		expect(text).toContain("contador@drenyra");
		expect(text).toContain("18234.50");
	});
});
