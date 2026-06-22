import { describe, it, expect, beforeEach } from "vitest";
import { useAccountingStore } from "../accounting-store";
import type { ProposedEntry } from "../accounting-types";

const STORAGE_KEY = "codex-accounting-state";

function readPersistedState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function createMockEntry(overrides?: Partial<ProposedEntry>): ProposedEntry {
  return {
    id: overrides?.id ?? "entry-1",
    date: "2026-04-15",
    glosa: "Test entry",
    entries: [
      { cuenta: "10", cuentaLabel: "Caja", debe: 1000, haber: 0 },
      { cuenta: "70", cuentaLabel: "Ventas", debe: 0, haber: 1000 },
    ],
    status: "pending",
    proposedBy: "human",
    createdAt: "2026-04-15T10:00:00Z",
    ...overrides,
  };
}

describe("AccountingStore", () => {
  beforeEach(() => {
    useAccountingStore.setState({
      activeCompanyId: null,
      activePeriodId: null,
      activeModule: "asientos",
      financialReports: [],
      kpiMetrics: [],
      proposedEntries: [],
    });
  });

  it("should set active company", () => {
    useAccountingStore.getState().setActiveCompany("comp-2");
    expect(useAccountingStore.getState().activeCompanyId).toBe("comp-2");
  });

  it("should set active company to null", () => {
    useAccountingStore.getState().setActiveCompany(null);
    expect(useAccountingStore.getState().activeCompanyId).toBeNull();
  });

  it("should set active period", () => {
    useAccountingStore.getState().setActivePeriod("per-2026-03");
    expect(useAccountingStore.getState().activePeriodId).toBe("per-2026-03");
  });

  it("should set active module", () => {
    useAccountingStore.getState().setActiveModule("facturas");
    expect(useAccountingStore.getState().activeModule).toBe("facturas");
  });

  it("should set financial reports", () => {
    const reports = [
      {
        id: "rep-1",
        type: "balance" as const,
        title: "Balance General",
        period: "2026-04",
        data: { totalAssets: 500000 },
      },
    ];
    useAccountingStore.getState().setFinancialReports(reports);
    expect(useAccountingStore.getState().financialReports).toHaveLength(1);
    expect(useAccountingStore.getState().financialReports[0].title).toBe(
      "Balance General",
    );
  });

  it("should set KPI metrics", () => {
    const metrics = [
      {
        id: "kpi-test",
        label: "Test KPI",
        value: 10,
        previousValue: 8,
        variance: 25,
        trend: "up" as const,
        format: "number" as const,
      },
    ];
    useAccountingStore.getState().setKpiMetrics(metrics);
    expect(useAccountingStore.getState().kpiMetrics).toHaveLength(1);
  });

  it("should add a proposed entry", () => {
    const entry = createMockEntry();
    useAccountingStore.getState().addProposedEntry(entry);
    expect(useAccountingStore.getState().proposedEntries).toHaveLength(1);
  });

  it("should update a proposed entry", () => {
    const entry = createMockEntry();
    useAccountingStore.getState().addProposedEntry(entry);
    useAccountingStore.getState().updateProposedEntry("entry-1", {
      glosa: "Updated glosa",
    });
    expect(useAccountingStore.getState().proposedEntries[0].glosa).toBe(
      "Updated glosa",
    );
  });

  it("should approve a proposed entry", () => {
    const entry = createMockEntry();
    useAccountingStore.getState().addProposedEntry(entry);
    useAccountingStore.getState().approveProposedEntry("entry-1");
    expect(useAccountingStore.getState().proposedEntries[0].status).toBe(
      "approved",
    );
  });

  it("should reject a proposed entry", () => {
    const entry = createMockEntry();
    useAccountingStore.getState().addProposedEntry(entry);
    useAccountingStore.getState().rejectProposedEntry("entry-1");
    expect(useAccountingStore.getState().proposedEntries[0].status).toBe(
      "rejected",
    );
  });

  it("should approve all proposed entries", () => {
    useAccountingStore
      .getState()
      .addProposedEntry(createMockEntry({ id: "e1" }));
    useAccountingStore
      .getState()
      .addProposedEntry(
        createMockEntry({ id: "e2", status: "reviewing" }),
      );
    useAccountingStore
      .getState()
      .addProposedEntry(
        createMockEntry({ id: "e3", status: "rejected" }),
      );

    useAccountingStore.getState().approveAllProposed();

    const entries = useAccountingStore.getState().proposedEntries;
    expect(entries.find((e) => e.id === "e1")?.status).toBe("approved");
    expect(entries.find((e) => e.id === "e2")?.status).toBe("approved");
    // Rejected should remain rejected
    expect(entries.find((e) => e.id === "e3")?.status).toBe("rejected");
  });

  it("should return the active company via getActiveCompany", () => {
    const companies = useAccountingStore.getState().companies;
    useAccountingStore.getState().setActiveCompany("comp-2");
    const active = useAccountingStore.getState().getActiveCompany();
    expect(active).not.toBeNull();
    expect(active?.id).toBe("comp-2");
    expect(active?.name).toBe("Distribuidora Norte EIRL");
  });

  it("should return null from getActiveCompany when no company set", () => {
    useAccountingStore.getState().setActiveCompany(null);
    expect(useAccountingStore.getState().getActiveCompany()).toBeNull();
  });

  it("should return the active period via getActivePeriod", () => {
    useAccountingStore.getState().setActivePeriod("per-2026-01");
    const active = useAccountingStore.getState().getActivePeriod();
    expect(active).not.toBeNull();
    expect(active?.id).toBe("per-2026-01");
    expect(active?.label).toBe("Enero 2026");
  });

  it("should return null from getActivePeriod when no period set", () => {
    useAccountingStore.getState().setActivePeriod(null);
    expect(useAccountingStore.getState().getActivePeriod()).toBeNull();
  });

  it("should only persist activeCompanyId, activePeriodId, and activeModule", () => {
    // Make changes to persisted fields
    useAccountingStore.getState().setActiveCompany("comp-3");
    useAccountingStore.getState().setActivePeriod("per-2026-01");
    useAccountingStore.getState().setActiveModule("facturas");

    // Make a transient change that should NOT persist
    useAccountingStore.getState().addProposedEntry(createMockEntry());
    useAccountingStore.getState().setFinancialReports([
      {
        id: "rep-1",
        type: "balance",
        title: "Balance",
        period: "2026-04",
        data: {},
      },
    ]);

    const persisted = readPersistedState();
    expect(persisted).not.toBeNull();

    // These SHOULD persist
    expect(persisted.state.activeCompanyId).toBe("comp-3");
    expect(persisted.state.activePeriodId).toBe("per-2026-01");
    expect(persisted.state.activeModule).toBe("facturas");

    // These should NOT persist (transient/seed data)
    expect(persisted.state).not.toHaveProperty("companies");
    expect(persisted.state).not.toHaveProperty("periods");
    expect(persisted.state).not.toHaveProperty("kpiMetrics");
    expect(persisted.state).not.toHaveProperty("proposedEntries");
    expect(persisted.state).not.toHaveProperty("financialReports");
  });
});
