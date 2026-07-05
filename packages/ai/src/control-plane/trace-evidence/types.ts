import { z } from "zod";
import {
	type TenantCompanyRucScope,
	TenantCompanyRucScopeSchema,
} from "../contracts";

const nonEmpty = z.string().min(1);

export const EvidenceScopeSchema = z.enum([
	"ledger-entry",
	"policy-artifact",
	"fiscal-document",
]);

export const TraceEvidenceItemSchema = z
	.object({
		sourceRef: nonEmpty,
		hash: nonEmpty,
		scope: EvidenceScopeSchema,
		isRedacted: z.boolean(),
	})
	.refine(
		(item) => item.scope !== "fiscal-document" || item.isRedacted,
		"fiscal-document evidence must be redacted",
	);

export const EvidenceTraceBundleSchema = z
	.object({
		traceId: nonEmpty,
		tenantScope: TenantCompanyRucScopeSchema,
		redactionStatus: z.enum(["redacted", "partially-redacted"]),
		toolCalls: z.array(nonEmpty),
		rationale: nonEmpty,
		evidence: z.array(TraceEvidenceItemSchema),
		approvalLineage: z
			.object({
				approvalId: nonEmpty,
				approvalStatus: z.enum([
					"proposed",
					"validated",
					"approved",
					"rejected",
				]),
				decision: z.enum(["pending", "approved", "rejected"]),
				decisionEvidenceRef: z.string().min(1).optional(),
				decisionEvidenceRedacted: z.boolean().optional(),
			})
			.optional(),
		auditTrail: z
			.array(
				z.object({
					eventType: nonEmpty,
					status: z.enum(["success", "failure"]),
					recordedAt: nonEmpty,
					actorId: nonEmpty,
					actorRole: z.enum(["system", "supervisor", "financial-controller"]),
					reasonCode: nonEmpty,
				}),
			)
			.optional(),
	})
	.refine(
		(bundle) =>
			bundle.redactionStatus === "redacted" ||
			bundle.evidence.every((item) => item.isRedacted),
		"partially-redacted traces cannot contain unredacted evidence",
	)
	.refine((bundle) => {
		const lineage = bundle.approvalLineage;
		if (!lineage || !lineage.decisionEvidenceRef) {
			return true;
		}

		if (lineage.decisionEvidenceRef.startsWith("doc://")) {
			return lineage.decisionEvidenceRedacted === true;
		}

		return true;
	}, "approval lineage fiscal-document evidence must be redacted");

export type EvidenceTraceBundle = z.infer<typeof EvidenceTraceBundleSchema>;

export type TraceLookupInput = {
	traceId: string;
	tenantScope: TenantCompanyRucScope;
};

export type TraceLookupResult =
	| { found: true; bundle: EvidenceTraceBundle }
	| { found: false; reason: "not-found" | "scope-mismatch" };

export type TraceEvidenceStore = {
	save(bundle: EvidenceTraceBundle): EvidenceTraceBundle;
	getScoped(input: TraceLookupInput): TraceLookupResult;
	updateApprovalLineage(input: {
		traceId: string;
		tenantScope: TenantCompanyRucScope;
		approvalLineage: NonNullable<EvidenceTraceBundle["approvalLineage"]>;
	}): TraceLookupResult;
	appendAuditEvent(input: {
		traceId: string;
		tenantScope: TenantCompanyRucScope;
		event: NonNullable<EvidenceTraceBundle["auditTrail"]>[number];
	}): TraceLookupResult;
};
