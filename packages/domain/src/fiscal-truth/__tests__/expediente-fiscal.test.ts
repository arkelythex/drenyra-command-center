import { describe, it, expect } from "vitest";
import {
  buildDefaultCierreChecklist,
  calculateCierreProgress,
  EXPEDIENTE_STATUS_LABELS,
  EXPEDIENTE_KIND_LABELS,
  EXPEDIENTE_STATUS_COLORS,
  ExpedienteStatus,
  ExpedienteKind,
  CierreMensualChecklistItem,
} from "../expediente-fiscal";

describe("ExpedienteFiscal — buildDefaultCierreChecklist", () => {
  it("returns exactly 10 items", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    expect(items).toHaveLength(10);
  });

  it("prefixes IDs with expedienteId", () => {
    const items = buildDefaultCierreChecklist("exp-abc-123");
    for (const item of items) {
      expect(item.id).toMatch(/^exp-abc-123/);
    }
  });

  it("orders items by orden 1 through 10", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    for (let i = 0; i < items.length; i++) {
      expect(items[i].orden).toBe(i + 1);
    }
  });

  it("sets requiresEvidencia correctly", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    const evidenciaItems = items.filter((i) => i.requiereEvidencia);
    const noEvidenciaItems = items.filter((i) => !i.requiereEvidencia);

    expect(evidenciaItems.length).toBeGreaterThan(0);
    expect(noEvidenciaItems.length).toBeGreaterThan(0);
  });
});

describe("ExpedienteFiscal — risk distribution", () => {
  it("has 6 HIGH risk items", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    const high = items.filter((i) => i.riesgo === "HIGH");
    expect(high).toHaveLength(6);
  });

  it("has 3 MEDIUM risk items", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    const medium = items.filter((i) => i.riesgo === "MEDIUM");
    expect(medium).toHaveLength(3);
  });

  it("has 1 LOW risk item", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    const low = items.filter((i) => i.riesgo === "LOW");
    expect(low).toHaveLength(1);
  });

  it("includes critical fiscal checks", () => {
    const items = buildDefaultCierreChecklist("exp-001");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Conciliación bancaria");
    expect(labels).toContain("Validación SIRE Compras");
    expect(labels).toContain("Validación SIRE Ventas");
    expect(labels).toContain("Cálculo y verificación IGV");
    expect(labels).toContain("Firma del contador");
    expect(labels).toContain("Firma del representante legal");
  });
});

describe("ExpedienteFiscal — calculateCierreProgress", () => {
  function makeChecklist(completedCount: number): CierreMensualChecklistItem[] {
    return Array.from({ length: 10 }, (_, i) => ({
      id: `chk-${i}`,
      label: `Item ${i}`,
      descripcion: `Description ${i}`,
      completado: i < completedCount,
      requiereEvidencia: false,
      riesgo: "LOW" as const,
      orden: i + 1,
    }));
  }

  it("returns 0 for empty checklist", () => {
    expect(calculateCierreProgress([])).toBe(0);
  });

  it("returns 0 when nothing completed", () => {
    expect(calculateCierreProgress(makeChecklist(0))).toBe(0);
  });

  it("returns 0.5 when 5 of 10 completed", () => {
    expect(calculateCierreProgress(makeChecklist(5))).toBe(0.5);
  });

  it("returns 1.0 when all completed", () => {
    expect(calculateCierreProgress(makeChecklist(10))).toBe(1.0);
  });
});

describe("ExpedienteFiscal — constant mappings", () => {
  const allStatuses: ExpedienteStatus[] = [
    "ABIERTO",
    "EN_PROCESO",
    "PENDIENTE_REVISION",
    "PENDIENTE_APROBACION",
    "CERRADO",
    "ARCHIVADO",
  ];

  const allKinds: ExpedienteKind[] = [
    "CIERRE_MENSUAL",
    "SIRE_COMPRAS",
    "SIRE_VENTAS",
    "CONCILIACION_BANCARIA",
    "AUDITORIA_FISCAL",
    "DECLARACION_JURADA",
    "DETRACCIONES",
    "PERCEPCIONES",
    "RETENCIONES",
    "GENERAL",
  ];

  it("EXPEDIENTE_STATUS_LABELS covers all statuses", () => {
    for (const s of allStatuses) {
      expect(EXPEDIENTE_STATUS_LABELS[s]).toBeDefined();
      expect(typeof EXPEDIENTE_STATUS_LABELS[s]).toBe("string");
    }
  });

  it("EXPEDIENTE_KIND_LABELS covers all kinds", () => {
    for (const k of allKinds) {
      expect(EXPEDIENTE_KIND_LABELS[k]).toBeDefined();
      expect(typeof EXPEDIENTE_KIND_LABELS[k]).toBe("string");
    }
  });

  it("EXPEDIENTE_STATUS_COLORS covers all statuses", () => {
    for (const s of allStatuses) {
      expect(EXPEDIENTE_STATUS_COLORS[s]).toBeDefined();
      expect(EXPEDIENTE_STATUS_COLORS[s]).toMatch(/^var\(--color-/);
    }
  });
});
