import { FeosError } from "./types";
import { createHash } from "node:crypto";
export const EVIDENCE_ROOT_VERSION = "1.0.0";
export function hashEvidenceContent(content) {
    const serialized = typeof content === "string"
        ? content
        : JSON.stringify(sortKeys(content));
    return createHash("sha256").update(serialized).digest("hex");
}
function sortKeys(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (Array.isArray(obj))
        return obj.map(sortKeys);
    if (typeof obj === "object" && !(obj instanceof Date)) {
        const sorted = {};
        for (const key of Object.keys(obj).sort()) {
            sorted[key] = sortKeys(obj[key]);
        }
        return sorted;
    }
    return obj;
}
export function computeEvidenceRootHash(items) {
    if (items.length === 0) {
        throw new FeosError("EMPTY_EVIDENCE_ROOT", "Cannot compute evidence root from empty items list");
    }
    const sortedHashes = [...items]
        .map((item) => item.hash)
        .sort();
    const concatenated = sortedHashes.join("");
    const rootHash = createHash("sha256").update(concatenated).digest("hex");
    return { rootHash, sortedHashes };
}
export function createEvidenceRoot(input) {
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
export function verifyEvidenceRoot(root) {
    const errors = [];
    if (root.items.length === 0) {
        errors.push("Evidence root has no items");
        return { valid: false, errors };
    }
    const { rootHash, sortedHashes } = computeEvidenceRootHash(root.items);
    if (rootHash !== root.rootHash) {
        errors.push(`Evidence root hash mismatch: expected "${root.rootHash}", computed "${rootHash}"`);
    }
    const expectedSorted = [...root.items].map((i) => i.hash).sort();
    if (JSON.stringify(sortedHashes) !== JSON.stringify(expectedSorted)) {
        errors.push("Evidence root sorted hashes mismatch");
    }
    return { valid: errors.length === 0, errors };
}
export function evidenceInRoot(item, root) {
    return root.items.some((i) => i.id === item.id && i.hash === item.hash);
}
export const FEOS_RECEIPT_VERSION = "1.0.0";
export function createFeosReceipt(input) {
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
export function verifyFeosReceipt(receipt) {
    const errors = [];
    const evRootResult = verifyEvidenceRoot(receipt.evidenceRoot);
    errors.push(...evRootResult.errors.map((e) => `evidence: ${e}`));
    const previous = receipt.previousChainHash ?? "";
    const expectedChain = createHash("sha256")
        .update(`${previous}:${receipt.inputHash}:${receipt.outputHash}:${receipt.evidenceRoot.rootHash}`)
        .digest("hex");
    if (expectedChain !== receipt.chainHash) {
        errors.push(`Chain hash mismatch: expected "${expectedChain}", got "${receipt.chainHash}"`);
    }
    return { valid: errors.length === 0, errors };
}
//# sourceMappingURL=evidence-root.js.map