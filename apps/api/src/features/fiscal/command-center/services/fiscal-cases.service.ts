import type { CreateFiscalCaseInput, UpdateFiscalCaseInput } from "../schemas";
import type {
	AgentRunRecord,
	CaseDocumentRecord,
	CaseEvidenceRecord,
	FiscalCaseRecord,
	FiscalCaseSummary,
	FiscalCommandCenterContext,
} from "../types";

function sameScope(
	row: Pick<
		FiscalCaseRecord,
		"organizationId" | "companyId" | "companyRuc" | "period"
	>,
	ctx: FiscalCommandCenterContext,
): boolean {
	return (
		row.organizationId === ctx.organizationId &&
		row.companyId === ctx.companyId &&
		row.companyRuc === ctx.companyRuc &&
		row.period === ctx.period
	);
}

function byUpdatedDesc(a: FiscalCaseRecord, b: FiscalCaseRecord): number {
	return b.updatedAt.getTime() - a.updatedAt.getTime();
}

/**
 * createFiscalCaseService operation.
 *
 * @param seed - Input for seed.
 * @returns Result of createFiscalCaseService.
 * @example
 * ```ts
 * const result = createFiscalCaseService({});
 * console.log(result);
 * ```
 */
export function createFiscalCaseService(
	seed: {
		cases?: FiscalCaseRecord[];
		documents?: CaseDocumentRecord[];
		evidence?: CaseEvidenceRecord[];
		agentRuns?: AgentRunRecord[];
	} = {},
) {
	const cases = [...(seed.cases ?? [])];
	const documents = [...(seed.documents ?? [])];
	const evidence = [...(seed.evidence ?? [])];
	const agentRuns = [...(seed.agentRuns ?? [])];

	return {
		async list(ctx: FiscalCommandCenterContext) {
			return cases.filter((item) => sameScope(item, ctx)).sort(byUpdatedDesc);
		},

		async getById(id: string, ctx: FiscalCommandCenterContext) {
			return (
				cases.find((item) => item.id === id && sameScope(item, ctx)) ?? null
			);
		},

		async create(
			input: CreateFiscalCaseInput,
			ctx: FiscalCommandCenterContext,
		) {
			const now = new Date();
			const created: FiscalCaseRecord = {
				id: crypto.randomUUID(),
				organizationId: ctx.organizationId,
				companyId: ctx.companyId,
				companyRuc: ctx.companyRuc,
				period: ctx.period,
				countryCode: "PE",
				type: input.type,
				status: "open",
				priority: input.priority ?? "medium",
				title: input.title,
				description: input.description ?? null,
				assignedAgentId: null,
				metadata: input.metadata ?? {},
				createdAt: now,
				updatedAt: now,
			};
			cases.push(created);
			return created;
		},

		async update(
			id: string,
			input: UpdateFiscalCaseInput,
			ctx: FiscalCommandCenterContext,
		) {
			const item = cases.find(
				(candidate) => candidate.id === id && sameScope(candidate, ctx),
			);
			if (!item) return null;

			if (typeof input.status !== "undefined") item.status = input.status;
			if (typeof input.priority !== "undefined") item.priority = input.priority;
			if (typeof input.title !== "undefined") item.title = input.title;
			if (typeof input.description !== "undefined")
				item.description = input.description;
			if (typeof input.assignedAgentId !== "undefined")
				item.assignedAgentId = input.assignedAgentId;
			if (typeof input.metadata !== "undefined") item.metadata = input.metadata;
			item.updatedAt = new Date();
			return item;
		},

		async listSummaries(
			ctx: FiscalCommandCenterContext,
		): Promise<FiscalCaseSummary[]> {
			return cases
				.filter((item) => sameScope(item, ctx))
				.sort(byUpdatedDesc)
				.map((item) => ({
					id: item.id,
					type: item.type,
					title: item.title,
					status: item.status,
					priority: item.priority,
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
					documentCount: documents.filter(
						(doc) =>
							doc.caseId === item.id &&
							doc.companyId === ctx.companyId &&
							doc.companyRuc === ctx.companyRuc &&
							doc.period === ctx.period,
					).length,
					agentRunCount: agentRuns.filter(
						(run) =>
							run.caseId === item.id &&
							run.companyId === ctx.companyId &&
							run.companyRuc === ctx.companyRuc &&
							run.period === ctx.period,
					).length,
				}));
		},

		async getDocuments(caseId: string, ctx: FiscalCommandCenterContext) {
			const fiscalCase = await this.getById(caseId, ctx);
			if (!fiscalCase) return null;
			return documents.filter(
				(doc) =>
					doc.caseId === caseId &&
					doc.companyId === ctx.companyId &&
					doc.companyRuc === ctx.companyRuc &&
					doc.period === ctx.period,
			);
		},

		async getEvidence(caseId: string, ctx: FiscalCommandCenterContext) {
			const fiscalCase = await this.getById(caseId, ctx);
			if (!fiscalCase) return null;
			return evidence.filter(
				(item) =>
					item.caseId === caseId &&
					item.companyId === ctx.companyId &&
					item.companyRuc === ctx.companyRuc &&
					item.period === ctx.period,
			);
		},
	};
}

/**
 * fiscalCaseService const.
 *
 * @example
 * ```ts
 * console.log(fiscalCaseService);
 * ```
 */
export const fiscalCaseService = createFiscalCaseService();
