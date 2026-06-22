import {
	CONTEXT_APPROVAL_STATES,
	CONTEXT_RETRIEVAL_MODES,
} from "@arkelythex/application";
import { describe, expect, it } from "vitest";
import { ContextPolicyService } from "../../context-control-plane/context-policy.service";
import { contextControlPlaneRegistry } from "../../context-control-plane/context-registry";
import { CONTROL_PLANE_SURFACE_IDS } from "../../context-control-plane/context-registry.types";

describe("ContextPolicyService", () => {
	const service = new ContextPolicyService(contextControlPlaneRegistry);

	it("routes bank reconciliation through memory and tools by default", () => {
		const policy = service.resolve({
			surfaceId: CONTROL_PLANE_SURFACE_IDS.BANK_RECONCILIATION,
			tenantId: "tenant-1",
		});

		expect(policy.allowed).toBe(true);
		expect(policy.retrievalMode).toBe(CONTEXT_RETRIEVAL_MODES.MEMORY_AND_TOOLS);
		expect(policy.approvalState).toBe(CONTEXT_APPROVAL_STATES.PENDING);
		expect(policy.allowedCorpora).toEqual([]);
	});

	it("allows documentary corpora only when explicitly approved for the surface", () => {
		const policy = service.resolve({
			surfaceId: CONTROL_PLANE_SURFACE_IDS.PREPARE_SIRE,
			tenantId: "tenant-1",
			requestedCorpora: ["sunat-sire-manuals"],
		});

		expect(policy.allowed).toBe(true);
		expect(policy.retrievalMode).toBe(
			CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
		);
		expect(policy.allowedCorpora).toContain("sunat-sire-manuals");
	});

	it("keeps hybrid-documentary as the default retrieval mode for supervised documentary surfaces", () => {
		const policy = service.resolve({
			surfaceId: CONTROL_PLANE_SURFACE_IDS.PREPARE_SIRE,
			tenantId: "tenant-1",
		});

		expect(policy.allowed).toBe(true);
		expect(policy.retrievalMode).toBe(
			CONTEXT_RETRIEVAL_MODES.HYBRID_DOCUMENTARY,
		);
	});

	it("rejects non-approved corpus usage and keeps documentary retrieval bounded", () => {
		const policy = service.resolve({
			surfaceId: CONTROL_PLANE_SURFACE_IDS.VALIDATE_CPE,
			tenantId: "tenant-1",
			requestedCorpora: ["tenant-ledger-notes"],
		});

		expect(policy.allowed).toBe(false);
		expect(policy.violations[0]?.code).toBe("corpus-not-allowed");
		expect(policy.contextWindow?.maxDocumentResults).toBe(3);
	});
});
