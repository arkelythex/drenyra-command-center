import type { JournalEntry } from "@/stores/central-board-store";

export const DEMO_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "je-1",
    date: "15/01/2026",
    cuenta: "6311",
    glosa: "PROVISIÓN SERVICIO CLARO - ENERO 2026",
    debe: 450.5,
    haber: 0,
    status: "pending",
    proposedBy: "agent",
    createdAt: new Date(Date.now() - 300_000).toISOString(),
  },
  {
    id: "je-2",
    date: "15/01/2026",
    cuenta: "1041",
    glosa: "PAGO FACTURA CLARO - BCP MN",
    debe: 0,
    haber: 450.5,
    status: "pending",
    proposedBy: "agent",
    createdAt: new Date(Date.now() - 300_000).toISOString(),
  },
];
