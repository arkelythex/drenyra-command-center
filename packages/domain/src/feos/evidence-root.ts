/**
 * FEOS-010 — Evidence Root and Receipt Protocol
 *
 * Evidence root hashing protocol that extends the existing RED (Receipt-Driven Execution)
 * system. An Evidence Root is the cryptographic anchor for a set of evidence items
 * that collectively support a financial action (journal entry, SIRE filing, close).
 *
 * Protocol:
 * 1. Collect evidence items (documents, calculations, validations)
 * 2. Compute evidence root hash = sha256(concat(sorted evidence hashes))
 * 3. Create receipt with evidence root as part of the input
 * 4. Before execution: recompute evidence root + verify receipt chain
 *
 * @module @drenyra/domain/feos/evidence-root
 */

import type { Actor, FiscalScope, Timestamp } from "./types";
import { FeosError } from "./types";
import { createHash } from "node:crypto";

// ============================================================================
// Evidence Item
// ============================================================================

export type EvidenceCategory =
  | "document"        // Original document (PDF, XML, image)
  | "calculation"     // Numerical computation (IGV calc, reconciliation)
  | "validation"      // Deterministic check result (balance check, cross-field)
  | "approval"        // Approval record
  | "audit"           // Audit trail entry
  | "external"        // External verification (SUNAT CDR, bank statement)
  | "receipt"         // Receipt from another action
  ;

export interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  title: string;
  hash: string;             // SHA-256 of the evidence content
  timestamp: string;        // ISO 8601
  size?: number;            // Size in bytes (for documents)
  mimeType?: string;         // For documents
  ref?: string;              // External reference or URL
  tags?: string[];
}

// ============================================================================
// Evidence Root
// ============================================================================

export interface EvidenceRoot {
  /** Unique ID for this evidence root. */
  id: string;
  /** SHA-256 of all evidence items (sorted by hash, concatenated, hashed). */
  rootHash: string;
  /** The evidence items included in this root. */
  items: EvidenceItem[];
  /** Individual hashes in sorted order (for audit proof). */
  sortedHashes: string[];
  /** When this root was computed. */
  computedAt: Timestamp;
  /** Who/what computed it. */
  computedBy: Actor;
  /** Fiscal scope. */
  scope: FiscalScope;
  /** Schema version. */
  version: string;
}

export const EVIDENCE_ROOT_VERSION = "1.0.0";

/**
 * Compute the SHA-256 hash of an evidence item's content.
 * The content is serialized deterministically.
 */
export function hashEvidenceContent(content: unknown): string {
  const serialized = typeof content === "string"
    ? content
    : JSON.stringify(sortKeys(content));
  return createHash("sha256").update(serialized).digest("hex");
}

/**
 * Deep sort object keys for deterministic serialization.
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
      sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

/**
 * Compute the evidence root hash from a set of evidence items.
 * The algorithm: sort items by hash, concatenate hashes, SHA-256 the result.
 */
export function computeEvidenceRootHash(items: EvidenceItem[]): {
  rootHash: string;
  sortedHashes: string[];
} {
  if (items.length === 0) {
    throw new FeosError(
      "EMPTY_EVIDENCE_ROOT",
      "Cannot compute evidence root from empty items list",
    );
  }

  const sortedHashes = [...items]
    .map((item) => item.hash)
    .sort();

  const concatenated = sortedHashes.join("");
  const rootHash = createHash("sha256").update(concatenated).digest("hex");

  return { rootHash, sortedHashes };
}

/**
 * Create an EvidenceRoot from a set of evidence items.
 */
export function createEvidenceRoot(input: {
  items: EvidenceItem[];
  computedBy: Actor;
  scope: FiscalScope;
}): EvidenceRoot {
  const { rootHash, sortedHashes } = computeEvidenceRootHash(input.items);

  return {
    id: createHash("sha256")
      .update(`${rootHash}:${input.scope.organizationId}:${Date.now()}`)
      .digest("hex")
      .slice(0, 16),
    rootHash,
    items: input.items,
    sortedHashes,
    computedAt: { iso: new Date().toISOString(), unix: Date.now() },
    computedBy: input.computedBy,
    scope: input.scope,
    version: EVIDENCE_ROOT_VERSION,
  };
}

/**
 * Verify that an evidence root matches its items.
 * Re-computes the hash and compares.
 */
export function verifyEvidenceRoot(root: EvidenceRoot): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (root.items.length === 0) {
    errors.push("Evidence root has no items");
    return { valid: false, errors };
  }

  const { rootHash, sortedHashes } = computeEvidenceRootHash(root.items);

  if (rootHash !== root.rootHash) {
    errors.push(
      `Evidence root hash mismatch: expected "${root.rootHash}", computed "${rootHash}"`,
    );
  }

  const expectedSorted = [...root.items].map((i) => i.hash).sort();
  if (JSON.stringify(sortedHashes) !== JSON.stringify(expectedSorted)) {
    errors.push("Evidence root sorted hashes mismatch");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if a specific evidence item is included in an evidence root.
 */
export function evidenceInRoot(item: EvidenceItem, root: EvidenceRoot): boolean {
  return root.items.some((i) => i.id === item.id && i.hash === item.hash);
}

// ============================================================================
// Receipt with Evidence Root (extends RED)
// ============================================================================

/**
 * A full execution receipt that includes an evidence root.
 * This extends the RED system with FEOS evidence root binding.
 */
export interface FeosReceipt {
  /** Receipt ID (links to existing RED receipt). */
  receiptId: string;
  /** Action that was performed. */
  action: string;
  /** ISO timestamp. */
  timestamp: string;
  /** Who performed it. */
  actor: Actor;
  /** Fiscal scope. */
  scope: FiscalScope;
  /** The evidence root that supports this action. */
  evidenceRoot: EvidenceRoot;
  /** SHA-256 of the action input. */
  inputHash: string;
  /** SHA-256 of the action output. */
  outputHash: string;
  /** Chain hash linking to previous receipt. */
  chainHash: string;
  /** Previous receipt's chain hash (for linking). */
  previousChainHash?: string | undefined;
  /** Schema version. */
  version: string;
}

export const FEOS_RECEIPT_VERSION = "1.0.0";

/**
 * Create a FeosReceipt from an action and its supporting evidence.
 */
export function createFeosReceipt(input: {
  receiptId: string;
  action: string;
  actor: Actor;
  scope: FiscalScope;
  evidenceItems: EvidenceItem[];
  actionInput: unknown;
  actionOutput: unknown;
  previousChainHash?: string;
}): FeosReceipt {
  const evidenceRoot = createEvidenceRoot({
    items: input.evidenceItems,
    computedBy: input.actor,
    scope: input.scope,
  });

  const inputSerialized = JSON.stringify(sortKeys(input.actionInput));
  const outputSerialized = JSON.stringify(sortKeys(input.actionOutput));
  const inputHash = createHash("sha256").update(inputSerialized).digest("hex");
  const outputHash = createHash("sha256").update(outputSerialized).digest("hex");

  const previous = input.previousChainHash ?? "";
  const chainPayload = `${previous}:${inputHash}:${outputHash}:${evidenceRoot.rootHash}`;
  const chainHash = createHash("sha256").update(chainPayload).digest("hex");

  return {
    receiptId: input.receiptId,
    action: input.action,
    timestamp: new Date().toISOString(),
    actor: input.actor,
    scope: input.scope,
    evidenceRoot,
    inputHash,
    outputHash,
    chainHash,
    previousChainHash: input.previousChainHash,
    version: FEOS_RECEIPT_VERSION,
  };
}

/**
 * Verify a FeosReceipt — checks evidence root integrity and chain hash.
 */
export function verifyFeosReceipt(receipt: FeosReceipt): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Verify evidence root
  const evRootResult = verifyEvidenceRoot(receipt.evidenceRoot);
  errors.push(...evRootResult.errors.map((e) => `evidence: ${e}`));

  // 2. Verify chain hash
  const previous = receipt.previousChainHash ?? "";
  const expectedChain = createHash("sha256")
    .update(`${previous}:${receipt.inputHash}:${receipt.outputHash}:${receipt.evidenceRoot.rootHash}`)
    .digest("hex");

  if (expectedChain !== receipt.chainHash) {
    errors.push(
      `Chain hash mismatch: expected "${expectedChain}", got "${receipt.chainHash}"`,
    );
  }

  return { valid: errors.length === 0, errors };
}

// ============================================================================
// Evidence Store Interface
// ============================================================================

export interface EvidenceRootStore {
  /** Store an evidence root. */
  store(root: EvidenceRoot): Promise<void>;
  /** Retrieve an evidence root by ID. */
  get(id: string): Promise<EvidenceRoot | null>;
  /** Store a FeosReceipt. */
  storeReceipt(receipt: FeosReceipt): Promise<void>;
  /** Retrieve a FeosReceipt by ID. */
  getReceipt(id: string): Promise<FeosReceipt | null>;
  /** Get all evidence roots for a scope. */
  listForScope(scope: FiscalScope): Promise<EvidenceRoot[]>;
  /** Verify a stored receipt against its stored evidence. */
  verifyStoredReceipt(receiptId: string): Promise<{ valid: boolean; errors: string[] }>;
}
