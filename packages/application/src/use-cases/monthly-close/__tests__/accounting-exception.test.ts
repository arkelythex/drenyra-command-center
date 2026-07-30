/**
 * AccountingException Tests
 *
 * Tests for the AccountingException type and factory functions.
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

import { describe, expect, it } from "vitest";
import {
  type AccountingException,
  type ExceptionSeverity,
  type ResolutionStatus,
  createAccountingException,
  EXCEPTION_CODES,
} from "../types/accounting-exception";

// ─── ExceptionSeverity type ────────────────────────────────────────────────

describe("ExceptionSeverity type", () => {
  it("should accept 'info' severity", () => {
    const severity: ExceptionSeverity = "info";
    expect(severity).toBe("info");
  });

  it("should accept 'warning' severity", () => {
    const severity: ExceptionSeverity = "warning";
    expect(severity).toBe("warning");
  });

  it("should accept 'blocking' severity", () => {
    const severity: ExceptionSeverity = "blocking";
    expect(severity).toBe("blocking");
  });
});

// ─── ResolutionStatus type ─────────────────────────────────────────────────

describe("ResolutionStatus type", () => {
  it("should accept 'open'", () => {
    const status: ResolutionStatus = "open";
    expect(status).toBe("open");
  });

  it("should accept 'resolved'", () => {
    const status: ResolutionStatus = "resolved";
    expect(status).toBe("resolved");
  });

  it("should accept 'waived'", () => {
    const status: ResolutionStatus = "waived";
    expect(status).toBe("waived");
  });
});

// ─── AccountingException interface ─────────────────────────────────────────

describe("AccountingException interface", () => {
  it("should accept a valid exception object", () => {
    const ex: AccountingException = {
      id: "ex-001",
      missionId: "mission-001",
      code: "UNMATCHED_TRANSACTION",
      severity: "warning",
      subjectRef: "bankTx:uuid-123",
      evidenceRefs: ["ev-001", "ev-002"],
      resolutionStatus: "open",
    };

    expect(ex.id).toBe("ex-001");
    expect(ex.missionId).toBe("mission-001");
    expect(ex.code).toBe("UNMATCHED_TRANSACTION");
    expect(ex.severity).toBe("warning");
    expect(ex.subjectRef).toBe("bankTx:uuid-123");
    expect(ex.evidenceRefs).toEqual(["ev-001", "ev-002"]);
    expect(ex.resolutionStatus).toBe("open");
  });

  it("should support info severity", () => {
    const ex: AccountingException = {
      id: "ex-002",
      missionId: "mission-002",
      code: "LOW_CONFIDENCE_CATEGORIZATION",
      severity: "info",
      subjectRef: "entry:uuid-456",
      evidenceRefs: [],
      resolutionStatus: "open",
    };

    expect(ex.severity).toBe("info");
  });

  it("should support blocking severity", () => {
    const ex: AccountingException = {
      id: "ex-003",
      missionId: "mission-003",
      code: "MISSING_DOCUMENT",
      severity: "blocking",
      subjectRef: "doc:uuid-789",
      evidenceRefs: ["ev-003"],
      resolutionStatus: "open",
    };

    expect(ex.severity).toBe("blocking");
  });

  it("should support resolved resolutionStatus", () => {
    const ex: AccountingException = {
      id: "ex-004",
      missionId: "mission-004",
      code: "TAX_CALCULATION_ANOMALY",
      severity: "warning",
      subjectRef: "tax:uuid-101",
      evidenceRefs: [],
      resolutionStatus: "resolved",
    };

    expect(ex.resolutionStatus).toBe("resolved");
  });

  it("should support waived resolutionStatus", () => {
    const ex: AccountingException = {
      id: "ex-005",
      missionId: "mission-005",
      code: "EXCHANGE_RATE_DEVIATION",
      severity: "info",
      subjectRef: "rate:USD-PEN",
      evidenceRefs: [],
      resolutionStatus: "waived",
    };

    expect(ex.resolutionStatus).toBe("waived");
  });
});

// ─── EXCEPTION_CODES ──────────────────────────────────────────────────────

describe("EXCEPTION_CODES", () => {
  it("should contain all expected exception codes", () => {
    expect(EXCEPTION_CODES).toContain("UNMATCHED_TRANSACTION");
    expect(EXCEPTION_CODES).toContain("LOW_CONFIDENCE_CATEGORIZATION");
    expect(EXCEPTION_CODES).toContain("SUNAT_DISCREPANCY");
    expect(EXCEPTION_CODES).toContain("MISSING_DOCUMENT");
    expect(EXCEPTION_CODES).toContain("INVALID_ACCOUNT_CODE");
    expect(EXCEPTION_CODES).toContain("UNBALANCED_PROPOSAL");
    expect(EXCEPTION_CODES).toContain("EXCHANGE_RATE_DEVIATION");
    expect(EXCEPTION_CODES).toContain("MISSING_EVIDENCE");
    expect(EXCEPTION_CODES).toContain("TAX_CALCULATION_ANOMALY");
  });
});

// ─── createAccountingException factory ─────────────────────────────────────

describe("createAccountingException", () => {
  it("should create an exception with all required fields", () => {
    const ex = createAccountingException({
      missionId: "mission-010",
      code: "UNMATCHED_TRANSACTION",
      severity: "warning",
      subjectRef: "bankTx:uuid-abc",
    });

    expect(ex.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ex.missionId).toBe("mission-010");
    expect(ex.code).toBe("UNMATCHED_TRANSACTION");
    expect(ex.severity).toBe("warning");
    expect(ex.subjectRef).toBe("bankTx:uuid-abc");
    expect(ex.resolutionStatus).toBe("open");
    expect(ex.evidenceRefs).toEqual([]);
  });

  it("should accept optional evidence refs", () => {
    const ex = createAccountingException({
      missionId: "mission-011",
      code: "SUNAT_DISCREPANCY",
      severity: "blocking",
      subjectRef: "cpe:uuid-def",
      evidenceRefs: ["ev-010", "ev-011"],
    });

    expect(ex.evidenceRefs).toEqual(["ev-010", "ev-011"]);
  });

  it("should default resolutionStatus to 'open'", () => {
    const ex = createAccountingException({
      missionId: "mission-012",
      code: "MISSING_EVIDENCE",
      severity: "warning",
      subjectRef: "evidence:none",
    });

    expect(ex.resolutionStatus).toBe("open");
  });

  it("should generate unique IDs for each exception", () => {
    const ex1 = createAccountingException({
      missionId: "mission-013",
      code: "EXCHANGE_RATE_DEVIATION",
      severity: "info",
      subjectRef: "rate:USD",
    });

    const ex2 = createAccountingException({
      missionId: "mission-013",
      code: "EXCHANGE_RATE_DEVIATION",
      severity: "info",
      subjectRef: "rate:EUR",
    });

    expect(ex1.id).not.toBe(ex2.id);
  });
});
