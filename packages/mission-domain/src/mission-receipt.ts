/**
 * Mission receipts — cryptographic receipt generation, verification,
 * and evidence hashing.
 *
 * Uses SHA-256 with canonical key-sorted serialization for
 * deterministic, content-addressable receipts.
 */

import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Content that goes into a receipt hash.
 */
export interface ReceiptContent {
  missionId: string;
  companyId: string;
  actorId: string;
  decision: "APPROVE" | "REJECT";
  proposalVersion: number;
  evidenceHash: string;
  previousStatus: string;
  newStatus: string;
  payloadHash: string;
  timestamp: string;
}

/**
 * Evidence item used in computeEvidenceHash.
 * Re-uses the canonical EvidenceItem shape from mission-contracts.
 */
import type { EvidenceItem } from "./mission-contracts.js";

export type { EvidenceItem };

/**
 * Serialize an object with keys sorted alphabetically.
 *
 * This ensures deterministic output regardless of insertion order.
 */
function sortedStringify(obj: Record<string, unknown>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sorted: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    sorted[key] = obj[key];
  }
  return JSON.stringify(sorted);
}

/**
 * Generate a SHA-256 receipt hash with canonical field ordering.
 *
 * Same inputs always produce the same hash, making receipts
 * content-addressable and independently verifiable.
 */
export function generateReceiptHash(content: ReceiptContent): string {
  return createHash("sha256")
    .update(sortedStringify(content as unknown as Record<string, unknown>))
    .digest("hex");
}

/**
 * Verify that a receipt content matches its asserted hash.
 *
 * Uses timing-safe comparison to prevent timing side-channel attacks.
 */
export function verifyReceiptIntegrity(
  content: ReceiptContent,
  assertedHash: string,
): boolean {
  const computed = generateReceiptHash(content);
  const computedBuf = Buffer.from(computed, "hex");
  const assertedBuf = Buffer.from(assertedHash, "hex");

  if (computedBuf.length !== assertedBuf.length) {
    return false;
  }

  return timingSafeEqual(computedBuf, assertedBuf);
}

/**
 * Compute SHA-256 hash of evidence array, sorted by id.
 *
 * Ensures deterministic evidence hashing regardless of array order.
 */
export function computeEvidenceHash(evidence: EvidenceItem[]): string {
  const sorted = [...evidence].sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256").update(JSON.stringify(sorted)).digest("hex");
}
