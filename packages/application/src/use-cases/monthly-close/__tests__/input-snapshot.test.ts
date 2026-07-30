/**
 * InputSnapshot Tests
 *
 * Tests for the InputSnapshot type and captureInputSnapshot function.
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

import { describe, expect, it } from "vitest";
import {
  captureInputSnapshot,
  type InputSnapshot,
} from "../types/input-snapshot";

describe("InputSnapshot type", () => {
  describe("interface contract", () => {
    it("should accept a valid InputSnapshot object", () => {
      const snapshot: InputSnapshot = {
        fiscalPeriod: "2026-06",
        ledgerVersion: 42,
        invoiceDatasetVersion: 15,
        bankReconciliationVersion: 3,
        exchangeRateSource: "sunat",
        jurisdictionPackageVersion: "PE-2026-v3",
        capturedAt: "2026-07-01T00:00:00.000Z",
      };

      expect(snapshot.fiscalPeriod).toBe("2026-06");
      expect(snapshot.ledgerVersion).toBe(42);
      expect(snapshot.invoiceDatasetVersion).toBe(15);
      expect(snapshot.bankReconciliationVersion).toBe(3);
      expect(snapshot.exchangeRateSource).toBe("sunat");
      expect(snapshot.jurisdictionPackageVersion).toBe("PE-2026-v3");
      expect(snapshot.capturedAt).toBe("2026-07-01T00:00:00.000Z");
    });

    it("should allow ledgerVersion to be null when no entries exist", () => {
      const snapshot: InputSnapshot = {
        fiscalPeriod: "2026-06",
        ledgerVersion: null,
        invoiceDatasetVersion: 0,
        bankReconciliationVersion: 0,
        exchangeRateSource: "manual",
        jurisdictionPackageVersion: "PE-2026-v1",
        capturedAt: "2026-07-01T00:00:00.000Z",
      };

      expect(snapshot.ledgerVersion).toBeNull();
    });

    it("should allow version fields to be null for missing data", () => {
      const snapshot: InputSnapshot = {
        fiscalPeriod: "2026-06",
        ledgerVersion: null,
        invoiceDatasetVersion: null,
        bankReconciliationVersion: null,
        exchangeRateSource: "bcrp",
        jurisdictionPackageVersion: "PE-2026-v2",
        capturedAt: "2026-07-01T00:00:00.000Z",
      };

      expect(snapshot.ledgerVersion).toBeNull();
      expect(snapshot.invoiceDatasetVersion).toBeNull();
      expect(snapshot.bankReconciliationVersion).toBeNull();
    });

    it("should have all required fields present", () => {
      const snapshot: InputSnapshot = {
        fiscalPeriod: "2026-01",
        ledgerVersion: 1,
        invoiceDatasetVersion: 5,
        bankReconciliationVersion: 2,
        exchangeRateSource: "sunat",
        jurisdictionPackageVersion: "PE-2026-v3",
        capturedAt: "2026-02-01T12:00:00.000Z",
      };

      // Verify all fields exist
      const keys = Object.keys(snapshot).sort();
      expect(keys).toEqual([
        "bankReconciliationVersion",
        "capturedAt",
        "exchangeRateSource",
        "fiscalPeriod",
        "invoiceDatasetVersion",
        "jurisdictionPackageVersion",
        "ledgerVersion",
      ]);
    });
  });

  describe("captureInputSnapshot", () => {
    it("should create a snapshot with a valid ISO timestamp", () => {
      const snapshot = captureInputSnapshot("company-1", "2026-06");

      expect(snapshot.fiscalPeriod).toBe("2026-06");
      expect(snapshot.capturedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
      );
    });

    it("should set all version fields to null by default", () => {
      const snapshot = captureInputSnapshot("company-1", "2026-06");

      expect(snapshot.ledgerVersion).toBeNull();
      expect(snapshot.invoiceDatasetVersion).toBeNull();
      expect(snapshot.bankReconciliationVersion).toBeNull();
    });

    it("should use default exchange rate source", () => {
      const snapshot = captureInputSnapshot("company-1", "2026-06");

      expect(snapshot.exchangeRateSource).toBe("sunat");
    });

    it("should use default jurisdiction package version", () => {
      const snapshot = captureInputSnapshot("company-1", "2026-06");

      expect(snapshot.jurisdictionPackageVersion).toBe("PE-2026-v1");
    });

    it("should accept different fiscal periods", () => {
      const periods = ["2026-01", "2026-06", "2026-12"];

      for (const period of periods) {
        const snapshot = captureInputSnapshot("company-1", period);
        expect(snapshot.fiscalPeriod).toBe(period);
      }
    });

    it("should produce unique timestamps on successive calls", async () => {
      const s1 = captureInputSnapshot("company-1", "2026-06");

      // Small delay to ensure different timestamp
      await new Promise((r) => setTimeout(r, 5));

      const s2 = captureInputSnapshot("company-1", "2026-06");

      expect(s1.capturedAt).not.toBe(s2.capturedAt);
    });
  });
});
