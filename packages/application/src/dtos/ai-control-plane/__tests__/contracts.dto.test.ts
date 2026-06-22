import { describe, expect, it } from "vitest";
import {
	AdvisoryOutputEnvelopeSchema,
	DeterministicHandoffEnvelopeSchema,
} from "../contracts.dto";

describe("AI control-plane DTO contracts", () => {
	it("rejects handoff without approved advisory lineage", () => {
		const result = DeterministicHandoffEnvelopeSchema.safeParse({
			handoffId: "handoff-1",
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			approvalState: "proposed",
			commandSource: "deterministic-command",
			commandRef: "application.command.apply-journal",
		});

		expect(result.success).toBe(false);
	});

	it("rejects advisory envelope when marked authoritative", () => {
		const result = AdvisoryOutputEnvelopeSchema.safeParse({
			advisoryId: "advisory-1",
			traceId: "trace-1",
			tenantScope: {
				tenantId: "tenant-1",
				organizationId: "org-1",
				companyId: "company-1",
				ruc: "20123456789",
			},
			summary: "suggest reconciliation follow-up",
			advisoryOnly: false,
			authoritativeMutationProhibited: false,
		});

		expect(result.success).toBe(false);
	});
});
