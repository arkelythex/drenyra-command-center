import { describe, expect, it } from "vitest";
import {
  computeEvidenceRootHash,
  createEvidenceRoot,
  createFeosReceipt,
  hashEvidenceContent,
  verifyEvidenceRoot,
  verifyFeosReceipt,
  type EvidenceItem,
} from "@drenyra/domain";

const actor = { id: "agent-1", type: "agent" as const, label: "Agent" };
const scope = { organizationId: "org-1" as never, companyId: "company-1" as never, companyRuc: "20123456789", fiscalPeriod: "2026-06" };
const items: EvidenceItem[] = [
  { id: "doc-1", category: "document", title: "Invoice", hash: "b".repeat(64), timestamp: "2026-06-01T00:00:00.000Z" },
  { id: "calc-1", category: "calculation", title: "Tax calculation", hash: "a".repeat(64), timestamp: "2026-06-01T00:00:00.000Z" },
];

describe("evidence roots and receipts", () => {
  it("hashes equivalent object content deterministically", () => {
    expect(hashEvidenceContent({ b: 2, a: { z: 1, y: 0 } })).toBe(hashEvidenceContent({ a: { y: 0, z: 1 }, b: 2 }));
    expect(hashEvidenceContent("content")).toMatch(/^[a-f0-9]{64}$/);
  });

  it("computes a stable root from sorted item hashes", () => {
    const first = computeEvidenceRootHash(items);
    const reordered = computeEvidenceRootHash([...items].reverse());
    expect(first).toEqual(reordered);
    expect(first.sortedHashes).toEqual(["a".repeat(64), "b".repeat(64)]);
  });

  it("creates and verifies an evidence root", () => {
    const root = createEvidenceRoot({ items, computedBy: actor, scope });
    expect(root).toMatchObject({ items, computedBy: actor, scope, version: "1.0.0" });
    expect(root.id).toHaveLength(16);
    expect(verifyEvidenceRoot(root)).toEqual({ valid: true, errors: [] });
  });

  it("detects tampered evidence root hashes", () => {
    const root = createEvidenceRoot({ items, computedBy: actor, scope });
    const result = verifyEvidenceRoot({ ...root, rootHash: "0".repeat(64) });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/hash mismatch/);
  });

  it("creates and verifies receipts bound to evidence", () => {
    const receipt = createFeosReceipt({ receiptId: "receipt-1", action: "post_journal", actor, scope, evidenceItems: items, actionInput: { amount: 10 }, actionOutput: { posted: true } });
    expect(receipt.inputHash).toMatch(/^[a-f0-9]{64}$/);
    expect(verifyFeosReceipt(receipt)).toEqual({ valid: true, errors: [] });
  });

  it("links receipt chain hashes and detects tampering", () => {
    const first = createFeosReceipt({ receiptId: "receipt-1", action: "prepare", actor, scope, evidenceItems: items, actionInput: {}, actionOutput: {} });
    const second = createFeosReceipt({ receiptId: "receipt-2", action: "submit", actor, scope, evidenceItems: items, actionInput: {}, actionOutput: {}, previousChainHash: first.chainHash });

    expect(second.previousChainHash).toBe(first.chainHash);
    expect(second.chainHash).not.toBe(first.chainHash);
    expect(verifyFeosReceipt({ ...second, chainHash: "f".repeat(64) }).valid).toBe(false);
  });
});
