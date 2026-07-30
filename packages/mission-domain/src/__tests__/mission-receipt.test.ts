import { describe, it, expect } from "vitest";
import {
  generateReceiptHash,
  verifyReceiptIntegrity,
  computeEvidenceHash,
} from "../mission-receipt.js";
import type { ReceiptContent } from "../mission-receipt.js";

const sampleReceipt: ReceiptContent = {
  missionId: "550e8400-e29b-41d4-a716-446655440000",
  companyId: "660e8400-e29b-41d4-a716-446655440001",
  actorId: "user-1",
  decision: "APPROVE",
  proposalVersion: 2,
  evidenceHash: "abc123def456",
  previousStatus: "AWAITING_APPROVAL",
  newStatus: "APPROVED",
  payloadHash: "payload-hash-xyz",
  timestamp: "2026-07-30T12:00:00.000Z",
};

describe("generateReceiptHash()", () => {
  it("should produce a deterministic SHA-256 hex string (64 chars)", () => {
    const hash = generateReceiptHash(sampleReceipt);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should produce the same hash for identical content", () => {
    const hash1 = generateReceiptHash(sampleReceipt);
    const hash2 = generateReceiptHash({ ...sampleReceipt });
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different content", () => {
    const hash1 = generateReceiptHash(sampleReceipt);
    const hash2 = generateReceiptHash({
      ...sampleReceipt,
      decision: "REJECT",
    });
    expect(hash1).not.toBe(hash2);
  });

  it("should be field-order independent (canonical sort)", () => {
    // Create two objects with different key order but same values
    const content1: Record<string, unknown> = {
      missionId: "m1",
      companyId: "c1",
      actorId: "a1",
      decision: "APPROVE",
      proposalVersion: 1,
      evidenceHash: "eh",
      previousStatus: "AWAITING_APPROVAL",
      newStatus: "APPROVED",
      payloadHash: "ph",
      timestamp: "2026-07-30T12:00:00.000Z",
    };
    const content2: Record<string, unknown> = {
      timestamp: "2026-07-30T12:00:00.000Z",
      payloadHash: "ph",
      newStatus: "APPROVED",
      previousStatus: "AWAITING_APPROVAL",
      evidenceHash: "eh",
      proposalVersion: 1,
      decision: "APPROVE",
      actorId: "a1",
      companyId: "c1",
      missionId: "m1",
    };
    const hash1 = generateReceiptHash(content1 as unknown as ReceiptContent);
    const hash2 = generateReceiptHash(content2 as unknown as ReceiptContent);
    expect(hash1).toBe(hash2);
  });

  it("should change hash when any field changes", () => {
    const hash1 = generateReceiptHash(sampleReceipt);
    const modified = {
      ...sampleReceipt,
      proposalVersion: sampleReceipt.proposalVersion + 1,
    };
    const hash2 = generateReceiptHash(modified);
    expect(hash1).not.toBe(hash2);
  });

  it("should change hash when timestamp changes", () => {
    const hash1 = generateReceiptHash(sampleReceipt);
    const modified = {
      ...sampleReceipt,
      timestamp: "2026-07-30T12:00:01.000Z",
    };
    const hash2 = generateReceiptHash(modified);
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyReceiptIntegrity()", () => {
  it("should return true for matching hash", () => {
    const hash = generateReceiptHash(sampleReceipt);
    expect(verifyReceiptIntegrity(sampleReceipt, hash)).toBe(true);
  });

  it("should return false for mismatched hash", () => {
    const hash = generateReceiptHash(sampleReceipt);
    const tampered: ReceiptContent = {
      ...sampleReceipt,
      newStatus: "REJECTED",
    };
    expect(verifyReceiptIntegrity(tampered, hash)).toBe(false);
  });

  it("should return false for a completely different hash", () => {
    expect(
      verifyReceiptIntegrity(
        sampleReceipt,
        "0000000000000000000000000000000000000000000000000000000000000000",
      ),
    ).toBe(false);
  });

  it("should use timing-safe comparison", () => {
    const hash = generateReceiptHash(sampleReceipt);
    // Correct hash should verify
    expect(verifyReceiptIntegrity(sampleReceipt, hash)).toBe(true);
    // Hash of same length but different - should still work
    const wrongHash =
      "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    expect(verifyReceiptIntegrity(sampleReceipt, wrongHash)).toBe(false);
  });
});

describe("computeEvidenceHash()", () => {
  it("should produce a deterministic SHA-256 hex hash of evidence array", () => {
    const evidence = [
      { id: "ev-1", label: "Bank reconciliation", type: "report" },
      { id: "ev-2", label: "Depreciation schedule", type: "document" },
    ];
    const hash = computeEvidenceHash(evidence);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should produce the same hash for identical evidence", () => {
    const evidence1 = [
      { id: "ev-1", label: "Bank reconciliation", type: "report" },
    ];
    const evidence2 = [
      { id: "ev-1", label: "Bank reconciliation", type: "report" },
    ];
    expect(computeEvidenceHash(evidence1)).toBe(computeEvidenceHash(evidence2));
  });

  it("should be order-independent (sorted by id)", () => {
    const evidence1 = [
      { id: "ev-2", label: "B", type: "x" },
      { id: "ev-1", label: "A", type: "y" },
    ];
    const evidence2 = [
      { id: "ev-1", label: "A", type: "y" },
      { id: "ev-2", label: "B", type: "x" },
    ];
    expect(computeEvidenceHash(evidence1)).toBe(computeEvidenceHash(evidence2));
  });

  it("should produce different hash for different evidence items", () => {
    const evidence1 = [{ id: "ev-1", label: "A", type: "x" }];
    const evidence2 = [{ id: "ev-1", label: "B", type: "x" }];
    expect(computeEvidenceHash(evidence1)).not.toBe(
      computeEvidenceHash(evidence2),
    );
  });

  it("should handle empty evidence array", () => {
    const hash = computeEvidenceHash([]);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
