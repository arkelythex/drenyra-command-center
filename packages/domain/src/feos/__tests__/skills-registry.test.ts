import { describe, it, expect } from "vitest";
import { Automation } from "../skills-registry";
import type { FiscalScope, Actor } from "../types";

const testScope: FiscalScope = {
  organizationId: "org-1", companyId: "comp-1",
  companyRuc: "20123456789", fiscalPeriod: "2026-06",
};
const testActor: Actor = { id: "user-1", type: "user", label: "Test User" };

describe("Automation", () => {
  it("creates an active automation", () => {
    const auto = Automation.create({
      name: "Nightly SIRE sync",
      description: "Sync SIRE data nightly",
      skillId: "skill-sire-sync",
      trigger: { type: "schedule", cron: "0 2 * * *" },
      riskLevel: "R2",
      scope: testScope,
      createdBy: testActor,
    });

    expect(auto.id).toBeDefined();
    expect(auto.name).toBe("Nightly SIRE sync");
    expect(auto.status).toBe("active");
    expect(auto.trigger.type).toBe("schedule");
    expect(auto.trigger.cron).toBe("0 2 * * *");
  });

  it("pauses, activates, and disables automation", () => {
    const auto = Automation.create({
      name: "Test automation",
      description: "Test lifecycle",
      skillId: "skill-test",
      trigger: { type: "event", eventType: "invoice.created" },
      riskLevel: "R1",
      scope: testScope,
      createdBy: testActor,
    });

    const paused = auto.pause();
    expect(paused.status).toBe("paused");

    const active = paused.activate();
    expect(active.status).toBe("active");

    const disabled = active.disable();
    expect(disabled.status).toBe("disabled");
  });

  it("records execution and errors", () => {
    const auto = Automation.create({
      name: "Test recording",
      description: "Recording test",
      skillId: "skill-recording",
      trigger: { type: "event", eventType: "document.uploaded" },
      riskLevel: "R1",
      scope: testScope,
      createdBy: testActor,
    });

    const executed = auto.recordExecution();
    expect(executed.lastExecutedAt).toBeDefined();
    expect(executed.lastError).toBeUndefined();
    expect(executed.status).toBe("active");

    const failed = executed.recordError("Connection timeout");
    expect(failed.lastError).toBe("Connection timeout");
    expect(failed.status).toBe("error");
  });
});
