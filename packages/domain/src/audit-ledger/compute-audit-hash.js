import { normalizeJson } from "./normalize-json";
export async function computeAuditHash(payload, prevHash) {
    const input = normalizeJson(payload) + (prevHash ?? "GENESIS");
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
//# sourceMappingURL=compute-audit-hash.js.map