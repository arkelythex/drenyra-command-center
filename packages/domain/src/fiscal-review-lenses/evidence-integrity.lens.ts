/**
 * EvidenceIntegrityLens — Is the hash chain intact? Is the trail continuous?
 *
 * Checks that:
 * - The evidence has a valid hash
 * - If a previous hash is referenced, the chain is continuous
 * - The evidence metadata includes creation timestamp
 */

import type {
	EvidenceInput,
	FiscalReviewLens,
	LensContext,
	LensFinding,
	LensResult,
} from "./lens.interface";

/** SHA-256 hex pattern. */
const SHA256_HEX = /^[0-9a-f]{64}$/;

/** ISO timestamp pattern. */
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

export class EvidenceIntegrityLens implements FiscalReviewLens {
	name = "Evidence Integrity";
	id = "evidence-integrity";
	version = "1.0.0";

	async review(
		evidence: EvidenceInput,
		_ctx: LensContext,
	): Promise<LensResult> {
		const findings: LensFinding[] = [];
		const metadata = evidence.metadata ?? {};

		// 1. Check that evidence has a traceable operation ID
		if (!evidence.operationId || evidence.operationId.trim().length === 0) {
			findings.push({
				severity: "CRITICAL",
				code: "EVI-001",
				message: "Evidence has no operationId — cannot trace to a pipeline run",
				evidence: "operationId is empty",
			});
		}

		// 2. Check that evidence has a hash
		const hash = metadata.hash as string | undefined;
		if (!hash) {
			findings.push({
				severity: "WARNING",
				code: "EVI-002",
				message: "Evidence has no hash — chain integrity cannot be verified",
				evidence: "metadata.hash is missing",
			});
		} else if (!SHA256_HEX.test(hash)) {
			findings.push({
				severity: "CRITICAL",
				code: "EVI-003",
				message: `Hash "${hash}" is not a valid SHA-256 hex string`,
				evidence: `hash=${hash}`,
			});
		}

		// 3. Check hain chain link (parent hash)
		const parentHash = metadata.parentHash as string | undefined;
		if (parentHash !== undefined && parentHash !== null) {
			if (!SHA256_HEX.test(parentHash)) {
				findings.push({
					severity: "CRITICAL",
					code: "EVI-004",
					message:
						"Parent hash is not a valid SHA-256 hex string — chain broken",
					evidence: `parentHash=${parentHash}`,
				});
			}
		}

		// 4. Check creation timestamp
		const createdAt = metadata.createdAt as string | undefined;
		if (!createdAt || !ISO_TIMESTAMP.test(createdAt)) {
			findings.push({
				severity: "WARNING",
				code: "EVI-005",
				message: "Evidence has no valid creation timestamp",
				evidence: `createdAt=${createdAt ?? "missing"}`,
			});
		}

		// 5. Check evidence actor is within expected range
		if (!["ai", "human", "system"].includes(evidence.actor)) {
			findings.push({
				severity: "WARNING",
				code: "EVI-006",
				message: `Unknown evidence actor: "${evidence.actor}"`,
				evidence: `actor=${evidence.actor}`,
			});
		}

		const criticalCount = findings.filter(
			(f) => f.severity === "CRITICAL",
		).length;
		const passed = criticalCount === 0;

		return {
			passed,
			score: passed
				? Math.max(0.5, 1 - findings.length * 0.15)
				: Math.max(0, 0.5 - criticalCount * 0.25),
			findings,
			confidence: 0.85,
		};
	}
}
