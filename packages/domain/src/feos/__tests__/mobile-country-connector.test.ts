import { describe, it, expect } from "vitest";
import { MobileSupervision } from "../mobile-supervision";
import { CountryRuntime, DRENYRA_COUNTRY_PACKS } from "../country-runtime";
import { ConnectorRegistry, DRENYRA_CONNECTORS } from "../connector-framework";
import type { Actor } from "../types";

const actor: Actor = { id: "user-1", type: "user", label: "User" };

describe("FEOS-013: MobileSupervision", () => {
  it("sends and retrieves notifications", () => {
    const mobile = new MobileSupervision();
    mobile.addNotification({ id: "n1", title: "Approval needed", body: "Review JE-001", priority: "urgent", category: "approval", read: false, createdAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });
    const all = mobile.getNotifications();
    expect(all.length).toBe(1);
    expect(all[0].priority).toBe("urgent");
  });

  it("tracks read status and pending count", () => {
    const mobile = new MobileSupervision();
    mobile.addNotification({ id: "n1", title: "Urgent", body: "Approve close", priority: "urgent", category: "approval", read: false, createdAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });
    mobile.addNotification({ id: "n2", title: "Normal", body: "Update profile", priority: "normal", category: "status", read: false, createdAt: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });

    expect(mobile.getPendingCount()).toBe(1);
    mobile.markRead("n1");
    expect(mobile.getPendingCount()).toBe(0);
  });

  it("records approval actions", () => {
    const mobile = new MobileSupervision();
    mobile.recordAction({ approvalRequestId: "apr-1", decision: "approved", approvedBy: actor, timestamp: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 } });
    // Action recorded without error
  });
});

describe("FEOS-014: CountryRuntime", () => {
  it("returns available country packs", () => {
    const rt = new CountryRuntime();
    const packs = rt.listAvailable();
    expect(packs.length).toBeGreaterThanOrEqual(6);
    expect(packs.some((p) => p.code === "PE")).toBe(true);
  });

  it("gets Peru tax rules", () => {
    const rt = new CountryRuntime();
    const rules = rt.getTaxRules("PE");
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.some((r) => r.name === "IGV")).toBe(true);
  });

  it("generates fiscal periods for a year", () => {
    const rt = new CountryRuntime();
    const periods = rt.generatePeriods(2026, "PE");
    expect(periods.length).toBe(12);
    expect(periods[0].label).toBe("01/2026");
  });
});

describe("FEOS-015: ConnectorRegistry", () => {
  it("lists connectors", () => {
    const reg = new ConnectorRegistry();
    const all = reg.list();
    expect(all.length).toBeGreaterThanOrEqual(3);
  });

  it("finds connectors by capability", () => {
    const reg = new ConnectorRegistry();
    const found = reg.findByCapability("sire:submit");
    expect(found.length).toBe(1);
    expect(found[0].id).toBe("sunat-sire");
  });

  it("returns operations for a connector", () => {
    const reg = new ConnectorRegistry();
    const ops = reg.getOperations("sunat-sire");
    expect(ops.length).toBeGreaterThan(0);
  });

  it("tracks connector health", () => {
    const reg = new ConnectorRegistry();
    reg.recordHealth({ connectorId: "sunat-sire", status: "operational", lastCheck: { iso: "2026-06-01T00:00:00Z", unix: 1722000000 }, responseTimeMs: 200 });
    const health = reg.getHealth("sunat-sire");
    expect(health?.status).toBe("operational");
  });
});
