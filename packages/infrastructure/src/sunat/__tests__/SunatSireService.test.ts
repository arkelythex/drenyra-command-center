import { describe, it, expect, mock } from "bun:test";
import { SunatSireService } from "../SunatSireService";
import type { SireRecord, SireSyncRequest } from "../SunatSireService";

// Mock client with vi.fn-like spies
function createMockClient() {
  return {
    solicitarTicketSire: mock(async () => ({
      success: true,
      data: { numTicket: "TKT-001", estado: "PENDIENTE", fechaSolicitud: new Date() },
    })),
    consultarEstadoTicket: mock(async (_ruc: string, _ticket: string) => ({
      success: true,
      data: { numTicket: "TKT-001", estado: "PROCESADO", fechaSolicitud: new Date() },
    })),
    descargarArchivoSire: mock(async (_ruc: string, _cod: string) => ({
      success: true,
      data: {
        nomArchivo: "SIRE_TEST.zip",
        codDescarga: "CD-001",
        desEstado: "DESCARGADO",
        archivo: Buffer.from("202604|001|01/04/2026|01|F001|00000001|6|20123456789|TEST SAC|1000.00|180.00|1180.00|PEN||ACTIVO"),
      },
    })),
  };
}

const defaultSyncRequest: SireSyncRequest = {
  organizationId: 1,
  ruc: "20123456789",
  periodo: "202604",
  tipo: "VENTAS",
};

describe("SunatSireService", () => {
  describe("parseRecords", () => {
    it("parses valid pipe-delimited content", () => {
      const service = new SunatSireService(createMockClient() as any);
      const content = Buffer.from(
        "202604|001|01/04/2026|01|F001|00000001|6|20123456789|TEST SAC|1000.00|180.00|1180.00|PEN|3.75|ACTIVO\n" +
        "202604|002|02/04/2026|03|B001|00000001|1|12345678|CONSUMIDOR|200.00|36.00|236.00|PEN||ACTIVO"
      );

      const records = service.parseRecords(content, "VENTAS");

      expect(records).toHaveLength(2);
      expect(records[0].periodo).toBe("202604");
      expect(records[0].serie).toBe("F001");
      expect(records[0].total).toBe(118000); // 1180.00 × 100 = 118000 cents
      expect(records[0].moneda).toBe("PEN");
      expect(records[0].tipoCambio).toBe(3.75);
    });

    it("skips malformed lines with fewer than 15 fields", () => {
      const service = new SunatSireService(createMockClient() as any);
      const content = Buffer.from(
        "202604|001|01/04/2026|01|F001|00000001|6|20123456789|TEST SAC|1000.00|180.00\n" + // 12 fields
        "202604|002|02/04/2026|01|F001|00000002|6|20546296564|CLIENTE|500.00|90.00|590.00|PEN||ACTIVO" // 15 fields
      );

      const records = service.parseRecords(content, "VENTAS");

      expect(records).toHaveLength(1);
      expect(records[0].numero).toBe("00000002");
    });

    it("returns empty array for empty content", () => {
      const service = new SunatSireService(createMockClient() as any);
      expect(service.parseRecords(Buffer.from(""), "VENTAS")).toHaveLength(0);
      expect(service.parseRecords(Buffer.from("   \n\n  "), "VENTAS")).toHaveLength(0);
    });

    it("parses dates from DD/MM/YYYY format", () => {
      const service = new SunatSireService(createMockClient() as any);
      const content = Buffer.from(
        "202604|001|31/12/2025|01|F001|00000001|6|20123456789|TEST|100.00|18.00|118.00|PEN||"
      );

      const records = service.parseRecords(content, "VENTAS");

      expect(records).toHaveLength(1);
      expect(records[0].fechaEmision.getFullYear()).toBe(2025);
      expect(records[0].fechaEmision.getMonth()).toBe(11); // December (0-indexed)
      expect(records[0].fechaEmision.getDate()).toBe(31);
    });
  });

  describe("findDiscrepancies", () => {
    const localRecords: SireRecord[] = [
      {
        periodo: "202604", correlativo: "001", fechaEmision: new Date(),
        tipoComprobante: "01", serie: "F001", numero: "00000001", tipoDocIdentidad: "6",
        numeroDocIdentidad: "20123456789", razonSocial: "LOCAL SAC", baseImponible: 100000, igv: 18000,
        total: 118000, moneda: "PEN", estado: "ACTIVO",
      },
      {
        periodo: "202604", correlativo: "002", fechaEmision: new Date(),
        tipoComprobante: "01", serie: "F001", numero: "00000099", tipoDocIdentidad: "6",
        numeroDocIdentidad: "20546296564", razonSocial: "LOCAL ONLY SAC", baseImponible: 50000, igv: 9000,
        total: 59000, moneda: "PEN", estado: "ACTIVO",
      },
    ];

    const sireRecords: SireRecord[] = [
      { ...localRecords[0] }, // Matching
      {
        periodo: "202604", correlativo: "003", fechaEmision: new Date(),
        tipoComprobante: "01", serie: "F001", numero: "00000200", tipoDocIdentidad: "6",
        numeroDocIdentidad: "20601234573", razonSocial: "SUNAT ONLY SAC", baseImponible: 200000, igv: 36000,
        total: 236000, moneda: "PEN", estado: "ACTIVO",
      },
    ];

    it("detects FALTA_LOCAL (records in SIRE but not local)", () => {
      const service = new SunatSireService(createMockClient() as any);
      const disc = service.findDiscrepancies([localRecords[0]], sireRecords);

      const faltaLocal = disc.filter((d) => d.tipo === "FALTA_LOCAL");
      expect(faltaLocal).toHaveLength(1);
      expect(faltaLocal[0].comprobante).toBe("F001-00000200");
    });

    it("detects FALTA_SUNAT (records in local but not SIRE)", () => {
      const service = new SunatSireService(createMockClient() as any);
      const disc = service.findDiscrepancies(localRecords, [sireRecords[0]]);

      const faltaSunat = disc.filter((d) => d.tipo === "FALTA_SUNAT");
      expect(faltaSunat).toHaveLength(1);
      expect(faltaSunat[0].comprobante).toBe("F001-00000099");
    });

    it("detects MONTO_DIFERENTE when totals differ by more than 1 cent", () => {
      const service = new SunatSireService(createMockClient() as any);
      const diffLocal = { ...localRecords[0], total: 118000 };
      const diffSire = { ...localRecords[0], total: 118500 }; // diff = 500 > 1 cent

      const disc = service.findDiscrepancies([diffLocal], [diffSire]);

      expect(disc.filter((d) => d.tipo === "MONTO_DIFERENTE")).toHaveLength(1);
    });

    it("does NOT flag MONTO_DIFERENTE for 1 cent tolerance", () => {
      const service = new SunatSireService(createMockClient() as any);
      const diffLocal = { ...localRecords[0], total: 118000 };
      const diffSire = { ...localRecords[0], total: 118001 }; // diff = 1, within tolerance

      const disc = service.findDiscrepancies([diffLocal], [diffSire]);

      expect(disc.filter((d) => d.tipo === "MONTO_DIFERENTE")).toHaveLength(0);
    });

    it("returns empty array for perfectly matching sets", () => {
      const service = new SunatSireService(createMockClient() as any);
      const disc = service.findDiscrepancies(
        [localRecords[0]],
        [{ ...localRecords[0] }],
      );

      expect(disc).toHaveLength(0);
    });
  });

  describe("requestDownload", () => {
    it("delegates to client.solicitarTicketSire with correct params", async () => {
      const mockClient = createMockClient();
      const service = new SunatSireService(mockClient as any);

      const result = await service.requestDownload(defaultSyncRequest);

      expect(mockClient.solicitarTicketSire).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.ticket).toBe("TKT-001");
    });

    it("returns error when client call fails", async () => {
      const mockClient = createMockClient();
      mockClient.solicitarTicketSire = mock(async () => ({
        success: false,
        error: { code: "500", message: "API Error" },
      }));
      const service = new SunatSireService(mockClient as any);

      const result = await service.requestDownload(defaultSyncRequest);

      expect(result.success).toBe(false);
      expect(result.error).toContain("API Error");
    });
  });

  describe("checkStatus", () => {
    it("maps PROCESADO → LISTO", async () => {
      const mockClient = createMockClient();
      const service = new SunatSireService(mockClient as any);

      const status = await service.checkStatus("20123456789", "TKT-001");

      expect(status.estado).toBe("LISTO");
    });

    it("maps PROCESSING → PROCESANDO", async () => {
      const mockClient = createMockClient();
      mockClient.consultarEstadoTicket = mock(async () => ({
        success: true,
        data: { numTicket: "TKT-001", estado: "PROCESANDO", fechaSolicitud: new Date() },
      }));
      const service = new SunatSireService(mockClient as any);

      const status = await service.checkStatus("20123456789", "TKT-001");

      expect(status.estado).toBe("PROCESANDO");
    });

    it("maps PENDIENTE → PENDIENTE", async () => {
      const mockClient = createMockClient();
      mockClient.consultarEstadoTicket = mock(async () => ({
        success: true,
        data: { numTicket: "TKT-001", estado: "PENDIENTE", fechaSolicitud: new Date() },
      }));
      const service = new SunatSireService(mockClient as any);

      const status = await service.checkStatus("20123456789", "TKT-001");

      expect(status.estado).toBe("PENDIENTE");
    });

    it("maps ERROR → ERROR", async () => {
      const mockClient = createMockClient();
      mockClient.consultarEstadoTicket = mock(async () => ({
        success: true,
        data: { numTicket: "TKT-001", estado: "ERROR", fechaSolicitud: new Date() },
      }));
      const service = new SunatSireService(mockClient as any);

      const status = await service.checkStatus("20123456789", "TKT-001");

      expect(status.estado).toBe("ERROR");
    });
  });
});
